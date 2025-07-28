import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';

export class SidebarProvider implements vscode.TreeDataProvider<SidebarItem> {
  private _onDidChangeTreeData: vscode.EventEmitter<SidebarItem | undefined | null | void> = new vscode.EventEmitter<SidebarItem | undefined | null | void>();
  readonly onDidChangeTreeData: vscode.Event<SidebarItem | undefined | null | void> = this._onDidChangeTreeData.event;

  constructor(private workspaceRoot: string) { }

  refresh(): void {
    this._onDidChangeTreeData.fire();
  }

  getTreeItem(element: SidebarItem): vscode.TreeItem {
    return element;
  }

  getChildren(element?: SidebarItem): SidebarItem[] {
    if (!element) {
      // Handle no workspace case
      if (!this.workspaceRoot) {
        return [
          new SidebarItem('📁 Open Workspace', vscode.TreeItemCollapsibleState.None, 'folder-opened', 'workbench.action.files.openFolder'),
          new SidebarItem('ℹ️ NoteFlo requires a workspace', vscode.TreeItemCollapsibleState.None, 'info')
        ];
      }

      const configExists = this.checkConfigExists();
      const items: SidebarItem[] = [];

      // Configuration status
      if (configExists) {
        items.push(new SidebarItem('✅ Configured', vscode.TreeItemCollapsibleState.None, 'check', 'noteflo.configure'));
      } else {
        items.push(new SidebarItem('⚙️ Configure First', vscode.TreeItemCollapsibleState.None, 'gear', 'noteflo.configure'));
      }

      // Add other commands only if configured or show them disabled
      items.push(
        new SidebarItem('Timer Status', vscode.TreeItemCollapsibleState.None, 'clock', 'noteflo.timeStatus'),
        new SidebarItem('Start Tracking', vscode.TreeItemCollapsibleState.None, 'play', 'noteflo.startTimeTracking'),
        new SidebarItem('Stop Tracking', vscode.TreeItemCollapsibleState.None, 'stop', 'noteflo.stopTimeTracking'),
        new SidebarItem('Enter Time', vscode.TreeItemCollapsibleState.None, 'add', 'noteflo.enterTime'),
        new SidebarItem('New Meeting Note', vscode.TreeItemCollapsibleState.None, 'comment-discussion', 'noteflo.newMeetingNote'),
        new SidebarItem('Create Daily Journal', vscode.TreeItemCollapsibleState.None, 'book', 'noteflo.createDailyJournal'),
        new SidebarItem('Create New Note', vscode.TreeItemCollapsibleState.None, 'note', 'noteflo.createNewNote'),
        new SidebarItem('Quick Todo', vscode.TreeItemCollapsibleState.None, 'checklist', 'noteflo.quickTodo'),
        new SidebarItem('Open Dashboard', vscode.TreeItemCollapsibleState.None, 'dashboard', 'noteflo.openDashboard'),
        new SidebarItem('Refresh Dashboard', vscode.TreeItemCollapsibleState.None, 'sync', 'noteflo.refreshDashboard'),
        new SidebarItem('Edit Configuration', vscode.TreeItemCollapsibleState.None, 'gear', 'noteflo.editConfig'),
        new SidebarItem('Update Notes Index', vscode.TreeItemCollapsibleState.None, 'refresh', 'noteflo.updateNotesIndex')
      );

      if (configExists) {
        items.push(
          new SidebarItem('Generate Invoice', vscode.TreeItemCollapsibleState.None, 'file-pdf', 'noteflo.generateInvoice'),
          new SidebarItem('View Invoices', vscode.TreeItemCollapsibleState.None, 'folder', 'noteflo.viewInvoices')
        );
      }

      return items;
    }
    return [];
  }

  private checkConfigExists(): boolean {
    if (!this.workspaceRoot) {
      return false;
    }
    const configPath = path.join(this.workspaceRoot, '.noteflo', 'config.json');
    return fs.existsSync(configPath);
  }
}

class SidebarItem extends vscode.TreeItem {
  constructor(
    public readonly label: string,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState,
    public readonly iconName: string,
    public readonly commandId?: string
  ) {
    super(label, collapsibleState);

    if (commandId) {
      this.command = {
        command: commandId,
        title: label,
        arguments: []
      };
    }

    // Set icon
    this.iconPath = new vscode.ThemeIcon(iconName);
  }
} 