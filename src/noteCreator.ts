import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';
import { ConfigManager } from './configManager';
import { DashboardManager } from './dashboardManager';
import { formatDateInTimezone, getConfiguredTimezone } from './invoiceGenerator';

export class NoteCreator {
  private workspaceRoot: string;
  private dashboardManager: DashboardManager;
  private configManager: ConfigManager;

  constructor(workspaceRoot: string) {
    this.workspaceRoot = workspaceRoot;
    this.dashboardManager = new DashboardManager(workspaceRoot);
    this.configManager = ConfigManager.getInstance();
  }

  private async ensureDirectories(): Promise<void> {
    try {
      const config = {
        meetingNotesDir: await this.configManager.getMeetingNotesDir(),
        dailyNotesDir: await this.configManager.getDailyNotesDir(),
        generalNotesDir: await this.configManager.getGeneralNotesDir(),
        dashboardDir: await this.configManager.getDashboardDir(),
        dashboardPath: await this.configManager.getDashboardPath()
      };

      const dirs = [
        path.join(this.workspaceRoot, config.meetingNotesDir),
        path.join(this.workspaceRoot, config.dailyNotesDir),
        path.join(this.workspaceRoot, config.generalNotesDir),
        path.join(this.workspaceRoot, config.dashboardDir),
        path.dirname(path.join(this.workspaceRoot, config.dashboardPath))
      ];

      dirs.forEach(dir => {
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }
      });
    } catch (error) {
      console.error('Error ensuring directories:', error);
      // Fallback to sync defaults
      const dirs = [
        path.join(this.workspaceRoot, this.configManager.getMeetingNotesDirSync()),
        path.join(this.workspaceRoot, this.configManager.getDailyNotesDirSync()),
        path.join(this.workspaceRoot, this.configManager.getGeneralNotesDirSync()),
        path.join(this.workspaceRoot, this.configManager.getDashboardDirSync()),
        path.dirname(path.join(this.workspaceRoot, this.configManager.getDashboardPathSync()))
      ];

      dirs.forEach(dir => {
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }
      });
    }
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
    try {
      await this.ensureDirectories();

      // Get meeting details from user
      const meetingType = await vscode.window.showInputBox({
        prompt: 'Meeting type',
        value: 'Review'
      });
      if (!meetingType) return;

      const description = await vscode.window.showInputBox({
        prompt: 'Brief description',
        value: 'give it a short description'
      });
      if (!description) return;

      const attendees = await vscode.window.showInputBox({
        prompt: 'Attendees (names only)',
        value: 'Names'
      });
      if (!attendees) return;

      // Create filename in new format: topic-YYYY-MM-DD.md
      const timestamp = this.getTimestamp();
      const safeDesc = this.sanitizeFilename(description);
      const filename = `${safeDesc}-${timestamp}.md`;

      // Get meeting notes directory with robust error handling
      let meetingNotesDir: string;
      try {
        meetingNotesDir = path.join(this.workspaceRoot, await this.configManager.getMeetingNotesDir());
      } catch (error) {
        console.warn('Failed to get meeting notes dir from config, using default:', error);
        meetingNotesDir = path.join(this.workspaceRoot, this.configManager.getMeetingNotesDirSync());
      }

      const filepath = path.join(meetingNotesDir, filename);

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

      // Write file
      fs.writeFileSync(filepath, content);

      // Open file in VS Code
      const doc = await vscode.workspace.openTextDocument(filepath);
      await vscode.window.showTextDocument(doc);

      // Auto-update dashboard
      try {
        await this.dashboardManager.forceUpdate();
      } catch (error) {
        console.warn('Failed to update dashboard:', error);
      }

      vscode.window.showInformationMessage(`📝 Created meeting note: ${filename}`);

    } catch (error) {
      console.error('Error creating meeting note:', error);
      vscode.window.showErrorMessage(`Failed to create meeting note: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async createDailyJournal(): Promise<void> {
    try {
      await this.ensureDirectories();

      const timestamp = this.getTimestamp();
      const filename = `${timestamp}.md`;

      let dailyNotesDir: string;
      try {
        dailyNotesDir = path.join(this.workspaceRoot, await this.configManager.getDailyNotesDir());
      } catch (error) {
        console.warn('Failed to get daily notes dir from config, using default:', error);
        dailyNotesDir = path.join(this.workspaceRoot, this.configManager.getDailyNotesDirSync());
      }

      const filepath = path.join(dailyNotesDir, filename);

      // Check if file already exists
      if (fs.existsSync(filepath)) {
        // Open existing file
        const doc = await vscode.workspace.openTextDocument(filepath);
        await vscode.window.showTextDocument(doc);
        vscode.window.showInformationMessage(`📅 Opened existing daily journal: ${filename}`);
        return;
      }

      // Get configured timezone
      const timezone = getConfiguredTimezone(this.workspaceRoot);
      const currentTime = formatDateInTimezone(new Date(), timezone, 'readable');

      // Create daily journal content
      const content = `# Daily Journal - ${currentTime}

## 🎯 Today's Focus
- [ ] 

## ✨ Accomplishments
- 

## 📝 Notes & Observations
- 

## 🔄 Tomorrow's Priorities
- [ ] 

## 💭 Reflections
- 

---
*Daily journal entry for ${timestamp}*
`;

      // Write file
      fs.writeFileSync(filepath, content);

      // Open file in VS Code
      const doc = await vscode.workspace.openTextDocument(filepath);
      await vscode.window.showTextDocument(doc);

      // Auto-update dashboard
      try {
        await this.dashboardManager.forceUpdate();
      } catch (error) {
        console.warn('Failed to update dashboard:', error);
      }

      vscode.window.showInformationMessage(`📅 Created daily journal: ${filename}`);

    } catch (error) {
      console.error('Error creating daily journal:', error);
      vscode.window.showErrorMessage(`Failed to create daily journal: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async createNewNote(): Promise<void> {
    try {
      await this.ensureDirectories();

      // Get note title from user
      const noteTitle = await vscode.window.showInputBox({
        prompt: 'Note title',
        placeHolder: 'Enter a descriptive title for your note'
      });
      if (!noteTitle) return;

      // Get optional tags/category
      const category = await vscode.window.showQuickPick([
        'Development',
        'Research',
        'Ideas',
        'Documentation',
        'Learning',
        'Reference',
        'Other'
      ], {
        placeHolder: 'Select a category (optional)',
        canPickMany: false
      });

      // Create filename: title-YYYY-MM-DD.md
      const timestamp = this.getTimestamp();
      const safeTitle = this.sanitizeFilename(noteTitle);
      const filename = `${safeTitle}-${timestamp}.md`;

      let notesDir: string;
      try {
        notesDir = path.join(this.workspaceRoot, await this.configManager.getGeneralNotesDir());
      } catch (error) {
        console.warn('Failed to get general notes dir from config, using default:', error);
        notesDir = path.join(this.workspaceRoot, this.configManager.getGeneralNotesDirSync());
      }

      const filepath = path.join(notesDir, filename);

      // Get configured timezone
      const timezone = getConfiguredTimezone(this.workspaceRoot);
      const createdTime = formatDateInTimezone(new Date(), timezone, 'readable');

      // Create note content
      const categoryTag = category ? `\n**Category:** ${category}` : '';
      const content = `# ${noteTitle}

**Created:** ${createdTime}${categoryTag}

## Overview


## Details


## Resources
- 

## Related
- 

---
*Note created on ${timestamp}*
`;

      // Write file
      fs.writeFileSync(filepath, content);

      // Open file in VS Code
      const doc = await vscode.workspace.openTextDocument(filepath);
      await vscode.window.showTextDocument(doc);

      // Auto-update dashboard
      try {
        await this.dashboardManager.forceUpdate();
      } catch (error) {
        console.warn('Failed to update dashboard:', error);
      }

      vscode.window.showInformationMessage(`📝 Created note: ${filename}`);

    } catch (error) {
      console.error('Error creating note:', error);
      vscode.window.showErrorMessage(`Failed to create note: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async createQuickTodo(): Promise<void> {
    try {
      const todoText = await vscode.window.showInputBox({
        prompt: 'Enter your todo task',
        placeHolder: 'What needs to be done?'
      });
      if (!todoText) return;

      // Get category selection
      const category = await vscode.window.showQuickPick([
        { label: 'General', description: 'General tasks and reminders' },
        { label: 'Project', description: 'Tasks related to this workspace/project' }
      ], {
        placeHolder: 'Select todo category',
        canPickMany: false
      });
      if (!category) return;

      // Get priority level
      const priority = await vscode.window.showQuickPick([
        { label: 'Urgent', description: '🔴 Needs immediate attention' },
        { label: 'High', description: '🟠 Important and time-sensitive' },
        { label: 'Normal', description: '🟡 Regular priority' },
        { label: 'Low', description: '🟢 Can be done when time permits' }
      ], {
        placeHolder: 'Select priority level',
        canPickMany: false
      });
      if (!priority) return;

      let todoFile = '';
      let displayName = '';

      if (category.label === 'Project') {
        // Use workspace folder name for project todos
        const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
        const projectName = workspaceFolder ? path.basename(workspaceFolder.uri.fsPath) : 'project';
        displayName = projectName;
        todoFile = path.join(this.workspaceRoot, 'docs', 'project-planning', 'project-todos.md');
      } else {
        displayName = 'General';
        todoFile = path.join(this.workspaceRoot, 'docs', 'project-planning', 'general-todos.md');
      }

      // Ensure directory exists
      const todoDir = path.dirname(todoFile);
      if (!fs.existsSync(todoDir)) {
        fs.mkdirSync(todoDir, { recursive: true });
      }

      const timezone = getConfiguredTimezone(this.workspaceRoot);
      const timestamp = formatDateInTimezone(new Date(), timezone, 'readable');

      // Create priority-based todo entry with proper formatting
      const priorityEmoji = priority.label === 'Urgent' ? '🔴' :
        priority.label === 'High' ? '🟠' :
          priority.label === 'Normal' ? '🟡' : '🟢';

      const todoEntry = `- [ ] **[${priority.label}]** ${priorityEmoji} ${todoText} *(Added: ${timestamp})*\n`;

      // Create or update todo file with proper section management
      if (fs.existsSync(todoFile)) {
        let content = fs.readFileSync(todoFile, 'utf8');

        // Find the appropriate priority section or create it
        const sectionName = `### ${priority.label} Priority`;

        if (content.includes(sectionName)) {
          // Add to existing priority section
          content = content.replace(
            new RegExp(`(${sectionName}\\n)`),
            `$1${todoEntry}`
          );
        } else {
          // Create new priority section in the right order
          const sections = ['Urgent', 'High', 'Normal', 'Low'];
          const priorityIndex = sections.indexOf(priority.label);

          // Find where to insert the new section
          let insertAfter = '## Active Tasks';
          for (let i = 0; i < priorityIndex; i++) {
            const checkSection = `### ${sections[i]} Priority`;
            if (content.includes(checkSection)) {
              insertAfter = checkSection;
            }
          }

          if (content.includes(insertAfter)) {
            // Insert after the found section
            const insertPattern = new RegExp(`(${insertAfter}\\n(?:[^#]*?)(?=\\n### |\\n## |$))`, 's');
            content = content.replace(insertPattern, `$1\n${sectionName}\n${todoEntry}`);
          } else {
            // Fallback: append at the end of active tasks
            content += `\n${sectionName}\n${todoEntry}`;
          }
        }

        fs.writeFileSync(todoFile, content);
      } else {
        // Create new todo file with structured sections
        const title = category.label === 'Project' ? `# Project Todo List` : '# General Todo List';
        const content = `${title}

## Active Tasks

### ${priority.label} Priority
${todoEntry}

## Completed Tasks


---
*Todo list managed by NoteFlo*
*Priority levels: 🔴 Urgent | 🟠 High | 🟡 Normal | 🟢 Low*
`;
        fs.writeFileSync(todoFile, content);
      }

      // Auto-update dashboard
      try {
        await this.dashboardManager.forceUpdate();
      } catch (error) {
        console.warn('Failed to update dashboard:', error);
      }

      // Show success message with category and priority info
      vscode.window.showInformationMessage(
        `✅ Added ${priority.label.toLowerCase()} priority todo to ${displayName}: "${todoText}"`
      );

    } catch (error) {
      console.error('Error creating todo:', error);
      vscode.window.showErrorMessage(`Failed to create todo: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async openDashboard(): Promise<void> {
    try {
      // Generate/update the dynamic dashboard
      await this.dashboardManager.smartUpdate();

      let dashboardPath: string;
      try {
        dashboardPath = path.join(this.workspaceRoot, await this.configManager.getDashboardPath());
      } catch (error) {
        console.warn('Failed to get dashboard path from config, using default:', error);
        dashboardPath = path.join(this.workspaceRoot, this.configManager.getDashboardPathSync());
      }

      // Open the dashboard
      const doc = await vscode.workspace.openTextDocument(dashboardPath);
      await vscode.window.showTextDocument(doc);
    } catch (error) {
      console.error('Error opening dashboard:', error);
      vscode.window.showErrorMessage(`Failed to open dashboard: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async updateNotesIndex(): Promise<void> {
    try {
      await this.ensureDirectories();

      let notesIndexPath: string;
      try {
        const generalNotesDir = await this.configManager.getGeneralNotesDir();
        notesIndexPath = path.join(this.workspaceRoot, generalNotesDir, 'index.md');
      } catch (error) {
        console.warn('Failed to get notes dir from config, using default:', error);
        notesIndexPath = path.join(this.workspaceRoot, this.configManager.getGeneralNotesDirSync(), 'index.md');
      }

      const timezone = getConfiguredTimezone(this.workspaceRoot);
      const timestamp = formatDateInTimezone(new Date(), timezone, 'readable');

      let content = `# Notes Index

*Last updated: ${timestamp}*

## Recent Notes

`;

      // Scan and categorize notes
      const notesByCategory = {
        meeting: [] as string[],
        daily: [] as string[],
        general: [] as string[]
      };

      // Scan meeting notes
      try {
        const meetingNotesDir = path.join(this.workspaceRoot, await this.configManager.getMeetingNotesDir());
        if (fs.existsSync(meetingNotesDir)) {
          const meetingFiles = fs.readdirSync(meetingNotesDir).filter(f => f.endsWith('.md'));
          notesByCategory.meeting = meetingFiles.sort().reverse().slice(0, 10);
        }
      } catch (error) {
        console.warn('Error scanning meeting notes:', error);
      }

      // Scan daily notes
      try {
        const dailyNotesDir = path.join(this.workspaceRoot, await this.configManager.getDailyNotesDir());
        if (fs.existsSync(dailyNotesDir)) {
          const dailyFiles = fs.readdirSync(dailyNotesDir).filter(f => f.endsWith('.md'));
          notesByCategory.daily = dailyFiles.sort().reverse().slice(0, 10);
        }
      } catch (error) {
        console.warn('Error scanning daily notes:', error);
      }

      // Scan general notes
      try {
        const generalNotesDir = path.join(this.workspaceRoot, await this.configManager.getGeneralNotesDir());
        if (fs.existsSync(generalNotesDir)) {
          const noteFiles = fs.readdirSync(generalNotesDir).filter(f => f.endsWith('.md') && f !== 'index.md');
          notesByCategory.general = noteFiles.sort().reverse().slice(0, 10);
        }
      } catch (error) {
        console.warn('Error scanning general notes:', error);
      }

      // Add meeting notes section
      if (notesByCategory.meeting.length > 0) {
        content += `### 🗣️ Meeting Notes\n\n`;
        notesByCategory.meeting.forEach(file => {
          const title = file.replace('.md', '').replace(/-/g, ' ');
          content += `- [${title}](../meeting-notes/${file})\n`;
        });
        content += '\n';
      }

      // Add daily journals section
      if (notesByCategory.daily.length > 0) {
        content += `### 📅 Daily Journals\n\n`;
        notesByCategory.daily.forEach(file => {
          const date = file.replace('.md', '');
          content += `- [${date}](../daily-notes/${file})\n`;
        });
        content += '\n';
      }

      // Add general notes section
      if (notesByCategory.general.length > 0) {
        content += `### 📝 General Notes\n\n`;
        notesByCategory.general.forEach(file => {
          const title = file.replace('.md', '').replace(/-/g, ' ');
          content += `- [${title}](${file})\n`;
        });
        content += '\n';
      }

      content += `---

*This index is automatically generated by NoteFlo. Use "Update Notes Index" to refresh.*
`;

      // Write the index file
      fs.writeFileSync(notesIndexPath, content);

      vscode.window.showInformationMessage('📚 Notes index updated successfully!');

    } catch (error) {
      console.error('Error updating notes index:', error);
      vscode.window.showErrorMessage(`Failed to update notes index: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}
