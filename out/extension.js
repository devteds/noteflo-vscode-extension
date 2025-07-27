"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deactivate = exports.activate = void 0;
const vscode = require("vscode");
const invoiceGenerator_1 = require("./invoiceGenerator");
const noteCreator_1 = require("./noteCreator");
const sidebarProvider_1 = require("./providers/sidebarProvider");
const timeTracker_1 = require("./timeTracker");
let timeTracker;
let noteCreator;
let sidebarProvider;
function activate(context) {
    console.log('NoteFlo extension is now active!');
    // Get workspace root
    const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
    // Helper function to check workspace
    const requireWorkspace = (action) => {
        if (!workspaceRoot) {
            vscode.window.showErrorMessage(`${action} requires a workspace to be open. Please open a folder first.`);
            return null;
        }
        return workspaceRoot;
    };
    // Initialize core modules (only if workspace is available)
    if (workspaceRoot) {
        timeTracker = new timeTracker_1.TimeTracker(workspaceRoot);
        noteCreator = new noteCreator_1.NoteCreator(workspaceRoot);
    }
    // Always register sidebar (it handles no-workspace case gracefully)
    const sidebarProvider = new sidebarProvider_1.SidebarProvider(workspaceRoot || '');
    vscode.window.registerTreeDataProvider('noteFloSidebar', sidebarProvider);
    // Test command to verify command registration works
    const testCommand = vscode.commands.registerCommand('noteflo.test', () => {
        vscode.window.showInformationMessage('NoteFlo test command works! Commands are registered correctly.');
    });
    // Always register commands, but check workspace in each command
    const generateInvoiceCommand = vscode.commands.registerCommand('noteflo.generateInvoice', () => {
        const workspace = requireWorkspace('Generate Invoice');
        if (workspace) {
            const invoiceGenerator = new invoiceGenerator_1.InvoiceGenerator(workspace);
            return invoiceGenerator.generateInvoice();
        }
    });
    const viewInvoicesCommand = vscode.commands.registerCommand('noteflo.viewInvoices', () => {
        const workspace = requireWorkspace('View Invoices');
        if (workspace) {
            const invoiceGenerator = new invoiceGenerator_1.InvoiceGenerator(workspace);
            return invoiceGenerator.viewInvoices();
        }
    });
    const configureCommand = vscode.commands.registerCommand('noteflo.configure', () => {
        const workspace = requireWorkspace('Configure NoteFlo');
        if (workspace) {
            const invoiceGenerator = new invoiceGenerator_1.InvoiceGenerator(workspace);
            return invoiceGenerator.configureNoteFlo();
        }
    });
    // Register commands
    context.subscriptions.push(
    // Test command
    testCommand, 
    // Invoice Generator commands
    generateInvoiceCommand, viewInvoicesCommand, configureCommand, 
    // Time tracking commands
    vscode.commands.registerCommand('noteflo.startTimeTracking', async () => {
        const workspace = requireWorkspace('Start Time Tracking');
        if (workspace) {
            const description = await vscode.window.showInputBox({
                prompt: 'Enter task description',
                placeHolder: 'What are you working on?'
            });
            if (description) {
                const tracker = new timeTracker_1.TimeTracker(workspace);
                await tracker.startTracking(description);
            }
        }
    }), vscode.commands.registerCommand('noteflo.stopTimeTracking', async () => {
        const workspace = requireWorkspace('Stop Time Tracking');
        if (workspace) {
            const tracker = new timeTracker_1.TimeTracker(workspace);
            await tracker.stopTracking();
        }
    }), vscode.commands.registerCommand('noteflo.timeStatus', async () => {
        const workspace = requireWorkspace('Time Status');
        if (workspace) {
            const tracker = new timeTracker_1.TimeTracker(workspace);
            await tracker.showStatus();
        }
    }), vscode.commands.registerCommand('noteflo.enterTime', async () => {
        const workspace = requireWorkspace('Enter Time');
        if (workspace) {
            const tracker = new timeTracker_1.TimeTracker(workspace);
            await tracker.enterTime();
        }
    }), 
    // Note creation commands
    vscode.commands.registerCommand('noteflo.newMeetingNote', async () => {
        const workspace = requireWorkspace('New Meeting Note');
        if (workspace) {
            const creator = new noteCreator_1.NoteCreator(workspace);
            await creator.createMeetingNote();
        }
    }), vscode.commands.registerCommand('noteflo.quickTodo', async () => {
        const workspace = requireWorkspace('Quick Todo');
        if (workspace) {
            const creator = new noteCreator_1.NoteCreator(workspace);
            await creator.createQuickTodo();
        }
    }), vscode.commands.registerCommand('noteflo.openDashboard', async () => {
        const workspace = requireWorkspace('Open Dashboard');
        if (workspace) {
            const creator = new noteCreator_1.NoteCreator(workspace);
            await creator.openDashboard();
        }
    }), vscode.commands.registerCommand('noteflo.updateNotesIndex', async () => {
        const workspace = requireWorkspace('Update Notes Index');
        if (workspace) {
            const creator = new noteCreator_1.NoteCreator(workspace);
            await creator.updateNotesIndex();
        }
    }));
    // Add disposables and start status updater only if workspace is available
    if (workspaceRoot && timeTracker) {
        context.subscriptions.push(timeTracker);
        timeTracker.startStatusUpdater();
    }
    // Debug: Log registered commands
    console.log('NoteFlo: All commands registered successfully');
    // Show welcome message
    vscode.window.showInformationMessage('🚀 NoteFlo is ready!');
}
exports.activate = activate;
function deactivate() {
    if (timeTracker) {
        timeTracker.dispose();
    }
}
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map