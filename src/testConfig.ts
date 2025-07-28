import * as vscode from 'vscode';
import { ConfigManager } from './configManager';

export async function testConfigManager() {
  try {
    console.log('🧪 Testing ConfigManager...');

    const configManager = ConfigManager.getInstance();

    // Test async methods with proper error handling
    const dashboardPath = await configManager.getDashboardPath();
    const meetingNotesDir = await configManager.getMeetingNotesDir();
    const dailyNotesDir = await configManager.getDailyNotesDir();
    const generalNotesDir = await configManager.getGeneralNotesDir();
    const dashboardDir = await configManager.getDashboardDir();

    console.log('✅ Config loaded successfully:');
    console.log('  Dashboard Path:', dashboardPath);
    console.log('  Meeting Notes Dir:', meetingNotesDir);
    console.log('  Daily Notes Dir:', dailyNotesDir);
    console.log('  General Notes Dir:', generalNotesDir);
    console.log('  Dashboard Dir:', dashboardDir);

    // Test sync fallback methods
    const syncDashboard = configManager.getDashboardPathSync();
    const syncMeeting = configManager.getMeetingNotesDirSync();

    console.log('✅ Sync methods work:');
    console.log('  Sync Dashboard:', syncDashboard);
    console.log('  Sync Meeting:', syncMeeting);

    vscode.window.showInformationMessage('✅ ConfigManager test passed!');

  } catch (error) {
    console.error('❌ ConfigManager test failed:', error);
    vscode.window.showErrorMessage(`❌ ConfigManager test failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
