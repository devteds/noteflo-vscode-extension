# NoteFlo - Professional Workflow Extension for VS Code

**Professional workflow: time tracking, notes, todos, and invoicing for consultants and freelancers**

[![VS Code](https://img.shields.io/badge/VS%20Code-1.60+-blue.svg)](https://code.visualstudio.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-4.0+-blue.svg)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

## 🎯 Overview

NoteFlo is a comprehensive VS Code extension designed for consultants, freelancers, and professionals who need to seamlessly manage their workflow within their development environment. It combines time tracking, note-taking, todo management, and professional invoicing into a unified, efficient system.

### 🌟 Key Features

#### ⏱️ **Smart Time Tracking**
- **One-click start/stop** time tracking with descriptions
- **Manual time entry** for offline work, meetings, and travel
- **Real-time status bar** showing active timer and elapsed time
- **Monthly file rotation** for organized time entry storage
- **Timezone-aware** timestamps (configurable CST, EST, PST, etc.)

#### 📝 **Efficient Note Management**
- **Quick meeting notes** with smart templates and time tracking integration
- **Instant todo creation** with priority-based organization
- **Auto-generated notes index** organized by time periods
- **Foam-compatible** wiki-linking and graph visualization
- **Filename optimization** for both human readability and scripting

#### 💰 **Professional Invoicing**
- **Dual-format generation**: Markdown + PDF invoices
- **Sequential invoice numbering** (INV-2025-001, INV-2025-002...)
- **Comprehensive invoice details**: business info, client details, line items, tax calculations
- **Multi-page PDF support** with automatic page breaks
- **Configurable currency** and tax rates (default INR, supports any currency)
- **Professional PDF layout** with proper spacing and formatting

#### 🎯 **Integrated Workflow**
- **Sidebar integration** for quick access to all features
- **Command palette** commands for keyboard-driven workflow
- **Smart time tracking prompts** when creating meeting notes
- **Unified dashboard** for todos, recent activity, and quick actions
- **Git-friendly** file structure with appropriate `.gitignore` handling

## 🚀 Installation

### From VSIX Package (Recommended)
1. Download the latest `noteflo-*.vsix` file from releases
2. Open VS Code
3. Run: `code --install-extension noteflo-*.vsix`
4. Reload VS Code
5. Run `NoteFlo: Configure` from Command Palette to set up your workspace

### From Marketplace (Coming Soon)
```bash
ext install devteds.noteflo
```

## ⚙️ Initial Setup

### 1. Configure NoteFlo
Run `Cmd+Shift+P` → `NoteFlo: Configure` to set up:

- **Business Details**: Name, address, email, phone, website
- **Client Information**: Name, contact person, address
- **Billing Settings**: Hourly rate, currency (INR/USD/EUR), tax rate
- **Timezone**: America/Chicago (CST), America/New_York (EST), etc.
- **Payment & Notes**: Custom payment instructions and invoice notes

### 2. File Structure Created
```
your-project/
├── .noteflo/
│   ├── config.json           # Your settings (git-ignored)
│   └── config.template.json  # Template for team sharing
├── docs/
│   ├── meeting-notes/        # Meeting notes: topic-YYYY-MM-DD.md
│   ├── daily-notes/          # Daily notes (Foam integration)
│   ├── notes/                # Unified notes index
│   ├── project-planning/     # Todo lists and planning
│   ├── time-tracking/        # time_entries_YYYY-MM.json
│   └── client-invoices/      # Generated invoices (MD + PDF)
└── .gitignore               # Updated with NoteFlo entries
```

## 📖 Usage Guide

### ⏱️ Time Tracking
```bash
# Start tracking
Cmd+Shift+P → "NoteFlo: Start Time Tracking"
# Or click "▶️ Start Timer" in NoteFlo sidebar

# Stop tracking  
Cmd+Shift+P → "NoteFlo: Stop Time Tracking"
# Or click "⏹️ Stop Timer" in sidebar

# Add offline time
Cmd+Shift+P → "NoteFlo: Enter Time"
# Prompts for hours, date, and description

# View status
Check status bar (shows active timer)
Click status bar for quick stop/switch actions
```

### 📝 Note Management
```bash
# Create meeting note
Cmd+Shift+P → "NoteFlo: New Meeting Note"
# Creates: client-discussion-2024-07-27.md
# Auto-prompts for time tracking integration

# Create quick todo
Cmd+Shift+P → "NoteFlo: Create Todo"
# Adds to priority-organized todo file

# Open dashboard
Cmd+Shift+P → "NoteFlo: Open Dashboard"
# Central hub with todos, recent notes, quick actions

# Update notes index
Cmd+Shift+P → "NoteFlo: Update Notes Index"
# Scans and organizes all meeting and daily notes
```

### 💰 Invoice Generation
```bash
# Generate invoice
Cmd+Shift+P → "NoteFlo: Generate Invoice"
# Prompts for period (YYYY-MM)
# Creates both Markdown and PDF versions

# View invoices
Cmd+Shift+P → "NoteFlo: View Invoices"
# Opens client-invoices folder

# Example generated files:
# docs/client-invoices/INV-2025-001.md
# docs/client-invoices/INV-2025-001.pdf
```

### 🎯 Daily Workflow Example
```bash
1. Open workspace → NoteFlo sidebar appears
2. Click "▶️ Start Timer" → describe current task
3. Create meeting note → auto-links to active timer
4. Add todos as they come up during work
5. Switch timer between different tasks
6. Stop timer at end of day
7. Monthly: Generate invoice from time entries
8. Git commit everything (notes, time entries, invoices tracked)
```

## 🏗️ Architecture

### One Repository Per Client Model
NoteFlo is designed around the **"one repository per client"** philosophy:
- Each client project gets its own Git repository
- NoteFlo configuration (`.noteflo/config.json`) is project-specific
- Time tracking, notes, and invoices are all contained within the project
- Easy to share specific deliverables while keeping sensitive data private

### File Organization
- **Git-tracked**: Notes, time entries, generated invoices, templates
- **Git-ignored**: Personal configuration (`.noteflo/config.json`)
- **Monthly rotation**: Time entries split by month for performance
- **Human-readable filenames**: `client-review-2024-07-27.md` vs `2024-07-27-client-review.md`

### Timezone Handling
- Configurable timezone support (no more UTC confusion!)
- All timestamps use your business timezone
- Consistent across time tracking, notes, and invoices
- Smart date formatting utilities for different contexts

## 🔧 Development

### Prerequisites
- Node.js 16+
- VS Code 1.60+
- TypeScript 4.0+

### Setup
```bash
git clone https://github.com/your-org/noteflo-extension.git
cd noteflo-extension
npm install
npm run compile
```

### Building
```bash
# Compile TypeScript
npm run compile

# Package extension
npx vsce package

# Install locally for testing
code --install-extension noteflo-*.vsix
```

### Project Structure
```
src/
├── extension.ts           # Main activation point
├── timeTracker.ts         # Time tracking logic
├── noteCreator.ts         # Note and todo management
├── invoiceGenerator.ts    # Invoice generation + config
└── providers/
    └── sidebarProvider.ts # Sidebar tree view
```

## 🎨 Customization

### Configuration Options
All settings are stored in `.noteflo/config.json`:

```json
{
  "business": {
    "name": "Your Consulting Business",
    "address": "123 Business St\nYour City, State 12345",
    "email": "your.email@consulting.com",
    "phone": "+1-555-123-4567",
    "website": "https://yourconsulting.com"
  },
  "client": {
    "name": "Client Company Name",
    "contact": "Client Contact Person"
  },
  "billing": {
    "hourlyRate": 8500,
    "currency": "INR",
    "taxRate": 18,
    "paymentInstructions": "Wire transfer details...",
    "invoiceNotes": "Thank you for your business!"
  },
  "preferences": {
    "timezone": "America/Chicago"
  }
}
```

### Foam Integration
NoteFlo works seamlessly with [Foam](https://foambubble.github.io/):
- Install Foam extension alongside NoteFlo
- Use `[[wiki-links]]` to connect notes
- View note relationships in graph view
- Create daily notes with Foam commands
- NoteFlo automatically indexes both meeting and daily notes

## 🤝 Contributing

We welcome contributions! Please see [DEVELOPMENT.md](DEVELOPMENT.md) for detailed development setup, architecture overview, and contribution guidelines.

## 📝 License

MIT License - see [LICENSE](LICENSE) file for details.

## 👤 Author

**Chandra Shettigar** ([@devteds](https://github.com/devteds))

---

## 🎯 Why NoteFlo?

NoteFlo was born from the real-world need to streamline consulting workflows without leaving the development environment. Instead of juggling separate time tracking apps, note-taking tools, and invoicing software, NoteFlo brings everything into VS Code where developers and consultants already spend their time.

**Perfect for:**
- 💻 Freelance developers and consultants
- 🏢 Professional services teams
- 📊 Anyone who bills by the hour
- 🚀 Teams that want Git-based workflow tracking

**Get started in 2 minutes. Bill professionally forever.** ⚡