# NoteFlo - Professional Workflow Extension for VS Code

**Professional workflow solution: time tracking, notes, todos, and invoicing for consultants and freelancers**

[![VS Code](https://img.shields.io/badge/VS%20Code-1.60+-blue.svg)](https://code.visualstudio.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-4.9+-blue.svg)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-20+-green.svg)](https://nodejs.org/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

[![VS Code Marketplace](https://img.shields.io/visual-studio-marketplace/v/devteds.noteflo.svg?label=VS%20Code%20Marketplace&color=blue)](https://marketplace.visualstudio.com/items?itemName=devteds.noteflo)
[![Marketplace Downloads](https://img.shields.io/visual-studio-marketplace/d/devteds.noteflo.svg?color=blue)](https://marketplace.visualstudio.com/items?itemName=devteds.noteflo)
[![Marketplace Installs](https://img.shields.io/visual-studio-marketplace/i/devteds.noteflo.svg?color=blue)](https://marketplace.visualstudio.com/items?itemName=devteds.noteflo)

*Built by [Chandra Shettigar](https://github.com/shettigarc)*

## 🎯 Overview

NoteFlo is a comprehensive VS Code extension designed for consultants, freelancers, and professionals who need to seamlessly manage their workflow within their development environment. It combines time tracking, note-taking, todo management, and professional invoicing into a unified, efficient system.

Perfect for developers, consultants, and freelancers who want to:
- ⏱️ Track time without leaving their code editor
- 📝 Create structured meeting notes and todos
- 💰 Generate professional invoices from tracked time
- 🎯 Maintain organized project documentation

## 🌟 Key Features

### ⏱️ **Smart Time Tracking**
- **One-click start/stop** time tracking with descriptions
- **Manual time entry** for offline work, meetings, and travel
- **Real-time status bar** showing active timer and elapsed time
- **Monthly file rotation** for organized time entry storage
- **Timezone-aware** timestamps (configurable CST, EST, PST, etc.)

### 📝 **Efficient Note Management**
- **Quick meeting notes** with smart templates and time tracking integration
- **Instant todo creation** with priority-based organization
- **Auto-generated notes index** organized by time periods
- **Foam-compatible** wiki-linking and graph visualization
- **Filename optimization** for both human readability and scripting

### 💰 **Professional Invoicing**
- **Dual-format generation**: Markdown + PDF invoices
- **Sequential invoice numbering** (INV-2025-001, INV-2025-002...)
- **Comprehensive invoice details**: business info, client details, line items, tax calculations
- **Multi-page PDF support** with automatic page breaks
- **Configurable currency** and tax rates (default INR, supports any currency)
- **Professional PDF layout** with proper spacing and formatting

### 🎯 **Integrated Workflow**
- **Sidebar integration** for quick access to all features
- **Command palette** commands for keyboard-driven workflow
- **Smart time tracking prompts** when creating meeting notes
- **Unified dashboard** for todos, recent activity, and quick actions
- **Git-friendly** file structure with appropriate `.gitignore` handling

## 🚀 Installation

### From VS Code Marketplace (Recommended)
1. **Open VS Code**
2. **Go to Extensions** (`Ctrl+Shift+X` / `Cmd+Shift+X`)
3. **Search for "NoteFlo"** by Devteds
4. **Click Install**
5. **Open a workspace folder** (required for NoteFlo functionality)

**Or install via Command Palette:**
1. Open Command Palette (`Ctrl+Shift+P` / `Cmd+Shift+P`)
2. Type: `ext install devteds.noteflo`
3. Press Enter

**Or install via terminal:**
```bash
code --install-extension devteds.noteflo
```

[**→ Install from VS Code Marketplace**](https://marketplace.visualstudio.com/items?itemName=devteds.noteflo)

### From VSIX Package (Development)
1. Download the latest `noteflo-1.0.0.vsix` file
2. Open VS Code  
3. Run: `code --install-extension noteflo-1.0.0.vsix`
4. Reload VS Code window
5. Open a workspace folder (required for NoteFlo functionality)

### Initial Setup
1. Open Command Palette (`Ctrl+Shift+P` / `Cmd+Shift+P`)
2. Run **"NoteFlo: Configure NoteFlo"**
3. Follow the interactive setup wizard:
   - Business information (name, address, email)
   - Client details
   - Billing settings (hourly rate, currency, tax rate)
   - Timezone configuration
   - Payment instructions

## 📖 Quick Start Guide

### ⏱️ **Time Tracking**
```
Cmd+K S  - Start time tracking
Cmd+K E  - Stop time tracking
Cmd+K H  - Enter manual time entry
```

1. **Start Tracking**: Use `Cmd+K S` or "NoteFlo: Start Time Tracking"
2. **Enter Description**: Describe what you're working on
3. **Check Status**: Status bar shows active timer and elapsed time
4. **Stop Tracking**: Use `Cmd+K E` or "NoteFlo: Stop Time Tracking"

### 📝 **Note Creation**
```
Cmd+K M  - New meeting note
Cmd+K T  - Quick todo
Cmd+K U  - Update notes index
```

1. **Meeting Notes**: Use `Cmd+K M` for structured meeting notes with templates
2. **Quick Todos**: Use `Cmd+K T` to add prioritized todos
3. **Auto-Organization**: Notes are automatically indexed and organized

### 💰 **Invoice Generation**
```
Cmd+K I  - Generate invoice
Cmd+K V  - View invoices
```

1. **Generate Invoice**: Use `Cmd+K I` and select date range
2. **Choose Format**: Markdown and/or PDF generation
3. **Professional Output**: Sequential numbering and comprehensive details

## 🗂️ **File Organization**

NoteFlo creates a clean, Git-friendly file structure:

```
your-project/
├── .noteflo/
│   ├── config.json              # Your configuration (git-ignored)
│   └── config.template.json     # Template file (git-tracked)
└── docs/
    ├── time-tracking/
    │   ├── time_entries_2025-01.json  # Monthly time entries
    │   └── active_session.json        # Current session (git-ignored)
    ├── meeting-notes/               # Meeting notes (git-tracked)
    ├── daily-notes/                 # Daily notes (git-tracked)  
    ├── project-planning/            # Todo lists (git-tracked)
    ├── client-invoices/             # Generated invoices (git-tracked)
    └── notes/
        └── index.md                 # Auto-generated index (git-tracked)
```

## ⌨️ **Keyboard Shortcuts**

| Shortcut  | Command             | Description                        |
| --------- | ------------------- | ---------------------------------- |
| `Cmd+K M` | New Meeting Note    | Create structured meeting note     |
| `Cmd+K T` | Quick Todo          | Add prioritized todo item          |
| `Cmd+K S` | Start Time Tracking | Begin tracking with description    |
| `Cmd+K E` | Stop Time Tracking  | End current tracking session       |
| `Cmd+K H` | Enter Time          | Manual time entry for offline work |
| `Cmd+K I` | Generate Invoice    | Create professional invoice        |
| `Cmd+K V` | View Invoices       | Browse invoice history             |
| `Cmd+K C` | Configure NoteFlo   | Access setup wizard                |
| `Cmd+K U` | Update Notes Index  | Refresh notes organization         |

## 🌐 **Timezone Support**

NoteFlo supports configurable timezones for global teams:

- **Configurable during setup**: America/Chicago, America/New_York, Europe/London, etc.
- **All timestamps use your business timezone**
- **Timezone validation** with helpful error messages
- **Multiple date formats** for different contexts

## 💼 **Perfect For**

- **Consultants**: Track client work and generate professional invoices
- **Freelancers**: Manage multiple projects with organized time tracking
- **Developers**: Document meetings and track feature development time
- **Project Managers**: Maintain organized notes and todo lists
- **Remote Workers**: Keep structured records of daily activities

## 🛠️ **System Requirements**

- **VS Code**: 1.60+ 
- **Node.js**: 20+ (for development)
- **Operating System**: Windows, macOS, Linux
- **Workspace**: Requires an open folder/workspace for functionality

## 📋 **Command Reference**

### **Configuration**
- `NoteFlo: Configure NoteFlo` - Interactive setup wizard

### **Time Tracking**
- `NoteFlo: Start Time Tracking` - Begin tracking with description
- `NoteFlo: Stop Time Tracking` - End current session
- `NoteFlo: Time Status` - Show current tracking status
- `NoteFlo: Enter Time` - Manual time entry for offline work

### **Note Management**
- `NoteFlo: New Meeting Note` - Create structured meeting note
- `NoteFlo: Quick Todo` - Add prioritized todo item
- `NoteFlo: Open Dashboard` - Access unified dashboard
- `NoteFlo: Update Notes Index` - Refresh notes organization

### **Invoicing**
- `NoteFlo: Generate Invoice` - Create professional invoices
- `NoteFlo: View Invoices` - Browse invoice history

## 🔧 **Troubleshooting**

### **Common Issues**

**Commands not found**: Ensure you have a workspace folder open. NoteFlo requires an active workspace.

**Sidebar shows "no data provider"**: Restart VS Code or run "Developer: Reload Window"

**Time tracking not working**: Check that you have proper file permissions in the workspace directory.

**PDF generation fails**: Ensure you have sufficient disk space and write permissions.

### **Getting Help**

- Check the [DEVELOPMENT.md](DEVELOPMENT.md) for technical details
- Review the [CHANGELOG.md](CHANGELOG.md) for recent updates
- Open an issue for bugs or feature requests

## 📄 **License**

MIT License - see [LICENSE](LICENSE) file for details.

## 👨‍💻 **Author & Organization**

**Created by**: [Chandra Shettigar](https://github.com/shettigarc)  
**Organization**: [Devteds](https://github.com/devteds)  
**Website**: [devteds.com](https://www.devteds.com)  
**Contact**: [chandra@devteds.com](mailto:chandra@devteds.com)

*Chandra is a Senior Software Engineer working across multiple technologies and programming languages, with a current focus on AI exploration and innovation.*

## 🎓 **Learn More**

Interested in DevOps, Platform Engineering, and Cloud technologies? Check out:

- **Courses**: [devteds.com](https://www.devteds.com)
- **YouTube**: [Chandra Shettigar](https://www.youtube.com/c/ChandraShettigar)
- **Blog**: [devteds.com](https://www.devteds.com)
- **LinkedIn**: [shettigarc](https://linkedin.com/in/shettigarc)

---

**NoteFlo** - Professional workflow made simple. Built for developers, by developers. 🚀