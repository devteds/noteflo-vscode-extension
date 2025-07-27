import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { jsPDF } from 'jspdf';

interface TimeEntry {
  start_time: string;
  end_time: string;
  description: string;
  duration_minutes: number;
}

interface NoteFloConfig {
  business: {
    name: string;
    address: string;
    email: string;
    phone?: string;
    website?: string;
    logoPath?: string;
  };
  client: {
    name: string;
    contact?: string;
    address?: string;
    email?: string;
  };
  billing: {
    hourlyRate: number;
    currency: string;
    taxRate: number;
    paymentInstructions: string;
    invoiceNotes: string;
  };
  preferences: {
    timezone: string;
  };
}

interface InvoiceData {
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string;
  period: string;
  timeEntries: TimeEntry[];
  totalHours: number;
  hourlyRate: number;
  currency: string;
  subtotal: number;
  tax: number;
  total: number;
  taxRate: number;
}

// Utility function to format dates in configured timezone
export function formatDateInTimezone(date: Date = new Date(), timezone: string = 'America/Chicago', format: 'iso' | 'readable' | 'date-only' | 'date-time' = 'iso'): string {
  switch (format) {
    case 'iso':
      return date.toLocaleString('sv-SE', { timeZone: timezone }).replace(' ', 'T');
    case 'readable':
      return date.toLocaleString('en-US', {
        timeZone: timezone,
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    case 'date-only':
      return date.toLocaleDateString('en-CA', { timeZone: timezone }); // YYYY-MM-DD format
    case 'date-time':
      return date.toLocaleString('en-US', {
        timeZone: timezone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    default:
      return date.toLocaleString('sv-SE', { timeZone: timezone }).replace(' ', 'T');
  }
}

// Get timezone from config
export function getConfiguredTimezone(workspaceRoot: string): string {
  const configPath = path.join(workspaceRoot, '.noteflo', 'config.json');
  try {
    if (fs.existsSync(configPath)) {
      const config: NoteFloConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      return config.preferences?.timezone || 'America/Chicago';
    }
  } catch (error) {
    console.warn('Error reading timezone from config:', error);
  }
  return 'America/Chicago'; // Default to CST
}

export class InvoiceGenerator {
  private workspaceRoot: string;
  private timeTrackingDir: string;
  private invoicesDir: string;

  constructor(workspaceRoot: string) {
    this.workspaceRoot = workspaceRoot;
    this.timeTrackingDir = path.join(workspaceRoot, 'docs', 'time-tracking');
    this.invoicesDir = path.join(workspaceRoot, 'docs', 'client-invoices');
    this.ensureDirectories();
  }

  private ensureDirectories(): void {
    if (!fs.existsSync(this.invoicesDir)) {
      fs.mkdirSync(this.invoicesDir, { recursive: true });
    }
  }

  async generateInvoice(): Promise<void> {
    // Get period (month) to invoice
    const timezone = getConfiguredTimezone(this.workspaceRoot);
    const period = await vscode.window.showInputBox({
      prompt: 'Invoice period (YYYY-MM format)',
      value: formatDateInTimezone(new Date(), timezone, 'date-only').slice(0, 7),
      validateInput: (value) => {
        const regex = /^\d{4}-\d{2}$/;
        if (!regex.test(value)) {
          return 'Please enter period in YYYY-MM format (e.g., 2024-01)';
        }
        return null;
      }
    });
    if (!period) return;

    // Get configuration
    const config = this.loadNoteFloConfig();

    // Validate required settings
    if (!config.business.name || !config.business.email || !config.client.name || !config.billing.hourlyRate) {
      vscode.window.showErrorMessage('Please ensure all required fields are configured in .noteflo/config.json');
      return;
    }

    // Load time entries for the period
    const timeEntries = this.loadTimeEntriesForPeriod(period);

    if (timeEntries.length === 0) {
      vscode.window.showWarningMessage(`No time entries found for ${period}`);
      return;
    }

    // Calculate invoice data
    const invoiceData = this.calculateInvoiceData(period, timeEntries, config);

    // Generate invoice number
    const invoiceNumber = this.generateInvoiceNumber(period);
    invoiceData.invoiceNumber = invoiceNumber;

    // Generate both markdown and PDF
    await this.generateMarkdownInvoice(invoiceData, config);
    await this.generatePDFInvoice(invoiceData, config);

    // Open the markdown invoice
    const markdownPath = path.join(this.invoicesDir, `${invoiceNumber}.md`);
    const document = await vscode.workspace.openTextDocument(markdownPath);
    await vscode.window.showTextDocument(document);

    vscode.window.showInformationMessage(
      `💰 Generated invoice: ${invoiceNumber} (${invoiceData.totalHours.toFixed(1)}h @ ${invoiceData.currency}${invoiceData.hourlyRate}/h = ${invoiceData.currency}${invoiceData.total.toFixed(2)}) - Both MD & PDF created!`
    );
  }

  private generateInvoiceNumber(period: string): string {
    const year = period.split('-')[0];
    const month = period.split('-')[1];

    // Find existing invoices for this year to get next number
    let invoiceCounter = 1;
    if (fs.existsSync(this.invoicesDir)) {
      const invoices = fs.readdirSync(this.invoicesDir)
        .filter(f => f.startsWith(`INV-${year}-`) && f.endsWith('.md'))
        .map(f => {
          const match = f.match(/INV-\d{4}-(\d{3})/);
          return match ? parseInt(match[1]) : 0;
        })
        .filter(n => n > 0);

      if (invoices.length > 0) {
        invoiceCounter = Math.max(...invoices) + 1;
      }
    }

    return `INV-${year}-${invoiceCounter.toString().padStart(3, '0')}`;
  }

  private loadTimeEntriesForPeriod(period: string): TimeEntry[] {
    const timeEntriesFile = path.join(this.timeTrackingDir, `time_entries_${period}.json`);

    if (!fs.existsSync(timeEntriesFile)) {
      return [];
    }

    try {
      const allEntries: TimeEntry[] = JSON.parse(fs.readFileSync(timeEntriesFile, 'utf8'));
      return allEntries;
    } catch (error) {
      vscode.window.showErrorMessage(`Error reading time entries: ${error}`);
      return [];
    }
  }

  private calculateInvoiceData(period: string, timeEntries: TimeEntry[], config: NoteFloConfig): InvoiceData {
    const totalMinutes = timeEntries.reduce((sum, entry) => sum + entry.duration_minutes, 0);
    const totalHours = totalMinutes / 60;
    const hourlyRate = config.billing.hourlyRate;
    const currency = config.billing.currency;
    const taxRate = config.billing.taxRate;

    const subtotal = totalHours * hourlyRate;
    const tax = subtotal * (taxRate / 100);
    const total = subtotal + tax;

    const timezone = getConfiguredTimezone(this.workspaceRoot);
    const invoiceDate = formatDateInTimezone(new Date(), timezone, 'date-only');
    const dueDate = formatDateInTimezone(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), timezone, 'date-only');

    return {
      invoiceNumber: '', // Will be set later
      invoiceDate,
      dueDate,
      period,
      timeEntries,
      totalHours,
      hourlyRate,
      currency,
      subtotal,
      tax,
      total,
      taxRate
    };
  }

  private async generateMarkdownInvoice(invoiceData: InvoiceData, config: NoteFloConfig): Promise<void> {
    const timezone = getConfiguredTimezone(this.workspaceRoot);
    const businessName = config.business.name;
    const businessAddress = config.business.address.replace(/\\n/g, '\n');
    const businessEmail = config.business.email;
    const businessPhone = config.business.phone;
    const businessWebsite = config.business.website;

    const clientName = config.client.name;
    const clientContact = config.client.contact;
    const clientAddress = config.client.address ? config.client.address.replace(/\\n/g, '\n') : '';
    const clientEmail = config.client.email;

    const paymentInstructions = config.billing.paymentInstructions;
    const invoiceNotes = config.billing.invoiceNotes;

    const content = `# Invoice ${invoiceData.invoiceNumber}

## Invoice Details
- **Invoice Number**: ${invoiceData.invoiceNumber}
- **Date Issued**: ${invoiceData.invoiceDate}
- **Due Date**: ${invoiceData.dueDate}
- **Period**: ${invoiceData.period}

## From
**${businessName}**${businessAddress ? `\n${businessAddress}` : ''}${businessEmail ? `\nEmail: ${businessEmail}` : ''}${businessPhone ? `\nPhone: ${businessPhone}` : ''}${businessWebsite ? `\nWebsite: ${businessWebsite}` : ''}

## To
**${clientName}**${clientContact ? `\nAttn: ${clientContact}` : ''}${clientAddress ? `\n${clientAddress}` : ''}${clientEmail ? `\nEmail: ${clientEmail}` : ''}

## Time Entries

| Date | Description | Hours |
|------|-------------|-------|
${invoiceData.timeEntries.map(entry => {
      const date = formatDateInTimezone(new Date(entry.start_time), timezone, 'date-only');
      const hours = (entry.duration_minutes / 60).toFixed(1);
      const description = entry.description.substring(0, 50) + (entry.description.length > 50 ? '...' : '');
      return `| ${date} | ${description} | ${hours}h |`;
    }).join('\n')}

## Summary

| Item | Rate | Hours | Amount |
|------|------|-------|--------|
| Consulting Services | ${invoiceData.currency}${invoiceData.hourlyRate}/hour | ${invoiceData.totalHours.toFixed(1)} | ${invoiceData.currency}${invoiceData.subtotal.toFixed(2)} |
${invoiceData.taxRate > 0 ? `| Tax (${invoiceData.taxRate}%) | | | ${invoiceData.currency}${invoiceData.tax.toFixed(2)} |` : ''}
| **Total Due** | | | **${invoiceData.currency}${invoiceData.total.toFixed(2)}** |

## Payment Instructions

${paymentInstructions}

## Notes

${invoiceNotes}

---

*Generated on ${formatDateInTimezone(new Date(), timezone, 'readable')} by NoteFlo Extension*
`;

    const markdownPath = path.join(this.invoicesDir, `${invoiceData.invoiceNumber}.md`);
    fs.writeFileSync(markdownPath, content);
  }

  private async generatePDFInvoice(invoiceData: InvoiceData, config: NoteFloConfig): Promise<void> {
    const timezone = getConfiguredTimezone(this.workspaceRoot);
    const doc = new jsPDF();
    const layout = new PDFLayout(doc);

    // Invoice Header
    layout.addTitle(`INVOICE ${invoiceData.invoiceNumber}`, 20);
    layout.addSpace(15);

    // Invoice Details
    layout.addText(`Date Issued: ${invoiceData.invoiceDate}`, 10);
    layout.addText(`Due Date: ${invoiceData.dueDate}`, 10);
    layout.addText(`Period: ${invoiceData.period}`, 10);
    layout.addLine();

    // Two-column layout for FROM/TO
    layout.addTwoColumns(
      // Left column (FROM)
      () => {
        layout.addSubheading('FROM:');
        layout.addText(config.business.name, 10, 'bold');
        if (config.business.address) {
          config.business.address.split('\n').forEach(line => {
            if (line.trim()) layout.addText(line.trim(), 10);
          });
        }
        if (config.business.email) layout.addText(`Email: ${config.business.email}`, 10);
        if (config.business.phone) layout.addText(`Phone: ${config.business.phone}`, 10);
      },
      // Right column (TO)
      () => {
        layout.addSubheading('TO:');
        layout.addText(config.client.name, 10, 'bold');
        if (config.client.contact) layout.addText(`Attn: ${config.client.contact}`, 10);
        if (config.client.address) {
          config.client.address.split('\n').forEach(line => {
            if (line.trim()) layout.addText(line.trim(), 10);
          });
        }
        if (config.client.email) layout.addText(`Email: ${config.client.email}`, 10);
      }
    );

    layout.addLine();

    // Time Entries Table
    layout.addSubheading('TIME ENTRIES:');
    layout.addTable(
      ['Date', 'Description', 'Hours'],
      [30, 100, 25],
      invoiceData.timeEntries.map(entry => [
        formatDateInTimezone(new Date(entry.start_time), timezone, 'date-only'),
        entry.description.length > 45 ? entry.description.substring(0, 45) + '...' : entry.description,
        (entry.duration_minutes / 60).toFixed(1) + 'h'
      ])
    );

    layout.addLine();

    // Summary Section
    layout.addSubheading('SUMMARY:');
    layout.addRightAlignedSummary([
      {
        label: `Consulting Services (${invoiceData.totalHours.toFixed(1)}h @ ${invoiceData.currency} ${invoiceData.hourlyRate}/h):`,
        value: `${invoiceData.currency} ${invoiceData.subtotal.toFixed(2)}`
      },
      ...(invoiceData.taxRate > 0 ? [{
        label: `Tax (${invoiceData.taxRate}%):`,
        value: `${invoiceData.currency} ${invoiceData.tax.toFixed(2)}`
      }] : []),
      {
        label: 'TOTAL DUE:',
        value: `${invoiceData.currency} ${invoiceData.total.toFixed(2)}`,
        isTotal: true
      }
    ]);

    // Footer sections
    if (config.billing.paymentInstructions) {
      layout.addSpace(15);
      layout.addSubheading('PAYMENT INSTRUCTIONS:');
      config.billing.paymentInstructions.split('\n').forEach(line => {
        if (line.trim()) layout.addText(line.trim(), 10);
      });
    }

    if (config.billing.invoiceNotes) {
      layout.addSpace(10);
      layout.addSubheading('NOTES:');
      config.billing.invoiceNotes.split('\n').forEach(line => {
        if (line.trim()) layout.addText(line.trim(), 10);
      });
    }

    // Save PDF
    const pdfPath = path.join(this.invoicesDir, `${invoiceData.invoiceNumber}.pdf`);
    doc.save(pdfPath);
  }

  async viewInvoices(): Promise<void> {
    if (!fs.existsSync(this.invoicesDir)) {
      vscode.window.showInformationMessage('No invoices directory found. Generate an invoice first.');
      return;
    }

    const invoices = fs.readdirSync(this.invoicesDir).filter(f => f.endsWith('.md'));

    if (invoices.length === 0) {
      vscode.window.showInformationMessage('No invoices found. Generate an invoice first.');
      return;
    }

    const selectedInvoice = await vscode.window.showQuickPick(
      invoices.map(f => f.replace('.md', '')),
      { placeHolder: 'Select invoice to view' }
    );

    if (!selectedInvoice) return;

    const invoicePath = path.join(this.invoicesDir, `${selectedInvoice}.md`);
    const document = await vscode.workspace.openTextDocument(invoicePath);
    await vscode.window.showTextDocument(document);
  }

  async configureNoteFlo(): Promise<void> {
    const configDir = path.join(this.workspaceRoot, '.noteflo');
    const configPath = path.join(configDir, 'config.json');

    // Create .noteflo directory if it doesn't exist
    if (!fs.existsSync(configDir)) {
      fs.mkdirSync(configDir, { recursive: true });
    }

    // Check if config already exists
    let existingConfig: Partial<NoteFloConfig> = {};
    if (fs.existsSync(configPath)) {
      try {
        existingConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      } catch (error) {
        vscode.window.showErrorMessage(`Error reading existing config: ${error}`);
      }
    }

    // Collect configuration through input boxes
    const businessName = await vscode.window.showInputBox({
      prompt: 'Your business/freelancer name',
      value: existingConfig.business?.name || '',
      validateInput: (value) => value.trim() ? null : 'Business name is required'
    });
    if (!businessName) return;

    const businessEmail = await vscode.window.showInputBox({
      prompt: 'Your business email',
      value: existingConfig.business?.email || '',
      validateInput: (value) => value.includes('@') ? null : 'Valid email is required'
    });
    if (!businessEmail) return;

    const businessAddress = await vscode.window.showInputBox({
      prompt: 'Your business address (use \\n for line breaks)',
      value: existingConfig.business?.address || ''
    });

    const businessPhone = await vscode.window.showInputBox({
      prompt: 'Your business phone (optional)',
      value: existingConfig.business?.phone || ''
    });

    const businessWebsite = await vscode.window.showInputBox({
      prompt: 'Your business website (optional)',
      value: existingConfig.business?.website || ''
    });

    const clientName = await vscode.window.showInputBox({
      prompt: 'Client/company name',
      value: existingConfig.client?.name || '',
      validateInput: (value) => value.trim() ? null : 'Client name is required'
    });
    if (!clientName) return;

    const clientContact = await vscode.window.showInputBox({
      prompt: 'Client contact person (optional)',
      value: existingConfig.client?.contact || ''
    });

    const clientEmail = await vscode.window.showInputBox({
      prompt: 'Client email (optional)',
      value: existingConfig.client?.email || ''
    });

    const clientAddress = await vscode.window.showInputBox({
      prompt: 'Client address (optional, use \\n for line breaks)',
      value: existingConfig.client?.address || ''
    });

    const hourlyRateStr = await vscode.window.showInputBox({
      prompt: 'Hourly rate (numbers only)',
      value: existingConfig.billing?.hourlyRate?.toString() || '8500',
      validateInput: (value) => {
        const num = parseFloat(value);
        return !isNaN(num) && num > 0 ? null : 'Valid hourly rate required';
      }
    });
    if (!hourlyRateStr) return;

    const currency = await vscode.window.showInputBox({
      prompt: 'Currency (e.g., INR, USD, EUR)',
      value: existingConfig.billing?.currency || 'INR'
    });
    if (!currency) return;

    const taxRateStr = await vscode.window.showInputBox({
      prompt: 'Tax rate percentage (e.g., 18 for 18%, 0 for no tax)',
      value: existingConfig.billing?.taxRate?.toString() || '0',
      validateInput: (value) => {
        const num = parseFloat(value);
        return !isNaN(num) && num >= 0 && num <= 100 ? null : 'Valid tax rate (0-100) required';
      }
    });
    if (!taxRateStr) return;

    const paymentInstructions = await vscode.window.showInputBox({
      prompt: 'Payment instructions',
      value: existingConfig.billing?.paymentInstructions || 'Payment due within 30 days. Wire transfer details:\\nAccount: 1234567890\\nRouting: 987654321\\nBank: Your Bank Name'
    });
    if (!paymentInstructions) return;

    const invoiceNotes = await vscode.window.showInputBox({
      prompt: 'Invoice notes (optional)',
      value: existingConfig.billing?.invoiceNotes || 'Thank you for your business! For questions, contact us at your.email@consulting.com'
    });

    const timezone = await vscode.window.showInputBox({
      prompt: 'Timezone (e.g., America/Chicago for CST, America/New_York for EST)',
      value: existingConfig.preferences?.timezone || 'America/Chicago',
      validateInput: (value) => {
        try {
          // Test if timezone is valid
          new Date().toLocaleString('en-US', { timeZone: value });
          return null;
        } catch {
          return 'Invalid timezone. Use format like America/Chicago or America/New_York';
        }
      }
    });
    if (!timezone) return;

    // Create config object
    const config: NoteFloConfig = {
      business: {
        name: businessName,
        address: businessAddress || '',
        email: businessEmail,
        phone: businessPhone || undefined,
        website: businessWebsite || undefined
      },
      client: {
        name: clientName,
        contact: clientContact || undefined,
        address: clientAddress || undefined,
        email: clientEmail || undefined
      },
      billing: {
        hourlyRate: parseFloat(hourlyRateStr),
        currency: currency,
        taxRate: parseFloat(taxRateStr),
        paymentInstructions: paymentInstructions,
        invoiceNotes: invoiceNotes || 'Thank you for your business! For questions, contact us at your.email@consulting.com'
      },
      preferences: {
        timezone: timezone
      }
    };

    // Save config
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));

    // Create .gitignore entry for .noteflo folder if it doesn't exist
    this.addToGitignore();

    // Create sample template
    this.createConfigTemplate();

    // Open the config file for review
    const document = await vscode.workspace.openTextDocument(configPath);
    await vscode.window.showTextDocument(document);

    vscode.window.showInformationMessage('✅ NoteFlo configured successfully! You can now track time and generate invoices.');
  }

  private addToGitignore(): void {
    const gitignorePath = path.join(this.workspaceRoot, '.gitignore');
    const noteFloGitignore = '# NoteFlo - Ignore sensitive config\n.noteflo/config.json\n';

    if (fs.existsSync(gitignorePath)) {
      const gitignoreContent = fs.readFileSync(gitignorePath, 'utf8');
      if (!gitignoreContent.includes('.noteflo/config.json')) {
        fs.appendFileSync(gitignorePath, '\n' + noteFloGitignore);
      }
    } else {
      fs.writeFileSync(gitignorePath, noteFloGitignore);
    }
  }

  private createConfigTemplate(): void {
    const templatePath = path.join(this.workspaceRoot, '.noteflo', 'config.template.json');
    const template = {
      "// Copy this to config.json and fill in your details": "",
      "business": {
        "name": "Your Consulting Business Name",
        "address": "123 Business Street\\nYour City, State 12345\\nCountry",
        "email": "your.email@consulting.com",
        "phone": "+1-555-123-4567",
        "website": "https://yourconsulting.com",
        "logoPath": "assets/logo.png"
      },
      "client": {
        "name": "Client Company Name",
        "contact": "Client Contact Person",
        "address": "456 Client Avenue\\nClient City, State 67890",
        "email": "contact@client.com"
      },
      "billing": {
        "hourlyRate": 8500,
        "currency": "INR",
        "taxRate": 18,
        "paymentInstructions": "Payment due within 30 days. Wire transfer details:\\nAccount: 1234567890\\nRouting: 987654321\\nBank: Your Bank Name",
        "invoiceNotes": "Thank you for your business! For questions, contact us at your.email@consulting.com"
      },
      "preferences": {
        "timezone": "America/Chicago"
      }
    };

    fs.writeFileSync(templatePath, JSON.stringify(template, null, 2));
  }

  private loadNoteFloConfig(): NoteFloConfig {
    const configPath = path.join(this.workspaceRoot, '.noteflo', 'config.json');
    if (!fs.existsSync(configPath)) {
      vscode.window.showErrorMessage('NoteFlo configuration not found. Please run "Configure NoteFlo" command first.');
      throw new Error('NoteFlo configuration not found.');
    }

    try {
      const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      return config;
    } catch (error) {
      vscode.window.showErrorMessage(`Error loading NoteFlo configuration: ${error}`);
      throw new Error(`Error loading NoteFlo configuration: ${error}`);
    }
  }
}

// Clean PDF Layout Helper Class
class PDFLayout {
  private doc: jsPDF;
  private y: number;
  private margin: number;
  private pageWidth: number;
  private pageHeight: number;
  private bottomMargin: number;

  constructor(doc: jsPDF) {
    this.doc = doc;
    this.margin = 20;
    this.bottomMargin = 20;
    this.pageWidth = doc.internal.pageSize.getWidth();
    this.pageHeight = doc.internal.pageSize.getHeight();
    this.y = this.margin;
  }

  private checkPageBreak(neededSpace: number = 15): void {
    if (this.y + neededSpace > this.pageHeight - this.bottomMargin) {
      this.doc.addPage();
      this.y = this.margin;
    }
  }

  addTitle(text: string, fontSize: number = 20): void {
    this.checkPageBreak(fontSize * 0.6 + 5);
    this.doc.setFontSize(fontSize);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text(text, this.margin, this.y);
    this.y += fontSize * 0.6 + 5;
  }

  addSubheading(text: string, fontSize: number = 12): void {
    this.checkPageBreak(fontSize * 0.6 + 3);
    this.doc.setFontSize(fontSize);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text(text, this.margin, this.y);
    this.y += fontSize * 0.6 + 3;
  }

  addText(text: string, fontSize: number = 10, style: 'normal' | 'bold' = 'normal'): void {
    this.checkPageBreak(fontSize * 0.5 + 2);
    this.doc.setFontSize(fontSize);
    this.doc.setFont('helvetica', style);
    this.doc.text(text, this.margin, this.y);
    this.y += fontSize * 0.5 + 2;
  }

  addSpace(pixels: number): void {
    this.checkPageBreak(pixels);
    this.y += pixels;
  }

  addLine(): void {
    this.checkPageBreak(15);
    this.y += 5;
    this.doc.line(this.margin, this.y, this.pageWidth - this.margin, this.y);
    this.y += 10;
  }

  addTwoColumns(leftColumn: () => void, rightColumn: () => void): void {
    // Check if we have space for two-column content (estimate minimum needed)
    this.checkPageBreak(60);

    const startY = this.y;
    const leftX = this.margin;
    const rightX = this.pageWidth / 2 + 10;

    // Save original margin and set up left column
    const originalMargin = this.margin;
    this.margin = leftX;
    leftColumn();
    const leftEndY = this.y;

    // Set up right column
    this.y = startY;
    this.margin = rightX;
    rightColumn();
    const rightEndY = this.y;

    // Restore margin and set Y to the lower of the two columns
    this.margin = originalMargin;
    this.y = Math.max(leftEndY, rightEndY) + 10;
  }

  addTable(headers: string[], columnWidths: number[], rows: string[][]): void {
    const colPositions = this.calculateColumnPositions(columnWidths);

    // Check if we need space for header + at least 2 rows
    this.checkPageBreak(12 + (Math.min(2, rows.length) * 8));

    // Table headers
    this.doc.setFontSize(9);
    this.doc.setFont('helvetica', 'bold');
    headers.forEach((header, i) => {
      this.doc.text(header, colPositions[i], this.y);
    });
    this.y += 12;

    // Table rows
    this.doc.setFont('helvetica', 'normal');
    rows.forEach(row => {
      this.checkPageBreak(8); // Check before each row
      row.forEach((cell, i) => {
        this.doc.text(cell, colPositions[i], this.y);
      });
      this.y += 8;
    });
  }

  addRightAlignedSummary(items: Array<{ label: string, value: string, isTotal?: boolean }>): void {
    const valueX = this.pageWidth - 60;

    // Check if we need space for the entire summary section
    const totalHeight = items.reduce((height, item) => height + (item.isTotal ? 28 : 12), 0);
    this.checkPageBreak(totalHeight);

    items.forEach(item => {
      if (item.isTotal) {
        this.checkPageBreak(28); // Line + spacing + text
        this.y += 5;
        this.doc.line(valueX - 10, this.y, this.pageWidth - this.margin, this.y);
        this.y += 8;
        this.doc.setFontSize(12);
        this.doc.setFont('helvetica', 'bold');
      } else {
        this.checkPageBreak(12);
        this.doc.setFontSize(10);
        this.doc.setFont('helvetica', 'normal');
      }

      this.doc.text(item.label, this.margin, this.y);
      this.doc.text(item.value, valueX, this.y);
      this.y += item.isTotal ? 15 : 12;
    });
  }

  addWrappedText(text: string, fontSize: number = 10): void {
    this.doc.setFontSize(fontSize);
    this.doc.setFont('helvetica', 'normal');
    const lines = this.doc.splitTextToSize(text, this.pageWidth - 2 * this.margin) as string[];
    lines.forEach(line => {
      this.checkPageBreak(fontSize * 0.5 + 2);
      this.doc.text(line, this.margin, this.y);
      this.y += fontSize * 0.5 + 2;
    });
  }

  private calculateColumnPositions(widths: number[]): number[] {
    const positions = [this.margin];
    for (let i = 1; i < widths.length; i++) {
      positions.push(positions[i - 1] + widths[i - 1]);
    }
    return positions;
  }
} 