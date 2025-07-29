import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';

interface NoteFlaConfig {
  directories: {
    meeting_notes: string;
    daily_notes: string;
    general_notes: string;
    dashboard: string;
  };
  files: {
    main_dashboard: string;
  };
  settings: {
    auto_refresh_dashboard: boolean;
    default_note_template: string;
    timezone: string;
  };
  business?: {
    name: string;
    address: string;
    email: string;
    phone?: string;
    website?: string;
    logoPath?: string;
  };
  client?: {
    name: string;
    contact?: string;
    address?: string;
    email?: string;
  };
  billing?: {
    hourlyRate: number;
    currency: string;
    taxRate: number;
    paymentInstructions: string;
    invoiceNotes: string;
  };
}

export class ConfigManager {
  private static instance: ConfigManager;
  private config: NoteFlaConfig | null = null;
  private configPath: string;

  private constructor() {
    // configPath will be set in loadConfig() to ensure workspace is available
    this.configPath = '';
  }

  public static getInstance(): ConfigManager {
    if (!ConfigManager.instance) {
      ConfigManager.instance = new ConfigManager();
    }
    return ConfigManager.instance;
  }

  private getDefaultConfig(): NoteFlaConfig {
    return {
      directories: {
        meeting_notes: "docs/meeting-notes",
        daily_notes: "docs/daily-notes",
        general_notes: "docs/notes",
        dashboard: "docs/dashboard"
      },
      files: {
        main_dashboard: "docs/index.md"
      },
      settings: {
        auto_refresh_dashboard: true,
        default_note_template: "standard",
        timezone: "local"
      }
    };
  }

  public async loadConfig(): Promise<NoteFlaConfig> {
    try {
      // Ensure the workspace root exists
      const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
      if (!workspaceRoot) {
        console.warn('No workspace folder found, using defaults');
        this.config = this.getDefaultConfig();
        return this.config;
      }

      this.configPath = path.join(workspaceRoot, '.noteflo', 'config.json');

      if (fs.existsSync(this.configPath)) {
        const configData = fs.readFileSync(this.configPath, 'utf8');
        const loadedConfig = JSON.parse(configData);
        // Merge with defaults to ensure all properties exist
        this.config = this.mergeWithDefaults(loadedConfig);
        console.log('NoteFlo config loaded successfully from:', this.configPath);
      } else {
        // Create default config
        console.log('Creating default NoteFlo config at:', this.configPath);
        await this.createDefaultConfig();
        this.config = this.getDefaultConfig();
      }
    } catch (error) {
      console.error('Error loading NoteFlo config, using defaults:', error);
      vscode.window.showWarningMessage(
        `NoteFlo: Error loading configuration. Using defaults. Error: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
      this.config = this.getDefaultConfig();
    }

    return this.config;
  }

  private mergeWithDefaults(loadedConfig: any): NoteFlaConfig {
    const defaults = this.getDefaultConfig();
    return {
      directories: {
        meeting_notes: loadedConfig.directories?.meeting_notes || defaults.directories.meeting_notes,
        daily_notes: loadedConfig.directories?.daily_notes || defaults.directories.daily_notes,
        general_notes: loadedConfig.directories?.general_notes || defaults.directories.general_notes,
        dashboard: loadedConfig.directories?.dashboard || defaults.directories.dashboard
      },
      files: {
        main_dashboard: loadedConfig.files?.main_dashboard || defaults.files.main_dashboard
      },
      settings: {
        auto_refresh_dashboard: loadedConfig.settings?.auto_refresh_dashboard !== false,
        default_note_template: loadedConfig.settings?.default_note_template || defaults.settings.default_note_template,
        timezone: loadedConfig.settings?.timezone || defaults.settings.timezone
      }
    };
  }

  private async createDefaultConfig(): Promise<void> {
    try {
      if (!this.configPath) {
        console.warn('Config path not set, cannot create default config');
        return;
      }

      const configDir = path.dirname(this.configPath);
      if (!fs.existsSync(configDir)) {
        fs.mkdirSync(configDir, { recursive: true });
      }

      const defaultConfig = this.getDefaultConfig();
      fs.writeFileSync(this.configPath, JSON.stringify(defaultConfig, null, 2));

      console.log('Created default NoteFlo configuration at:', this.configPath);
      vscode.window.showInformationMessage(
        'NoteFlo: Created default configuration. You can customize paths using "NoteFlo: Edit Configuration"'
      );
    } catch (error) {
      console.error('Error creating default config:', error);
      vscode.window.showWarningMessage(
        `NoteFlo: Could not create configuration file. Using built-in defaults. Error: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  public async updateConfig(updates: Partial<NoteFlaConfig>): Promise<void> {
    try {
      if (!this.config) {
        await this.loadConfig();
      }

      this.config = { ...this.config!, ...updates };

      const configDir = path.dirname(this.configPath);
      if (!fs.existsSync(configDir)) {
        fs.mkdirSync(configDir, { recursive: true });
      }

      fs.writeFileSync(this.configPath, JSON.stringify(this.config, null, 2));

      vscode.window.showInformationMessage('NoteFlo configuration updated successfully!');
    } catch (error) {
      console.error('Error updating config:', error);
      vscode.window.showErrorMessage('Failed to update NoteFlo configuration');
    }
  }

  public getConfig(): NoteFlaConfig {
    if (!this.config) {
      throw new Error('Config not loaded. Call loadConfig() first.');
    }
    return this.config;
  }

  private async ensureConfigLoaded(): Promise<NoteFlaConfig> {
    try {
      if (!this.config) {
        await this.loadConfig();
      }
      return this.config!;
    } catch (error) {
      console.error('Failed to load config, using defaults:', error);
      // Return defaults if loading fails
      this.config = this.getDefaultConfig();
      return this.config;
    }
  }

  // Convenience methods for common config access with proper error handling
  public async getDashboardPath(): Promise<string> {
    try {
      const config = await this.ensureConfigLoaded();
      return config.files.main_dashboard || 'docs/index.md';
    } catch (error) {
      console.error('Error getting dashboard path, using default:', error);
      return 'docs/index.md';
    }
  }

  public async getMeetingNotesDir(): Promise<string> {
    try {
      const config = await this.ensureConfigLoaded();
      return config.directories.meeting_notes || 'docs/meeting-notes';
    } catch (error) {
      console.error('Error getting meeting notes dir, using default:', error);
      return 'docs/meeting-notes';
    }
  }

  public async getDailyNotesDir(): Promise<string> {
    try {
      const config = await this.ensureConfigLoaded();
      return config.directories.daily_notes || 'docs/daily-notes';
    } catch (error) {
      console.error('Error getting daily notes dir, using default:', error);
      return 'docs/daily-notes';
    }
  }

  public async getGeneralNotesDir(): Promise<string> {
    try {
      const config = await this.ensureConfigLoaded();
      return config.directories.general_notes || 'docs/notes';
    } catch (error) {
      console.error('Error getting general notes dir, using default:', error);
      return 'docs/notes';
    }
  }

  public async getDashboardDir(): Promise<string> {
    try {
      const config = await this.ensureConfigLoaded();
      return config.directories.dashboard || 'docs/dashboard';
    } catch (error) {
      console.error('Error getting dashboard dir, using default:', error);
      return 'docs/dashboard';
    }
  }

  public async getAutoRefresh(): Promise<boolean> {
    try {
      const config = await this.ensureConfigLoaded();
      return config.settings.auto_refresh_dashboard !== false; // default to true
    } catch (error) {
      console.error('Error getting auto refresh setting, using default:', error);
      return true;
    }
  }

  public async getDefaultTemplate(): Promise<string> {
    try {
      const config = await this.ensureConfigLoaded();
      return config.settings.default_note_template || 'standard';
    } catch (error) {
      console.error('Error getting default template, using default:', error);
      return 'standard';
    }
  }

  public async getTimezone(): Promise<string> {
    try {
      const config = await this.ensureConfigLoaded();
      return config.settings.timezone || 'local';
    } catch (error) {
      console.error('Error getting timezone, using default:', error);
      return 'local';
    }
  }

  // Synchronous methods that return hardcoded defaults if config isn't loaded
  // These are safer for critical path operations
  public getDashboardPathSync(): string {
    try {
      return this.config?.files?.main_dashboard || 'docs/index.md';
    } catch (error) {
      return 'docs/index.md';
    }
  }

  public getMeetingNotesDirSync(): string {
    try {
      return this.config?.directories?.meeting_notes || 'docs/meeting-notes';
    } catch (error) {
      return 'docs/meeting-notes';
    }
  }

  public getDailyNotesDirSync(): string {
    try {
      return this.config?.directories?.daily_notes || 'docs/daily-notes';
    } catch (error) {
      return 'docs/daily-notes';
    }
  }

  public getGeneralNotesDirSync(): string {
    try {
      return this.config?.directories?.general_notes || 'docs/notes';
    } catch (error) {
      return 'docs/notes';
    }
  }

  public getDashboardDirSync(): string {
    try {
      return this.config?.directories?.dashboard || 'docs/dashboard';
    } catch (error) {
      return 'docs/dashboard';
    }
  }

  // Method to show configuration UI
  public async showConfigEditor(): Promise<void> {
    try {
      const configUri = vscode.Uri.file(this.configPath);
      await vscode.window.showTextDocument(configUri);

      vscode.window.showInformationMessage(
        'Edit your NoteFlo configuration and save the file. Changes will take effect immediately.',
        'Refresh Dashboard'
      ).then(selection => {
        if (selection === 'Refresh Dashboard') {
          vscode.commands.executeCommand('noteflo.refreshDashboard');
        }
      });
    } catch (error) {
      console.error('Error opening config editor:', error);
      vscode.window.showErrorMessage('Failed to open configuration editor');
    }
  }
}
