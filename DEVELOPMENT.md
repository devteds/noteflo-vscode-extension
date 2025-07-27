# NoteFlo Development Guide

This guide provides comprehensive information for developers working on the NoteFlo VS Code extension.

## 🏗️ Architecture Overview

### Design Philosophy

NoteFlo follows these core principles:

1. **Single Responsibility**: Each module handles one core functionality
2. **VS Code Integration**: Leverages VS Code APIs for native experience
3. **File-based Storage**: Uses JSON files for simplicity and Git compatibility
4. **Timezone Awareness**: All timestamps respect user's configured timezone
5. **One Client Per Repo**: Simplified project model for clear separation

### Module Structure

```
src/
├── extension.ts              # Extension activation and command registration
├── timeTracker.ts           # Time tracking functionality
├── noteCreator.ts           # Note and todo management
├── invoiceGenerator.ts      # Invoice generation and configuration
└── providers/
    └── sidebarProvider.ts   # Custom sidebar tree view
```

### Core Interfaces

```typescript
// Time tracking
interface TimeEntry {
  start_time: string;      // ISO string in configured timezone
  end_time: string;        // ISO string in configured timezone
  description: string;     // Task description
  duration_minutes: number; // Calculated duration
}

interface ActiveSession {
  start_time: string;      // ISO string in configured timezone
  description: string;     // Current task description
}

// Configuration
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
    timezone: string;        // e.g., "America/Chicago"
  };
}
```

## 🚀 Development Setup

### Prerequisites

- **Node.js** 20+ (for TypeScript compilation and VS Code extension packaging)
- **VS Code** 1.60+ (for testing and debugging)
- **TypeScript** 4.0+ (installed via npm)
- **Git** (for version control)

### Initial Setup

```bash
# Clone the repository
git clone https://github.com/your-org/noteflo-extension.git
cd noteflo-extension

# Install dependencies
npm install

# Install VS Code Extension CLI (optional, for packaging)
npm install -g @vscode/vsce
```

### Development Workflow

```bash
# Compile TypeScript
npm run compile

# Watch mode for development
npm run watch

# Package for testing
npx @vscode/vsce package --baseContentUrl https://raw.githubusercontent.com/placeholder/repo/main/

# Alternative with repository bypass
npx @vscode/vsce package --allow-missing-repository

# Install locally for testing
code --install-extension noteflo-*.vsix
```

### Testing the Extension

1. **Manual Testing**:
   - Install the VSIX in a test VS Code instance
   - Open a test workspace
   - Run `NoteFlo: Configure` to set up configuration
   - Test all commands and features

2. **Debugging**:
   - Open the extension source in VS Code
   - Press `F5` to launch Extension Development Host
   - Set breakpoints in TypeScript source
   - Test functionality in the debug instance

## 📁 File Structure Deep Dive

### Core Modules

#### `extension.ts` - Main Entry Point
- Handles extension activation
- Registers all commands and providers
- Manages extension lifecycle
- Coordinates between modules

```typescript
export function activate(context: vscode.ExtensionContext) {
  // Initialize modules
  timeTracker = new TimeTracker(workspaceRoot);
  noteCreator = new NoteCreator(workspaceRoot);
  invoiceGenerator = new InvoiceGenerator(workspaceRoot);
  
  // Register commands
  context.subscriptions.push(
    vscode.commands.registerCommand('noteflo.startTimeTracking', ...)
  );
}
```

#### `timeTracker.ts` - Time Management
- Manages active time tracking sessions
- Handles start/stop/enter time operations
- Monthly file rotation for time entries
- Status bar integration
- Timezone-aware timestamp generation

**Key Methods**:
- `startTimeTracking(description)` - Start new session
- `stopTimeTracking()` - End current session and save
- `enterTime(hours, description, date)` - Manual time entry
- `getActiveSession()` - Check current session status

#### `noteCreator.ts` - Note Management
- Creates meeting notes with templates
- Manages todo creation and organization
- Generates unified notes index
- Integrates with time tracking
- Foam compatibility

**Key Methods**:
- `createMeetingNote()` - Interactive meeting note creation
- `createQuickTodo()` - Add prioritized todos
- `updateNotesIndex()` - Scan and organize all notes
- `openDashboard()` - Open main dashboard

#### `invoiceGenerator.ts` - Invoice & Configuration
- Interactive configuration setup
- Invoice generation (Markdown + PDF)
- Sequential invoice numbering
- Professional PDF layout with multi-page support
- Timezone utilities

**Key Methods**:
- `configureNoteFlo()` - Interactive setup wizard
- `generateInvoice()` - Create invoices for specified period
- `generatePDFInvoice()` - PDF generation with custom layout
- `formatDateInTimezone()` - Timezone-aware date formatting

#### `providers/sidebarProvider.ts` - UI Integration
- Custom tree view for sidebar
- Quick access to all features
- Real-time status updates
- Context-sensitive actions

### Data Storage Strategy

NoteFlo uses a file-based approach for simplicity and Git compatibility:

```
.noteflo/
├── config.json              # User configuration (git-ignored)
└── config.template.json     # Template (git-tracked)

docs/
├── time-tracking/
│   ├── time_entries_2025-01.json  # Monthly time entries
│   ├── time_entries_2025-02.json  # (git-tracked)
│   └── active_session.json        # Current session (git-ignored)
├── meeting-notes/
│   └── *.md                       # Meeting notes (git-tracked)
├── daily-notes/
│   └── *.md                       # Daily notes (git-tracked)
├── project-planning/
│   └── *.md                       # Todo lists (git-tracked)
├── client-invoices/
│   ├── *.md                       # Markdown invoices (git-tracked)
│   └── *.pdf                      # PDF invoices (git-tracked)
└── notes/
    └── index.md                   # Auto-generated index (git-tracked)
```

**Design Rationale**:
- **JSON for data**: Easy to parse, Git-friendly diffs
- **Markdown for content**: Human-readable, version controllable
- **Monthly rotation**: Prevents large files, improves performance
- **Git integration**: Automatic `.gitignore` management

## 🔧 Timezone Implementation

### Utility Functions

```typescript
// Core timezone utilities in invoiceGenerator.ts
export function formatDateInTimezone(
  date: Date = new Date(), 
  timezone: string = 'America/Chicago', 
  format: 'iso' | 'readable' | 'date-only' | 'date-time' = 'iso'
): string

export function getConfiguredTimezone(workspaceRoot: string): string
```

### Format Types

- **`iso`**: `2024-07-27T10:30:00` (for file storage)
- **`readable`**: `July 27, 2024 at 10:30 AM` (for UI display)
- **`date-only`**: `2024-07-27` (for date inputs)
- **`date-time`**: `07/27/2024, 10:30 AM` (for meeting notes)

### Integration Points

All timestamp generation uses these utilities:
- Time tracking start/stop times
- Meeting note timestamps
- Invoice dates and time entries
- Notes index generation
- Dashboard updates

## 📄 PDF Generation Architecture

### Custom Layout System

NoteFlo implements a custom PDF layout system using jsPDF:

```typescript
class PDFLayout {
  private doc: jsPDF;
  private y: number;           // Current vertical position
  private pageHeight: number;  // Page height for overflow detection
  private bottomMargin: number; // Bottom margin
  
  // Automatic page break management
  checkPageBreak(neededSpace: number): void
  
  // Layout methods
  addTitle(text: string, fontSize: number): void
  addTwoColumns(leftFn: Function, rightFn: Function): void
  addTable(headers: string[], widths: number[], data: string[][]): void
  addRightAlignedSummary(items: SummaryItem[]): void
  addWrappedText(text: string, fontSize: number): void
}
```

### Multi-Page Support

The PDF system automatically handles page breaks:
- Monitors vertical position (`y` coordinate)
- Calculates required space for content
- Adds new pages when approaching bottom margin
- Resets position and continues content

### Professional Formatting

- **Typography**: Consistent font sizes and weights
- **Spacing**: Proper line spacing and margins
- **Alignment**: Left, right, and center alignment support
- **Tables**: Professional table formatting with borders
- **Two-column layout**: Side-by-side sections (FROM/TO)

## 🎯 VS Code Integration Patterns

### Command Registration

```typescript
// In extension.ts
const commandId = 'noteflo.commandName';
const disposable = vscode.commands.registerCommand(commandId, () => {
  // Command implementation
});
context.subscriptions.push(disposable);
```

### Status Bar Integration

```typescript
// In timeTracker.ts
private statusBarItem: vscode.StatusBarItem;

private createStatusBar(): void {
  this.statusBarItem = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Left, 
    100
  );
  this.statusBarItem.command = 'noteflo.timeStatus';
  this.statusBarItem.show();
}
```

### File System Operations

```typescript
// Safe file operations with error handling
private ensureDirectoryExists(dirPath: string): void {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

private safeWriteJson(filePath: string, data: any): void {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  } catch (error) {
    vscode.window.showErrorMessage(`Error writing file: ${error}`);
  }
}
```

### User Input Patterns

```typescript
// Interactive prompts with validation
const input = await vscode.window.showInputBox({
  prompt: 'Description',
  validateInput: (value) => {
    return value.trim() ? null : 'Description is required';
  }
});
if (!input) return; // User cancelled
```

## 🔄 Build & Release Process

### Compilation

```bash
# TypeScript compilation
npm run compile

# Watch mode for development
npm run watch
```

### Packaging

```bash
# Create VSIX package
npx vsce package

# With custom filename
npx vsce package --out noteflo-v1.0.0.vsix

# Skip repository requirement for development
npx vsce package --allow-missing-repository
```

### Version Management

Update version in `package.json`:
```json
{
  "version": "1.0.0"
}
```

The version appears in:
- Extension marketplace listing
- Generated VSIX filename
- VS Code extension manager

### Release Checklist

1. **Test all features** in development environment
2. **Update version** in `package.json`
3. **Update changelog** with new features/fixes
4. **Compile and package** extension
5. **Test VSIX** in clean VS Code instance
6. **Create Git tag** for release
7. **Upload to marketplace** (when ready)

## 🤝 Contributing Guidelines

### Code Style

- **TypeScript**: Use strict mode and proper typing
- **Formatting**: Use VS Code's default TypeScript formatter
- **Naming**: camelCase for variables/methods, PascalCase for classes
- **Comments**: JSDoc for public methods, inline for complex logic

### Error Handling

```typescript
// Always handle VS Code API errors
try {
  const result = await vscode.window.showInputBox(...);
  if (!result) return; // User cancelled
  
  // Process result
} catch (error) {
  vscode.window.showErrorMessage(`Operation failed: ${error}`);
}
```

### File Operations

```typescript
// Always check for file existence
if (!fs.existsSync(filePath)) {
  // Handle missing file case
  return;
}

// Use try-catch for file operations
try {
  const content = fs.readFileSync(filePath, 'utf8');
  return JSON.parse(content);
} catch (error) {
  vscode.window.showErrorMessage(`Error reading config: ${error}`);
  return null;
}
```

### Testing Guidelines

1. **Manual Testing**: Test all commands in various scenarios
2. **Edge Cases**: Empty configs, missing files, invalid dates
3. **User Experience**: Test the complete workflow end-to-end
4. **Cross-platform**: Test on different operating systems
5. **Performance**: Monitor extension startup time and memory usage

### Pull Request Process

1. **Fork** the repository
2. **Create feature branch** from `main`
3. **Implement changes** following code style
4. **Test thoroughly** in development environment
5. **Update documentation** if needed
6. **Submit pull request** with clear description
7. **Address review feedback** promptly

## 🐛 Debugging Tips

### Common Issues

1. **Extension not activating**: Check `activationEvents` in `package.json`
2. **Commands not found**: Verify command registration in `extension.ts`
3. **File access errors**: Check workspace permissions and paths
4. **Timezone issues**: Test with different timezone configurations
5. **PDF generation fails**: Check jsPDF version and browser compatibility

### Debugging Techniques

1. **Console logging**: Use `console.log()` for development debugging
2. **VS Code debugging**: Use F5 to launch debug instance
3. **Extension logs**: Check VS Code Developer Tools console
4. **File inspection**: Manually verify generated JSON/PDF files
5. **User feedback**: Test with actual consulting workflow

### Performance Considerations

1. **File size**: Monitor time entry file sizes (monthly rotation helps)
2. **PDF generation**: Large invoices may take time to generate
3. **Status bar updates**: 5-second intervals balance responsiveness and performance
4. **Notes scanning**: Optimize for large numbers of notes

---

This development guide provides the foundation for working on NoteFlo. For questions or clarifications, please open an issue in the repository.

**Happy coding! 🚀** 