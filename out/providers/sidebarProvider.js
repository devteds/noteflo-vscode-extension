"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SidebarProvider = void 0;
const fs = require("fs");
const path = require("path");
const vscode = require("vscode");
class SidebarProvider {
    constructor(workspaceRoot) {
        this.workspaceRoot = workspaceRoot;
        this._onDidChangeTreeData = new vscode.EventEmitter();
        this.onDidChangeTreeData = this._onDidChangeTreeData.event;
    }
    refresh() {
        this._onDidChangeTreeData.fire();
    }
    getTreeItem(element) {
        return element;
    }
    getChildren(element) {
        if (!element) {
            // Handle no workspace case
            if (!this.workspaceRoot) {
                return [
                    new SidebarItem('📁 Open Workspace', vscode.TreeItemCollapsibleState.None, 'folder-opened', 'workbench.action.files.openFolder'),
                    new SidebarItem('ℹ️ NoteFlo requires a workspace', vscode.TreeItemCollapsibleState.None, 'info')
                ];
            }
            const configExists = this.checkConfigExists();
            const items = [];
            // Configuration status
            if (configExists) {
                items.push(new SidebarItem('✅ Configured', vscode.TreeItemCollapsibleState.None, 'check', 'noteflo.configure'));
            }
            else {
                items.push(new SidebarItem('⚙️ Configure First', vscode.TreeItemCollapsibleState.None, 'gear', 'noteflo.configure'));
            }
            // Add other commands only if configured or show them disabled
            items.push(new SidebarItem('Timer Status', vscode.TreeItemCollapsibleState.None, 'clock', 'noteflo.timeStatus'), new SidebarItem('Start Tracking', vscode.TreeItemCollapsibleState.None, 'play', 'noteflo.startTimeTracking'), new SidebarItem('Stop Tracking', vscode.TreeItemCollapsibleState.None, 'stop', 'noteflo.stopTimeTracking'), new SidebarItem('Enter Time', vscode.TreeItemCollapsibleState.None, 'add', 'noteflo.enterTime'), new SidebarItem('New Meeting Note', vscode.TreeItemCollapsibleState.None, 'note', 'noteflo.newMeetingNote'), new SidebarItem('Quick Todo', vscode.TreeItemCollapsibleState.None, 'checklist', 'noteflo.quickTodo'), new SidebarItem('Update Notes Index', vscode.TreeItemCollapsibleState.None, 'refresh', 'noteflo.updateNotesIndex'));
            if (configExists) {
                items.push(new SidebarItem('Generate Invoice', vscode.TreeItemCollapsibleState.None, 'file-pdf', 'noteflo.generateInvoice'), new SidebarItem('View Invoices', vscode.TreeItemCollapsibleState.None, 'folder', 'noteflo.viewInvoices'));
            }
            return items;
        }
        return [];
    }
    checkConfigExists() {
        if (!this.workspaceRoot) {
            return false;
        }
        const configPath = path.join(this.workspaceRoot, '.noteflo', 'config.json');
        return fs.existsSync(configPath);
    }
}
exports.SidebarProvider = SidebarProvider;
class SidebarItem extends vscode.TreeItem {
    constructor(label, collapsibleState, iconName, commandId) {
        super(label, collapsibleState);
        this.label = label;
        this.collapsibleState = collapsibleState;
        this.iconName = iconName;
        this.commandId = commandId;
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
//# sourceMappingURL=sidebarProvider.js.map