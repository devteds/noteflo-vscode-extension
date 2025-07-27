"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deactivate = exports.activate = void 0;
const vscode = require("vscode");
const timeTracker_1 = require("./timeTracker");
const noteCreator_1 = require("./noteCreator");
const invoiceGenerator_1 = require("./invoiceGenerator");
const sidebarProvider_1 = require("./providers/sidebarProvider");
let timeTracker;
let noteCreator;
let sidebarProvider;
function activate(context) {
    console.log('NoteFlo extension is now active!');
    // Get workspace root
    const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
    if (!workspaceRoot) {
        vscode.window.showErrorMessage('NoteFlo requires a workspace to be open');
        return;
    }
    // Initialize core modules
    timeTracker = new timeTracker_1.TimeTracker(workspaceRoot);
    noteCreator = new noteCreator_1.NoteCreator(workspaceRoot);
    const invoiceGenerator = new invoiceGenerator_1.InvoiceGenerator(workspaceRoot);
    // Create sidebar provider
    const sidebarProvider = new sidebarProvider_1.SidebarProvider(workspaceRoot);
    // Register sidebar
    vscode.window.registerTreeDataProvider('noteFloSidebar', sidebarProvider);
    // Register Invoice Generator commands
    const generateInvoiceCommand = vscode.commands.registerCommand('noteflo.generateInvoice', () => invoiceGenerator.generateInvoice());
    const viewInvoicesCommand = vscode.commands.registerCommand('noteflo.viewInvoices', () => invoiceGenerator.viewInvoices());
    const configureCommand = vscode.commands.registerCommand('noteflo.configure', () => invoiceGenerator.configureNoteFlo());
    // Register commands
    context.subscriptions.push(
    // Invoice Generator commands
    generateInvoiceCommand, viewInvoicesCommand, configureCommand, 
    // Time tracking commands
    vscode.commands.registerCommand('noteflo.startTimeTracking', async () => {
        const description = await vscode.window.showInputBox({
            prompt: 'Enter task description',
            placeHolder: 'What are you working on?'
        });
        if (description) {
            await timeTracker.startTracking(description);
            sidebarProvider.refresh();
        }
    }), vscode.commands.registerCommand('noteflo.stopTimeTracking', async () => {
        await timeTracker.stopTracking();
        sidebarProvider.refresh();
    }), vscode.commands.registerCommand('noteflo.timeStatus', async () => {
        await timeTracker.showStatus();
    }), vscode.commands.registerCommand('noteflo.enterTime', async () => {
        await timeTracker.enterTime();
        sidebarProvider.refresh();
    }), 
    // Note creation commands
    vscode.commands.registerCommand('noteflo.newMeetingNote', async () => {
        await noteCreator.createMeetingNote();
    }), vscode.commands.registerCommand('noteflo.quickTodo', async () => {
        await noteCreator.createQuickTodo();
    }), vscode.commands.registerCommand('noteflo.openDashboard', async () => {
        await noteCreator.openDashboard();
    }), vscode.commands.registerCommand('noteflo.updateNotesIndex', async () => {
        await noteCreator.updateNotesIndex();
    }));
    // Add disposables
    context.subscriptions.push(timeTracker);
    // Start time tracker status updater
    timeTracker.startStatusUpdater();
    // Show welcome message
    vscode.window.showInformationMessage('🚀 NoteFlo is ready! Check the sidebar for quick actions.');
}
exports.activate = activate;
function deactivate() {
    if (timeTracker) {
        timeTracker.dispose();
    }
}
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map