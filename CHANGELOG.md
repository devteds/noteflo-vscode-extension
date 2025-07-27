# NoteFlo Changelog

All notable changes to the NoteFlo extension are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]
### Planning
- Extension marketplace publication
- Advanced PDF customization (logos, templates)
- Team collaboration features
- Calendar integration for automatic time tracking

---

## [1.0.0] - 2025-01-27 - "Professional Workflow Extension"

### ✨ **Initial Release**

NoteFlo 1.0.0 represents a complete professional workflow solution for consultants, freelancers, and developers working in VS Code.

### 🎯 **Core Features**

#### ⏱️ **Smart Time Tracking**
- One-click start/stop time tracking with descriptions
- Manual time entry for offline work, meetings, and travel
- Real-time status bar showing active timer and elapsed time
- Monthly file rotation for organized time entry storage
- Timezone-aware timestamps (configurable CST, EST, PST, etc.)

#### 📝 **Efficient Note Management**
- Quick meeting notes with smart templates and time tracking integration
- Instant todo creation with priority-based organization
- Auto-generated notes index organized by time periods
- Foam-compatible wiki-linking and graph visualization
- Filename optimization for both human readability and scripting

#### 💰 **Professional Invoicing**
- Dual-format generation: Markdown + PDF invoices
- Sequential invoice numbering (INV-2025-001, INV-2025-002...)
- Comprehensive invoice details: business info, client details, line items, tax calculations
- Multi-page PDF support with automatic page breaks
- Configurable currency and tax rates (default INR, supports any currency)
- Professional PDF layout with proper spacing and formatting

#### 🎯 **Integrated Workflow**
- Sidebar integration for quick access to all features
- Command palette commands for keyboard-driven workflow
- Smart time tracking prompts when creating meeting notes
- Unified dashboard for todos, recent activity, and quick actions
- Git-friendly file structure with appropriate `.gitignore` handling

### 🛠️ **Technical Implementation**

#### **Modern Architecture**
- **esbuild bundling** for fast, optimized builds (265KB package vs 6.6MB unbundled)
- **TypeScript 4.9+** with strict type checking
- **Node.js 20+** for modern JavaScript features
- **VS Code 1.60+** compatibility

#### **Professional Development Setup**
- **DevContainer support** for consistent development environment
- **Automated build pipeline** with development and production modes
- **Source maps** for debugging (excluded from production builds)
- **Comprehensive testing** utilities and workflows

#### **File Organization**
```
.noteflo/
├── config.json              # User configuration (git-ignored)
└── config.template.json     # Template (git-tracked)

docs/
├── time-tracking/
│   ├── time_entries_2025-01.json  # Monthly time entries
│   └── active_session.json        # Current session (git-ignored)
├── meeting-notes/           # Meeting notes (git-tracked)
├── daily-notes/             # Daily notes (git-tracked)
├── project-planning/        # Todo lists (git-tracked)
├── client-invoices/         # Invoices (git-tracked)
└── notes/
    └── index.md             # Auto-generated index (git-tracked)
```

### 🎨 **User Experience**

#### **Command Palette Integration**
- `NoteFlo: Configure NoteFlo` - Interactive setup wizard
- `NoteFlo: Start Time Tracking` - Begin tracking with description
- `NoteFlo: Stop Time Tracking` - End current session
- `NoteFlo: Enter Time` - Manual time entry
- `NoteFlo: New Meeting Note` - Create meeting note with template
- `NoteFlo: Quick Todo` - Add prioritized todo
- `NoteFlo: Generate Invoice` - Create professional invoices
- `NoteFlo: View Invoices` - Browse invoice history
- `NoteFlo: Open Dashboard` - Access unified dashboard
- `NoteFlo: Update Notes Index` - Refresh notes organization

#### **Keyboard Shortcuts**
- `Cmd+K M` - New Meeting Note
- `Cmd+K T` - Quick Todo
- `Cmd+K S` - Start Time Tracking
- `Cmd+K E` - End Time Tracking
- `Cmd+K H` - Enter Hours
- `Cmd+K I` - Generate Invoice
- `Cmd+K V` - View Invoices
- `Cmd+K C` - Configure NoteFlo
- `Cmd+K U` - Update Notes Index

### 🌐 **Timezone Support**
- **Configurable timezone** during setup (America/Chicago, America/New_York, etc.)
- **All timestamps** use configured business timezone
- **Timezone validation** with user-friendly error messages
- **Multiple date formats** (ISO, readable, date-only, date-time)

### 💼 **Professional Polish**
- **Comprehensive documentation** for users and contributors
- **Professional README** with clear installation and usage instructions
- **Developer guide** with architecture details and contribution guidelines
- **Clean file organization** with proper `.gitignore` and `.vscodeignore`
- **Modern build system** with esbuild for optimal performance
- **License and changelog** following open-source best practices

---

**Author**: [Chandra Shettigar](https://github.com/shettigarc)  
**Organization**: [Devteds](https://github.com/devteds)  
**Website**: [devteds.com](https://www.devteds.com)  
**Contact**: [chandra@devteds.com](mailto:chandra@devteds.com) 