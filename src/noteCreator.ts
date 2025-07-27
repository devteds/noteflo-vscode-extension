import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';
import { formatDateInTimezone, getConfiguredTimezone } from './invoiceGenerator';

export class NoteCreator {
  private workspaceRoot: string;
  private docsDir: string;
  private meetingNotesDir: string;
  private dailyNotesDir: string;

  constructor(workspaceRoot: string) {
    this.workspaceRoot = workspaceRoot;
    this.docsDir = path.join(workspaceRoot, 'docs');
    this.meetingNotesDir = path.join(this.docsDir, 'meeting-notes');
    this.dailyNotesDir = path.join(this.docsDir, 'daily-notes');
    // Don't create directories automatically - only when actually needed
  }

  private ensureDirectories(): void {
    [this.docsDir, this.meetingNotesDir, this.dailyNotesDir].forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
  }

  private getTimestamp(): string {
    const timezone = getConfiguredTimezone(this.workspaceRoot);
    return formatDateInTimezone(new Date(), timezone, 'date-only');
  }

  private sanitizeFilename(text: string): string {
    return text.toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  }

  async createMeetingNote(): Promise<void> {
    // Get meeting details from user
    const meetingType = await vscode.window.showInputBox({
      prompt: 'Meeting type',
      value: 'Review'
    });
    if (!meetingType) return;

    const description = await vscode.window.showInputBox({
      prompt: 'Brief description',
      value: 'Client discussion'
    });
    if (!description) return;

    const attendees = await vscode.window.showInputBox({
      prompt: 'Attendees (names only)',
      value: 'Client team'
    });
    if (!attendees) return;

    // Create filename in new format: topic-YYYY-MM-DD.md
    const timestamp = this.getTimestamp();
    const safeDesc = this.sanitizeFilename(description);
    const filename = `${safeDesc}-${timestamp}.md`;
    const filepath = path.join(this.meetingNotesDir, filename);

    // Get configured timezone
    const timezone = getConfiguredTimezone(this.workspaceRoot);
    const startTime = formatDateInTimezone(new Date(), timezone, 'date-time');

    // Create meeting note content
    const content = `# ${meetingType}: ${description}

## 📋 Meeting Details
- **Date/Time:** ${startTime} (${timezone})
- **Type:** ${meetingType}
- **Attendees:** ${attendees}

## 🎯 Agenda
- ${description}

## 📝 Notes

### Key Discussion Points
- 

### Decisions Made
- 

### Action Items
- [ ] 

## 🔗 Resources
- **Recording:** 
- **Materials:** 
- **Follow-up:** 

---
*Meeting notes for ${description} - ${timestamp}*
`;

    // Ensure directories exist only when actually needed
    this.ensureDirectories();

    // Write file
    fs.writeFileSync(filepath, content);

    // Open file in VS Code
    const doc = await vscode.workspace.openTextDocument(filepath);
    await vscode.window.showTextDocument(doc);

    // Update notes index
    await this.updateNotesIndex();

    vscode.window.showInformationMessage(`📝 Created meeting note: ${filename}`);
  }

  async createQuickTodo(): Promise<void> {
    const todoDescription = await vscode.window.showInputBox({
      prompt: 'Todo description',
      placeHolder: 'What needs to be done?'
    });
    if (!todoDescription) return;

    const priority = await vscode.window.showQuickPick([
      'Urgent',
      'High',
      'Normal',
      'Low'
    ], {
      placeHolder: 'Select priority'
    });
    if (!priority) return;

    const isProjectSpecific = await vscode.window.showQuickPick([
      'Project-specific',
      'General'
    ], {
      placeHolder: 'Todo type'
    });

    // Determine todo file
    const currentProject = this.getCurrentProject();
    let todoFile: string;

    if (isProjectSpecific === 'Project-specific' && currentProject) {
      todoFile = path.join(this.docsDir, 'project-planning', `${currentProject}-todos.md`);
    } else {
      todoFile = path.join(this.docsDir, 'project-planning', 'general-todos.md');
    }

    // Ensure todo file exists
    this.ensureTodoFile(todoFile);

    // Add todo to appropriate section
    this.addTodoToFile(todoFile, todoDescription, priority);

    // Auto-update notes index for project documentation
    await this.updateNotesIndex();

    vscode.window.showInformationMessage(`✅ Added ${priority.toLowerCase()} priority todo`);
  }

  private getCurrentProject(): string {
    const config = vscode.workspace.getConfiguration('noteflo');
    return config.get('currentProject', '');
  }

  private ensureTodoFile(filePath: string): void {
    if (!fs.existsSync(filePath)) {
      const dir = path.dirname(filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      const filename = path.basename(filePath, '.md');
      const content = `# ${filename.replace('-', ' ').toUpperCase()}

## 🚨 Urgent
- 

## 🔥 High Priority  
- 

## 📋 Normal Priority
- 

## 🕐 Low Priority
- 

## ✅ Completed
- 

---
*Last updated: ${formatDateInTimezone(new Date(), getConfiguredTimezone(this.workspaceRoot), 'date-only')}*
`;
      // Ensure directories exist only when actually needed
      this.ensureDirectories();
      fs.writeFileSync(filePath, content);
    }
  }

  private addTodoToFile(filePath: string, todo: string, priority: string): void {
    let content = fs.readFileSync(filePath, 'utf8');

    const sectionMap: { [key: string]: string } = {
      'Urgent': '## 🚨 Urgent',
      'High': '## 🔥 High Priority',
      'Normal': '## 📋 Normal Priority',
      'Low': '## 🕐 Low Priority'
    };

    const sectionHeader = sectionMap[priority];
    const todoItem = `- [ ] ${todo}`;

    // Find section and add todo
    const lines = content.split('\n');
    const sectionIndex = lines.findIndex(line => line.trim() === sectionHeader);

    if (sectionIndex !== -1) {
      // Find next section or end of file
      let insertIndex = sectionIndex + 1;
      while (insertIndex < lines.length && !lines[insertIndex].startsWith('## ')) {
        insertIndex++;
      }

      // Insert before next section or at end
      lines.splice(insertIndex, 0, todoItem);
      content = lines.join('\n');

      // Ensure directories exist only when actually needed
      this.ensureDirectories();
      fs.writeFileSync(filePath, content);
    }
  }

  async openDashboard(): Promise<void> {
    const dashboardPath = path.join(this.docsDir, 'index.md');

    // Create dashboard if it doesn't exist
    if (!fs.existsSync(dashboardPath)) {
      await this.createDefaultDashboard(dashboardPath);
    }

    const doc = await vscode.workspace.openTextDocument(dashboardPath);
    await vscode.window.showTextDocument(doc);
  }

  private async createDefaultDashboard(dashboardPath: string): Promise<void> {
    // Ensure directories exist
    this.ensureDirectories();

    const timezone = getConfiguredTimezone(this.workspaceRoot);
    const timestamp = formatDateInTimezone(new Date(), timezone, 'readable');

    const content = `# 📊 NoteFlo Dashboard

*Welcome to your NoteFlo workspace dashboard!*

## 🚀 Quick Start

### First Time Setup
- [ ] Run **NoteFlo: Configure NoteFlo** from Command Palette
- [ ] Set up your business information, billing rates, and timezone

### Daily Workflow
- [ ] **Start time tracking**: \`Cmd+K S\` or **NoteFlo: Start Time Tracking**  
- [ ] **Create meeting notes**: \`Cmd+K M\` or **NoteFlo: New Meeting Note**
- [ ] **Add quick todos**: \`Cmd+K T\` or **NoteFlo: Quick Todo**
- [ ] **Stop tracking**: \`Cmd+K E\` or **NoteFlo: Stop Time Tracking**

### Weekly Tasks
- [ ] **Generate invoices**: \`Cmd+K I\` or **NoteFlo: Generate Invoice**
- [ ] **Update notes index**: \`Cmd+K U\` or **NoteFlo: Update Notes Index**

## 📁 Your Workspace Structure

### 📝 Documentation
- **[Meeting Notes](meeting-notes/)** - Client calls, project discussions
- **[Daily Notes](daily-notes/)** - Daily todos and project planning  
- **[Notes Index](notes/)** - Auto-generated index of all notes

### ⏰ Time Tracking
- **[Time Entries](time-tracking/)** - Monthly time tracking files
- **Current Session** - Active tracking status (see status bar)

### 💰 Invoicing  
- **[Client Invoices](client-invoices/)** - Generated invoices (Markdown + PDF)

## 🎯 Current Focus

### This Week
- 

### Important Deadlines
- 

### Key Projects
- 

## 📊 Quick Stats

*Use **NoteFlo: Update Notes Index** to see statistics*

---

## 🔗 Useful Commands

| Command | Shortcut | Description |
|---------|----------|-------------|
| Configure NoteFlo | - | Setup business info and preferences |
| Start Time Tracking | \`Cmd+K S\` | Begin tracking work time |
| Stop Time Tracking | \`Cmd+K E\` | End current tracking session |
| New Meeting Note | \`Cmd+K M\` | Create structured meeting notes |
| Quick Todo | \`Cmd+K T\` | Add prioritized todo items |
| Generate Invoice | \`Cmd+K I\` | Create professional invoices |
| Update Notes Index | \`Cmd+K U\` | Refresh notes organization |
| Open Dashboard | - | Return to this dashboard |

---

*Created: ${timestamp}*  
*Dashboard auto-generated by NoteFlo Extension*
`;

    fs.writeFileSync(dashboardPath, content);
    vscode.window.showInformationMessage('📊 Created NoteFlo dashboard at docs/index.md');
  }

  async updateNotesIndex(): Promise<void> {
    // Run the notes index updater (equivalent to our Python script)
    const notesIndexPath = path.join(this.docsDir, 'notes', 'index.md');

    if (!fs.existsSync(path.dirname(notesIndexPath))) {
      fs.mkdirSync(path.dirname(notesIndexPath), { recursive: true });
    }

    // Scan for all notes
    const allNotes = await this.scanAllNotes();

    // Generate index content
    const timezone = getConfiguredTimezone(this.workspaceRoot);
    const now = formatDateInTimezone(new Date(), timezone, 'readable');
    let indexContent = `# Notes Index

*Last updated: ${now}*

## 📝 Recent Notes (Last 10)

`;

    // Show recent notes
    const recentNotes = allNotes.slice(0, 10);
    for (const note of recentNotes) {
      const icon = note.type === 'meeting' ? '🗣️' : '📓';
      indexContent += `- ${icon} [${note.title}](../${note.type}-notes/${note.filename}) - ${note.date}\n`;
    }

    indexContent += `
## 🔍 Navigation
- [Meeting Notes](../meeting-notes/) (${allNotes.filter(n => n.type === 'meeting').length} files)
- [Daily Notes](../daily-notes/) (${allNotes.filter(n => n.type === 'daily').length} files)

## 📊 Statistics
- Total Notes: ${allNotes.length}
- This Month: ${allNotes.filter(n => this.isThisMonth(n.date)).length}
- This Week: ${allNotes.filter(n => this.isThisWeek(n.date)).length}

---
*Auto-generated by NoteFlo Extension*
`;

    // Ensure directories exist only when actually needed
    this.ensureDirectories();
    fs.writeFileSync(notesIndexPath, indexContent);
    vscode.window.showInformationMessage(`📋 Updated notes index (${allNotes.length} notes found)`);
  }

  private async scanAllNotes(): Promise<Array<{ filename: string, title: string, date: string, type: 'meeting' | 'daily' }>> {
    const notes: Array<{ filename: string, title: string, date: string, type: 'meeting' | 'daily' }> = [];

    // Scan meeting notes
    if (fs.existsSync(this.meetingNotesDir)) {
      const meetingFiles = fs.readdirSync(this.meetingNotesDir).filter(f => f.endsWith('.md'));
      for (const filename of meetingFiles) {
        const noteInfo = this.parseMeetingFilename(filename);
        if (noteInfo) {
          notes.push({
            filename,
            title: noteInfo.title,
            date: noteInfo.date,
            type: 'meeting'
          });
        }
      }
    }

    // Scan daily notes
    if (fs.existsSync(this.dailyNotesDir)) {
      const dailyFiles = fs.readdirSync(this.dailyNotesDir).filter(f => f.endsWith('.md'));
      for (const filename of dailyFiles) {
        const noteInfo = this.parseDailyFilename(filename);
        if (noteInfo) {
          notes.push({
            filename,
            title: noteInfo.title,
            date: noteInfo.date,
            type: 'daily'
          });
        }
      }
    }

    // Sort by date (newest first)
    notes.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return notes;
  }

  private parseMeetingFilename(filename: string): { title: string, date: string } | null {
    // Handle both formats: topic-YYYY-MM-DD.md and YYYY-MM-DD-topic.md
    const match1 = filename.match(/^(.+)-(\d{4}-\d{2}-\d{2})\.md$/);
    if (match1) {
      return { title: match1[1].replace(/-/g, ' '), date: match1[2] };
    }

    const match2 = filename.match(/^(\d{4}-\d{2}-\d{2})-(.+)\.md$/);
    if (match2) {
      return { title: match2[2].replace(/-/g, ' '), date: match2[1] };
    }

    return null;
  }

  private parseDailyFilename(filename: string): { title: string, date: string } | null {
    const match = filename.match(/^(\d{4}-\d{2}-\d{2})\.md$/);
    if (match) {
      return { title: `Daily Note`, date: match[1] };
    }
    return null;
  }

  private isThisMonth(dateStr: string): boolean {
    const date = new Date(dateStr);
    const now = new Date();
    return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
  }

  private isThisWeek(dateStr: string): boolean {
    const date = new Date(dateStr);
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    return date >= weekAgo && date <= now;
  }
} 