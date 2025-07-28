import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';
import { ConfigManager } from './configManager';
import { formatDateInTimezone, getConfiguredTimezone } from './invoiceGenerator';

interface NoteInfo {
  filename: string;
  title: string;
  date: string;
  type: 'meeting' | 'daily' | 'note';
  folder: string;
  fullPath: string;
}

interface DashboardStats {
  totalNotes: number;
  thisWeek: number;
  thisMonth: number;
  byType: {
    meeting: number;
    daily: number;
    note: number;
  };
}

interface TimeGroupedNotes {
  recent: NoteInfo[];
  thisWeek: NoteInfo[];
  thisMonth: NoteInfo[];
  older: NoteInfo[];
}

export class DashboardManager {
  private workspaceRoot: string;
  private lastUpdateTimestamp: number = 0;

  constructor(workspaceRoot: string) {
    this.workspaceRoot = workspaceRoot;
  }

  private async getConfig() {
    const configManager = ConfigManager.getInstance();
    return {
      dashboardPath: await configManager.getDashboardPath(),
      meetingNotesDir: await configManager.getMeetingNotesDir(),
      dailyNotesDir: await configManager.getDailyNotesDir(),
      notesDir: await configManager.getGeneralNotesDir(),
      dashboardSubDir: await configManager.getDashboardDir()
    };
  }

  private async ensureDirectories(): Promise<void> {
    const config = await this.getConfig();
    const dirs = [
      path.dirname(path.join(this.workspaceRoot, config.dashboardPath)),
      path.join(this.workspaceRoot, config.dashboardSubDir),
      path.join(this.workspaceRoot, config.meetingNotesDir),
      path.join(this.workspaceRoot, config.dailyNotesDir),
      path.join(this.workspaceRoot, config.notesDir)
    ];

    dirs.forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
  }

  /**
   * Main entry point - generates the complete dynamic dashboard system
   */
  async generateDynamicDashboard(): Promise<void> {
    console.log('🔄 Generating dynamic dashboard...');

    // Scan all notes
    const allNotes = await this.scanAllNotes();

    // Calculate statistics
    const stats = this.calculateStats(allNotes);

    // Group notes by time periods
    const groupedNotes = this.groupNotesByTime(allNotes);

    // Generate all dashboard files
    await this.generateMainDashboard(allNotes, stats, groupedNotes);
    await this.generateWeeklySummary(groupedNotes.thisWeek);
    await this.generateMonthlySummary(groupedNotes.thisMonth);
    await this.generateArchiveSummary(groupedNotes.older);

    // Update timestamp
    this.lastUpdateTimestamp = Date.now();

    vscode.window.showInformationMessage(`📊 Dynamic dashboard updated with ${allNotes.length} notes`);
  }

  /**
   * Smart update - only regenerates if needed
   */
  async smartUpdate(): Promise<void> {
    // Check if significant time has passed or if notes have been modified
    const shouldUpdate = await this.shouldUpdateDashboard();

    if (shouldUpdate) {
      await this.generateDynamicDashboard();
    }
  }

  /**
   * Force update - called after note creation/modification
   */
  async forceUpdate(): Promise<void> {
    await this.generateDynamicDashboard();
  }

  /**
   * Scan all notes from all directories
   */
  private async scanAllNotes(): Promise<NoteInfo[]> {
    const notes: NoteInfo[] = [];
    const config = await this.getConfig();

    // Scan meeting notes
    const meetingNotesDir = path.join(this.workspaceRoot, config.meetingNotesDir);
    if (fs.existsSync(meetingNotesDir)) {
      const files = fs.readdirSync(meetingNotesDir).filter(f => f.endsWith('.md'));
      for (const filename of files) {
        const noteInfo = this.parseMeetingFilename(filename);
        if (noteInfo) {
          notes.push({
            filename,
            title: noteInfo.title,
            date: noteInfo.date,
            type: 'meeting',
            folder: 'meeting-notes',
            fullPath: path.join(meetingNotesDir, filename)
          });
        }
      }
    }

    // Scan daily notes
    const dailyNotesDir = path.join(this.workspaceRoot, config.dailyNotesDir);
    if (fs.existsSync(dailyNotesDir)) {
      const files = fs.readdirSync(dailyNotesDir).filter(f => f.endsWith('.md'));
      for (const filename of files) {
        const noteInfo = this.parseDailyFilename(filename);
        if (noteInfo) {
          notes.push({
            filename,
            title: noteInfo.title,
            date: noteInfo.date,
            type: 'daily',
            folder: 'daily-notes',
            fullPath: path.join(dailyNotesDir, filename)
          });
        }
      }
    }

    // Scan general notes
    const notesDir = path.join(this.workspaceRoot, config.notesDir);
    if (fs.existsSync(notesDir)) {
      const files = fs.readdirSync(notesDir).filter(f => f.endsWith('.md') && f !== 'index.md');
      for (const filename of files) {
        const noteInfo = this.parseNoteFilename(filename);
        if (noteInfo) {
          notes.push({
            filename,
            title: noteInfo.title,
            date: noteInfo.date,
            type: 'note',
            folder: 'notes',
            fullPath: path.join(notesDir, filename)
          });
        }
      }
    }

    // Sort by date (newest first)
    notes.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return notes;
  }

  /**
   * Calculate comprehensive statistics
   */
  private calculateStats(notes: NoteInfo[]): DashboardStats {
    const now = new Date();
    const thisWeekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    return {
      totalNotes: notes.length,
      thisWeek: notes.filter(n => new Date(n.date) >= thisWeekStart).length,
      thisMonth: notes.filter(n => new Date(n.date) >= thisMonthStart).length,
      byType: {
        meeting: notes.filter(n => n.type === 'meeting').length,
        daily: notes.filter(n => n.type === 'daily').length,
        note: notes.filter(n => n.type === 'note').length,
      }
    };
  }

  /**
   * Group notes by time periods for intelligent organization
   */
  private groupNotesByTime(notes: NoteInfo[]): TimeGroupedNotes {
    const now = new Date();
    const thisWeekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    return {
      recent: notes.slice(0, 10), // Most recent 10
      thisWeek: notes.filter(n => new Date(n.date) >= thisWeekStart),
      thisMonth: notes.filter(n => {
        const noteDate = new Date(n.date);
        return noteDate >= thisMonthStart && noteDate < thisWeekStart;
      }),
      older: notes.filter(n => new Date(n.date) < thisMonthStart)
    };
  }

  /**
   * Generate the main dashboard with improved UX layout
   */
  private async generateMainDashboard(allNotes: NoteInfo[], stats: DashboardStats, groupedNotes: TimeGroupedNotes): Promise<void> {
    await this.ensureDirectories();

    const timezone = getConfiguredTimezone(this.workspaceRoot);
    const timestamp = formatDateInTimezone(new Date(), timezone, 'readable');
    const config = await this.getConfig();

    const content = `# 📊 NoteFlo Dashboard

*Last updated: ${timestamp}*

## ⚡ Recent Activity (Last 10)

${this.formatNotesForDashboard(groupedNotes.recent)}

##  This Week (${groupedNotes.thisWeek.length} notes)

${groupedNotes.thisWeek.length > 0 ? this.formatNotesForDashboard(groupedNotes.thisWeek.slice(0, 5)) : '*No notes this week yet*'}
${groupedNotes.thisWeek.length > 5 ? `\n*[→ View all ${groupedNotes.thisWeek.length} notes from this week](${config.dashboardSubDir.replace(config.dashboardPath.split('/')[0] + '/', '')}/this-week.md)*` : ''}

## 📆 This Month (${groupedNotes.thisMonth.length} notes)

${groupedNotes.thisMonth.length > 0 ? this.formatNotesForDashboard(groupedNotes.thisMonth.slice(0, 3)) : '*No older notes this month*'}
${groupedNotes.thisMonth.length > 3 ? `\n*[→ View all ${groupedNotes.thisMonth.length} notes from this month](${config.dashboardSubDir.replace(config.dashboardPath.split('/')[0] + '/', '')}/this-month.md)*` : ''}

## 📚 Older Notes (${groupedNotes.older.length} notes)

${groupedNotes.older.length > 0 ? '*Historical notes organized by month*' : '*No older notes yet*'}
${groupedNotes.older.length > 0 ? `\n*[→ Browse older notes](${config.dashboardSubDir.replace(config.dashboardPath.split('/')[0] + '/', '')}/older-notes.md)*` : ''}

---

## 📁 Browse by Type

| Type | Count | Latest |
|------|-------|--------|
| 🗣️ **[Meeting Notes](${config.meetingNotesDir.replace(config.dashboardPath.split('/')[0] + '/', '')})** | ${stats.byType.meeting} | ${this.getLatestNoteDate(allNotes, 'meeting')} |
| 📓 **[Daily Journals](${config.dailyNotesDir.replace(config.dashboardPath.split('/')[0] + '/', '')})** | ${stats.byType.daily} | ${this.getLatestNoteDate(allNotes, 'daily')} |
| � **[General Notes](${config.notesDir.replace(config.dashboardPath.split('/')[0] + '/', '')})** | ${stats.byType.note} | ${this.getLatestNoteDate(allNotes, 'note')} |

## 🛠️ Management

- � **[Refresh Dashboard](command:noteflo.refreshDashboard)** \`Cmd+K R\` - Update this dashboard
- � **[Update Notes Index](command:noteflo.updateNotesIndex)** \`Cmd+K U\` - Rebuild notes index
- ⚙️ **[Configure NoteFlo](command:noteflo.configure)** - Extension settings

## 📊 Quick Stats

- **Total Notes**: ${stats.totalNotes}
- **This Week**: ${stats.thisWeek} ${stats.thisWeek > 0 ? '🔥' : '💤'}
- **This Month**: ${stats.thisMonth} ${stats.thisMonth > 5 ? '🚀' : '📈'}
- **Most Active**: ${this.getMostActiveDay(allNotes)}
- **Avg/Week**: ${(stats.totalNotes / Math.max(1, this.getWeeksSinceFirstNote(allNotes))).toFixed(1)}

---

*🤖 This dashboard auto-updates when you create or modify notes*

`;

    const dashboardPath = path.join(this.workspaceRoot, config.dashboardPath);
    fs.writeFileSync(dashboardPath, content);
  }

  /**
   * Generate weekly summary file
   */
  private async generateWeeklySummary(weekNotes: NoteInfo[]): Promise<void> {
    await this.ensureDirectories();

    const timezone = getConfiguredTimezone(this.workspaceRoot);
    const timestamp = formatDateInTimezone(new Date(), timezone, 'readable');

    const content = `# 📅 This Week's Notes

*Generated: ${timestamp}*

## Overview
- **Total notes this week**: ${weekNotes.length}
- **Meeting notes**: ${weekNotes.filter(n => n.type === 'meeting').length}
- **Daily journals**: ${weekNotes.filter(n => n.type === 'daily').length}
- **General notes**: ${weekNotes.filter(n => n.type === 'note').length}

## All Notes This Week

${weekNotes.length > 0 ? this.formatDetailedNotesList(weekNotes) : '*No notes created this week yet*'}

---

[← Back to Dashboard](../index.md)
`;

    const config = await this.getConfig();
    const weeklyPath = path.join(this.workspaceRoot, config.dashboardSubDir, 'this-week.md');
    fs.writeFileSync(weeklyPath, content);
  }

  /**
   * Generate monthly summary file
   */
  private async generateMonthlySummary(monthNotes: NoteInfo[]): Promise<void> {
    await this.ensureDirectories();

    const timezone = getConfiguredTimezone(this.workspaceRoot);
    const timestamp = formatDateInTimezone(new Date(), timezone, 'readable');

    const content = `# 📆 This Month's Notes

*Generated: ${timestamp}*

## Overview
- **Total notes this month**: ${monthNotes.length}
- **Meeting notes**: ${monthNotes.filter(n => n.type === 'meeting').length}
- **Daily journals**: ${monthNotes.filter(n => n.type === 'daily').length}
- **General notes**: ${monthNotes.filter(n => n.type === 'note').length}

## All Notes This Month

${monthNotes.length > 0 ? this.formatDetailedNotesList(monthNotes) : '*No older notes this month*'}

---

[← Back to Dashboard](../index.md)
`;

    const config = await this.getConfig();
    const monthlyPath = path.join(this.workspaceRoot, config.dashboardSubDir, 'this-month.md');
    fs.writeFileSync(monthlyPath, content);
  }

  /**
   * Generate archive summary with month-by-month breakdown
   */
  private async generateArchiveSummary(olderNotes: NoteInfo[]): Promise<void> {
    await this.ensureDirectories();

    const timezone = getConfiguredTimezone(this.workspaceRoot);
    const timestamp = formatDateInTimezone(new Date(), timezone, 'readable');

    // Group older notes by month
    const notesByMonth = new Map<string, NoteInfo[]>();
    for (const note of olderNotes) {
      const monthKey = note.date.substring(0, 7); // YYYY-MM
      if (!notesByMonth.has(monthKey)) {
        notesByMonth.set(monthKey, []);
      }
      notesByMonth.get(monthKey)!.push(note);
    }

    // Sort months in descending order
    const sortedMonths = Array.from(notesByMonth.keys()).sort().reverse();

    let content = `# 📚 Older Notes

*Generated: ${timestamp}*

## Overview
- **Total older notes**: ${olderNotes.length}
- **Months with content**: ${sortedMonths.length}

`;

    if (sortedMonths.length > 0) {
      content += `## Notes by Month\n\n`;

      for (const monthKey of sortedMonths) {
        const monthNotes = notesByMonth.get(monthKey)!;
        const monthName = new Date(monthKey + '-01').toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long'
        });

        content += `### ${monthName} (${monthNotes.length} notes)\n\n`;
        content += this.formatDetailedNotesList(monthNotes);
        content += '\n';
      }
    } else {
      content += '*No older notes yet*\n';
    }

    content += `\n---\n\n[← Back to Dashboard](../index.md)\n`;

    const config = await this.getConfig();
    const archivePath = path.join(this.workspaceRoot, config.dashboardSubDir, 'older-notes.md');
    fs.writeFileSync(archivePath, content);
  }

  /**
   * Format notes for dashboard display (compact)
   */
  private formatNotesForDashboard(notes: NoteInfo[]): string {
    if (notes.length === 0) return '*No notes yet*';

    return notes.map(note => {
      const icon = this.getNoteIcon(note.type);
      return `- ${icon} **[${note.title}](${note.folder}/${note.filename})** - *${note.date}*`;
    }).join('\n');
  }

  /**
   * Format notes for detailed view (with more info)
   */
  private formatDetailedNotesList(notes: NoteInfo[]): string {
    if (notes.length === 0) return '*No notes in this period*';

    return notes.map(note => {
      const icon = this.getNoteIcon(note.type);
      const typeLabel = note.type.charAt(0).toUpperCase() + note.type.slice(1);
      return `### ${icon} [${note.title}](../${note.folder}/${note.filename})
- **Type**: ${typeLabel}
- **Date**: ${note.date}
- **File**: \`${note.filename}\`

`;
    }).join('\n');
  }

  /**
   * Get appropriate icon for note type
   */
  private getNoteIcon(type: 'meeting' | 'daily' | 'note'): string {
    switch (type) {
      case 'meeting': return '🗣️';
      case 'daily': return '📓';
      case 'note': return '📝';
      default: return '📄';
    }
  }

  // Analytics helper methods
  private getMostActiveDay(notes: NoteInfo[]): string {
    const dayCount = new Map<string, number>();
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    notes.forEach(note => {
      const day = new Date(note.date).getDay();
      const dayName = dayNames[day];
      dayCount.set(dayName, (dayCount.get(dayName) || 0) + 1);
    });

    let maxDay = 'Monday';
    let maxCount = 0;
    for (const [day, count] of dayCount) {
      if (count > maxCount) {
        maxCount = count;
        maxDay = day;
      }
    }

    return maxCount > 0 ? `${maxDay} (${maxCount} notes)` : 'Not enough data';
  }

  private getWeeksSinceFirstNote(notes: NoteInfo[]): number {
    if (notes.length === 0) return 1;

    const firstNoteDate = new Date(notes[notes.length - 1].date);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - firstNoteDate.getTime());
    const diffWeeks = Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 7));

    return Math.max(1, diffWeeks);
  }

  private getFavoriteNoteType(byType: { meeting: number; daily: number; note: number }): string {
    let maxType = 'note';
    let maxCount = byType.note;

    if (byType.meeting > maxCount) {
      maxType = 'meeting';
      maxCount = byType.meeting;
    }

    if (byType.daily > maxCount) {
      maxType = 'daily';
      maxCount = byType.daily;
    }

    const typeNames = {
      meeting: 'Meeting Notes',
      daily: 'Daily Journals',
      note: 'General Notes'
    };

    return maxCount > 0 ? `${typeNames[maxType as keyof typeof typeNames]} (${maxCount})` : 'Not enough data';
  }

  private getLatestNoteDate(notes: NoteInfo[], type: 'meeting' | 'daily' | 'note'): string {
    const notesOfType = notes.filter(n => n.type === type);
    if (notesOfType.length === 0) return '-';

    // Notes are already sorted by date (newest first)
    return notesOfType[0].date;
  }

  /**
   * Check if dashboard should be updated
   */
  private async shouldUpdateDashboard(): Promise<boolean> {
    // Always update if it's been more than 1 hour
    const oneHour = 60 * 60 * 1000;
    if (Date.now() - this.lastUpdateTimestamp > oneHour) {
      return true;
    }

    // Check if any note files have been modified recently
    const allNotes = await this.scanAllNotes();
    for (const note of allNotes) {
      try {
        const stats = fs.statSync(note.fullPath);
        if (stats.mtime.getTime() > this.lastUpdateTimestamp) {
          return true;
        }
      } catch (error) {
        // File might have been deleted, update dashboard
        return true;
      }
    }

    return false;
  }

  // File parsing methods (similar to NoteCreator)
  private parseMeetingFilename(filename: string): { title: string, date: string } | null {
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
      return { title: `Daily Journal`, date: match[1] };
    }
    return null;
  }

  private parseNoteFilename(filename: string): { title: string, date: string } | null {
    const match = filename.match(/^(.+)-(\d{4}-\d{2}-\d{2})\.md$/);
    if (match) {
      return { title: match[1].replace(/-/g, ' '), date: match[2] };
    }
    return null;
  }
}
