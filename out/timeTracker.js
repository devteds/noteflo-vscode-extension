"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TimeTracker = void 0;
const vscode = require("vscode");
const fs = require("fs");
const path = require("path");
const invoiceGenerator_1 = require("./invoiceGenerator");
class TimeTracker {
    constructor(workspaceRoot) {
        this.workspaceRoot = workspaceRoot;
        this.timeTrackingDir = path.join(workspaceRoot, 'docs', 'time-tracking');
        this.ensureDirectories();
        this.statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
        this.statusBarItem.command = 'noteflo.timeStatus';
        this.statusBarItem.show();
        this.updateStatusBar();
        this.startStatusUpdater();
    }
    ensureDirectories() {
        if (!fs.existsSync(this.timeTrackingDir)) {
            fs.mkdirSync(this.timeTrackingDir, { recursive: true });
        }
    }
    getActiveSessionPath() {
        return path.join(this.timeTrackingDir, 'active_session.json');
    }
    getMonthlyFilePath(date) {
        const now = date || new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const filename = `time_entries_${year}-${month}.json`;
        return path.join(this.timeTrackingDir, filename);
    }
    async startTracking(description) {
        if (this.isTrackingActive()) {
            const stop = await vscode.window.showWarningMessage('Time tracking is already active. Stop current session?', 'Stop & Start New', 'Cancel');
            if (stop === 'Stop & Start New') {
                await this.stopTracking();
            }
            else {
                return;
            }
        }
        const timezone = (0, invoiceGenerator_1.getConfiguredTimezone)(this.workspaceRoot);
        const session = {
            start_time: (0, invoiceGenerator_1.formatDateInTimezone)(new Date(), timezone, 'iso'),
            description: description,
        };
        fs.writeFileSync(this.getActiveSessionPath(), JSON.stringify(session, null, 2));
        this.updateStatusBar();
        vscode.window.showInformationMessage(`⏱️ Started tracking: ${description}`);
    }
    async stopTracking() {
        const sessionPath = this.getActiveSessionPath();
        if (!fs.existsSync(sessionPath)) {
            vscode.window.showWarningMessage('No active time tracking session');
            return null;
        }
        const session = JSON.parse(fs.readFileSync(sessionPath, 'utf8'));
        const timezone = (0, invoiceGenerator_1.getConfiguredTimezone)(this.workspaceRoot);
        const endTime = new Date();
        const startTime = new Date(session.start_time);
        const durationMinutes = Math.round((endTime.getTime() - startTime.getTime()) / (1000 * 60));
        const entry = {
            start_time: session.start_time,
            end_time: (0, invoiceGenerator_1.formatDateInTimezone)(endTime, timezone, 'iso'),
            description: session.description,
            duration_minutes: durationMinutes,
        };
        // Save to monthly file
        this.saveTimeEntry(entry);
        // Remove active session
        fs.unlinkSync(sessionPath);
        this.updateStatusBar();
        const hours = Math.floor(durationMinutes / 60);
        const minutes = durationMinutes % 60;
        vscode.window.showInformationMessage(`✅ Stopped tracking: ${hours}h ${minutes}m - ${entry.description}`);
        return entry;
    }
    saveTimeEntry(entry, date) {
        const filePath = this.getMonthlyFilePath(date);
        let entries = [];
        if (fs.existsSync(filePath)) {
            entries = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        }
        entries.push(entry);
        fs.writeFileSync(filePath, JSON.stringify(entries, null, 2));
    }
    isTrackingActive() {
        return fs.existsSync(this.getActiveSessionPath());
    }
    getCurrentSession() {
        const sessionPath = this.getActiveSessionPath();
        if (!fs.existsSync(sessionPath)) {
            return null;
        }
        return JSON.parse(fs.readFileSync(sessionPath, 'utf8'));
    }
    getRunningDuration() {
        const session = this.getCurrentSession();
        if (!session) {
            return '';
        }
        const start = new Date(session.start_time);
        const now = new Date();
        const diffMs = now.getTime() - start.getTime();
        const hours = Math.floor(diffMs / (1000 * 60 * 60));
        const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
        return `${hours}:${String(minutes).padStart(2, '0')}`;
    }
    updateStatusBar() {
        if (this.isTrackingActive()) {
            const session = this.getCurrentSession();
            const duration = this.getRunningDuration();
            this.statusBarItem.text = `⏱️ ${duration} - ${session?.description.substring(0, 20)}...`;
            this.statusBarItem.backgroundColor = new vscode.ThemeColor('statusBarItem.warningBackground');
        }
        else {
            this.statusBarItem.text = '⏱️ Start Tracking';
            this.statusBarItem.backgroundColor = undefined;
        }
    }
    async showStatus() {
        if (this.isTrackingActive()) {
            const session = this.getCurrentSession();
            const duration = this.getRunningDuration();
            vscode.window.showInformationMessage(`⏱️ Active: ${session.description} (${duration})`);
        }
        else {
            vscode.window.showInformationMessage('⏱️ No active time tracking session');
        }
    }
    async enterTime() {
        // Get task description
        const description = await vscode.window.showInputBox({
            prompt: 'Task description',
            placeHolder: 'What did you work on? (e.g., Client meeting, Travel, Offline analysis)'
        });
        if (!description)
            return;
        // Get hours spent
        const hoursInput = await vscode.window.showInputBox({
            prompt: 'Hours spent (decimal format)',
            placeHolder: 'e.g., 2.5 for 2 hours 30 minutes',
            validateInput: (value) => {
                const num = parseFloat(value);
                if (isNaN(num) || num <= 0 || num > 24) {
                    return 'Please enter a valid number between 0 and 24';
                }
                return null;
            }
        });
        if (!hoursInput)
            return;
        const hours = parseFloat(hoursInput);
        const durationMinutes = Math.round(hours * 60);
        // Get date (default to today)
        const timezone = (0, invoiceGenerator_1.getConfiguredTimezone)(this.workspaceRoot);
        const dateInput = await vscode.window.showInputBox({
            prompt: 'Date (YYYY-MM-DD format)',
            value: (0, invoiceGenerator_1.formatDateInTimezone)(new Date(), timezone, 'date-only'),
            validateInput: (value) => {
                const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
                if (!dateRegex.test(value)) {
                    return 'Please enter date in YYYY-MM-DD format';
                }
                const date = new Date(value);
                if (isNaN(date.getTime())) {
                    return 'Please enter a valid date';
                }
                return null;
            }
        });
        if (!dateInput)
            return;
        // Create time entry
        const entryDate = new Date(dateInput);
        const startTime = new Date(entryDate);
        startTime.setHours(9, 0, 0, 0); // Default to 9 AM start time
        const endTime = new Date(startTime);
        endTime.setMinutes(endTime.getMinutes() + durationMinutes);
        const entry = {
            start_time: (0, invoiceGenerator_1.formatDateInTimezone)(startTime, timezone, 'iso'),
            end_time: (0, invoiceGenerator_1.formatDateInTimezone)(endTime, timezone, 'iso'),
            description: description,
            duration_minutes: durationMinutes,
        };
        // Save to monthly file
        this.saveTimeEntry(entry, entryDate);
        const hoursDisplay = Math.floor(durationMinutes / 60);
        const minutesDisplay = durationMinutes % 60;
        vscode.window.showInformationMessage(`✅ Added ${hoursDisplay}h ${minutesDisplay}m: ${description} (${dateInput})`);
    }
    startStatusUpdater() {
        this.statusUpdateInterval = setInterval(() => {
            if (this.isTrackingActive()) {
                this.updateStatusBar();
            }
        }, 5000); // Update every 5 seconds for live timer
    }
    dispose() {
        if (this.statusUpdateInterval) {
            clearInterval(this.statusUpdateInterval);
        }
        this.statusBarItem.dispose();
    }
}
exports.TimeTracker = TimeTracker;
//# sourceMappingURL=timeTracker.js.map