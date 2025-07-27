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

## [1.0.0] - 2024-07-27 - "Timezone Configuration"
### Added
- **Configurable timezone support** - No more hardcoded UTC!
  - Interactive timezone configuration during setup (e.g., America/Chicago for CST)
  - Timezone validation with user-friendly error messages
  - All timestamps now use configured business timezone
- **Enhanced date formatting utilities**
  - `formatDateInTimezone()` with multiple format options (iso, readable, date-only, date-time)
  - `getConfiguredTimezone()` for consistent timezone access across modules
- **Updated configuration schema**
  - Added `preferences.timezone` to NoteFloConfig interface
  - Default timezone: America/Chicago (CST)
  - Template file includes timezone example

### Changed
- **All timestamp generation now timezone-aware**:
  - Time tracking start/stop times use configured timezone
  - Meeting note timestamps show business timezone
  - Invoice dates and time entries use configured timezone
  - Notes index and dashboard updates use configured timezone
  - Manual time entry date picker defaults to configured timezone
- **Configuration template updated** with timezone example
- **User prompts improved** with timezone format examples and validation

### Technical
- Updated all modules to import and use timezone utilities
- Centralized timezone handling in `invoiceGenerator.ts`
- Comprehensive timezone integration across `timeTracker.ts`, `noteCreator.ts`, and `invoiceGenerator.ts`

---

## [0.5.0] - 2024-07-27 - "Multi-Page PDF Support"
### Added
- **Professional multi-page PDF generation**
  - Custom `PDFLayout` class for consistent formatting
  - Automatic page break detection and management
  - Content overflow protection (no more lost content!)
- **Enhanced PDF formatting**
  - Side-by-side FROM/TO sections with `addTwoColumns()` method
  - Proper spacing between currency symbols and amounts
  - Professional typography with consistent spacing
  - Clean table layouts with appropriate borders

### Fixed
- **PDF content overflow** - Content no longer gets lost on second page
- **Spacing issues** - Proper padding around total due sections
- **Currency formatting** - Added space between currency symbol and amount (e.g., "INR 8500")
- **Layout problems** - FROM/TO sections now display side-by-side professionally

### Technical
- Implemented `PDFLayout` helper class with methods:
  - `checkPageBreak()` for automatic page management
  - `addTwoColumns()` for side-by-side layouts
  - `addWrappedText()` for proper line break handling
  - `addRightAlignedSummary()` for professional totals section

---

## [0.4.0] - 2024-07-27 - "Professional PDF Enhancement"
### Added
- **Enhanced PDF invoice generation**
  - Improved spacing and typography
  - Better table formatting
  - Professional layout structure
- **Line break support in PDFs**
  - Payment instructions with explicit line breaks
  - Invoice notes with proper formatting
  - Multi-line address support

### Changed
- **PDF generation rewrite** for better maintainability
- **Improved text wrapping** in PDF documents
- **Enhanced formatting** for professional appearance

### Fixed
- **PDF text overflow** issues
- **Line break handling** in payment instructions and notes
- **Spacing inconsistencies** in generated PDFs

---

## [0.3.0] - 2024-07-27 - "Extension Rebranding"
### Changed
- **Rebranded from "Consultant Toolkit" to "NoteFlo"**
  - Updated all command IDs from `consultant.*` to `noteflo.*`
  - Changed display name and description
  - Updated configuration properties
  - Renamed sidebar from `consultantSidebar` to `notefloSidebar`
- **Configuration file migration**
  - Changed from `.consultant/config.json` to `.noteflo/config.json`
  - Updated .gitignore patterns
  - Maintained backward compatibility during transition

### Technical
- Systematic rename across all TypeScript files
- Updated package.json with new branding
- Changed activation events and contribution points
- Updated README and documentation

---

## [0.2.0] - 2024-07-27 - "Core VS Code Extension"
### Added
- **Complete VS Code extension implementation**
  - TypeScript-based architecture with proper module separation
  - Native VS Code integration (status bar, sidebar, commands)
  - Real-time time tracking with 5-second status bar updates
  - Interactive configuration setup wizard
- **Professional invoicing system**
  - Dual-format generation (Markdown + PDF)
  - Sequential invoice numbering (INV-2025-001, INV-2025-002...)
  - Comprehensive invoice details (business info, client details, tax calculation)
  - Professional PDF layout with jsPDF integration
- **Enhanced note management**
  - Quick meeting note creation with simplified templates
  - Time tracking integration (smart prompts when creating notes)
  - Auto-generated unified notes index
  - Todo management with priority levels
- **Sidebar integration**
  - Custom tree view for quick access to all features
  - Real-time status updates
  - Context-sensitive actions
- **File structure management**
  - Automatic directory creation
  - Proper .gitignore handling
  - Monthly time entry rotation
  - Git-tracked deliverables

### Changed
- **Architecture**: Complete rewrite from Python scripts to TypeScript extension
- **Configuration**: Moved from scattered config files to unified `.consultant/config.json`
- **User experience**: Command palette integration with keyboard shortcuts
- **File naming**: Topic-first naming convention for better readability

### Technical
- Modular TypeScript architecture:
  - `extension.ts` - Main activation and command registration
  - `timeTracker.ts` - Time tracking functionality
  - `noteCreator.ts` - Note and todo management
  - `invoiceGenerator.ts` - Invoice generation and configuration
  - `providers/sidebarProvider.ts` - Custom sidebar tree view
- VS Code API integration for native experience
- jsPDF for professional PDF generation
- File-based storage maintaining Git compatibility

---

## [0.1.0] - 2024-07 - "Python Scripts Foundation"
### Added
- **Initial Python-based toolkit**
  - `track.py` - Command-line time tracking
  - `generate_invoice.py` - Basic PDF invoice generation
  - JSON file storage for time entries
  - Basic configuration management
- **S3 integration** (later made optional)
  - Cloud backup for time entries and invoices
  - Sync script for optional cloud storage
- **Note-taking enhancements**
  - Meeting note templates
  - VS Code tasks for quick access
  - Basic todo management
- **Foam integration**
  - Wiki-linking support
  - Daily notes compatibility
  - Graph visualization of note connections

### Key Design Decisions
- **Git-first approach**: Time entries and invoices tracked in version control
- **Monthly rotation**: Split time entries by month for performance
- **INR currency**: Default to Indian Rupees for target market
- **Simple CLI**: Minimal interface for quick adoption
- **Template-driven notes**: Consistent meeting note format

### Evolution Triggers
- User feedback on S3 complexity vs. benefit
- Request for better note-taking workflow
- Need for professional PDF formatting
- Desire for VS Code extension instead of scattered scripts

---

## Development Evolution Summary

### Phase 1: Python Scripts (0.1.0)
- **Goal**: Basic time tracking and invoicing
- **Approach**: Simple CLI tools with Git storage
- **Learning**: Git-first approach simpler than cloud-first

### Phase 2: Enhanced Workflow (0.1.x)
- **Goal**: Better note management and backup options
- **Approach**: S3 integration, Foam compatibility, VS Code tasks
- **Learning**: Optional cloud backup better than primary cloud storage

### Phase 3: VS Code Extension (0.2.0)
- **Goal**: Unified, reusable tool within development environment
- **Approach**: Complete rewrite as TypeScript extension
- **Learning**: Integration beats separate tools for developer workflows

### Phase 4: Professional Polish (0.3.0 - 1.0.0)
- **Goal**: Professional appearance and robust functionality
- **Approach**: PDF improvements, branding, timezone support
- **Learning**: Professional appearance details matter immediately to users

---

## Migration Guide

### From Python Scripts to Extension
1. Install the NoteFlo extension VSIX file
2. Run `NoteFlo: Configure` to set up your workspace
3. Your existing time entries and notes remain compatible
4. Update any custom scripts to use new file paths

### From 0.3.0 (Consultant Toolkit) to 1.0.0 (NoteFlo)
1. Configuration automatically migrates from `.consultant/` to `.noteflo/`
2. All command IDs updated (use Command Palette to find new commands)
3. Sidebar and status bar integration remains the same
4. No data loss - all time entries and notes preserved

---

**NoteFlo continues to evolve based on real-world usage and user feedback. Each version builds on lessons learned from actual consulting workflows.** 