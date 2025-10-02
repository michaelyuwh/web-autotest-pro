import browser from 'webextension-polyfill';

interface Settings {
  // Recording settings
  autoStart: boolean;
  showIndicator: boolean;
  recordingTimeout: number;
  
  // AI settings
  enableAI: boolean;
  aiModel: string;
  autoAssertions: boolean;
  
  // Browser settings
  waitTimeout: number;
  captureScreenshots: boolean;
  highlightElements: boolean;
  
  // Data settings
  webAppUrl: string;
  exportFormat: string;
  dataRetention: number;
}

const DEFAULT_SETTINGS: Settings = {
  autoStart: false,
  showIndicator: true,
  recordingTimeout: 30,
  enableAI: true,
  aiModel: 'phi-3-mini',
  autoAssertions: true,
  waitTimeout: 10,
  captureScreenshots: true,
  highlightElements: true,
  webAppUrl: 'http://localhost:3000',
  exportFormat: 'json',
  dataRetention: 30
};

class OptionsController {
  private settings: Settings = { ...DEFAULT_SETTINGS };

  constructor() {
    this.init();
  }

  private async init() {
    // Load current settings
    await this.loadSettings();
    
    // Set up UI
    this.setupUI();
    
    // Set up event listeners
    this.setupEventListeners();
  }

  private async loadSettings() {
    try {
      const stored = await browser.storage.sync.get('settings');
      if (stored.settings) {
        this.settings = { ...DEFAULT_SETTINGS, ...stored.settings };
      }
      this.updateUI();
    } catch (error) {
      console.error('Failed to load settings:', error);
      this.showToast('Failed to load settings', 'error');
    }
  }

  private async saveSettings() {
    try {
      await browser.storage.sync.set({ settings: this.settings });
      this.showToast('Settings saved successfully');
      
      // Notify other parts of the extension
      browser.runtime.sendMessage({
        type: 'SETTINGS_UPDATED',
        settings: this.settings
      });
    } catch (error) {
      console.error('Failed to save settings:', error);
      this.showToast('Failed to save settings', 'error');
    }
  }

  private setupUI() {
    // Get all form elements
    const elements = {
      autoStart: document.getElementById('autoStart') as HTMLInputElement,
      showIndicator: document.getElementById('showIndicator') as HTMLInputElement,
      recordingTimeout: document.getElementById('recordingTimeout') as HTMLInputElement,
      enableAI: document.getElementById('enableAI') as HTMLInputElement,
      aiModel: document.getElementById('aiModel') as HTMLSelectElement,
      autoAssertions: document.getElementById('autoAssertions') as HTMLInputElement,
      waitTimeout: document.getElementById('waitTimeout') as HTMLInputElement,
      captureScreenshots: document.getElementById('captureScreenshots') as HTMLInputElement,
      highlightElements: document.getElementById('highlightElements') as HTMLInputElement,
      webAppUrl: document.getElementById('webAppUrl') as HTMLInputElement,
      exportFormat: document.getElementById('exportFormat') as HTMLSelectElement,
      dataRetention: document.getElementById('dataRetention') as HTMLInputElement
    };

    // Add change listeners to sync settings
    Object.entries(elements).forEach(([key, element]) => {
      if (element) {
        element.addEventListener('change', () => {
          this.updateSettingFromUI(key as keyof Settings, element);
        });
      }
    });
  }

  private setupEventListeners() {
    // Save button
    const saveBtn = document.getElementById('saveBtn');
    saveBtn?.addEventListener('click', () => this.saveSettings());

    // Reset button
    const resetBtn = document.getElementById('resetBtn');
    resetBtn?.addEventListener('click', () => this.resetSettings());

    // Clear data button
    const clearDataBtn = document.getElementById('clearDataBtn');
    clearDataBtn?.addEventListener('click', () => this.clearAllData());
  }

  private updateSettingFromUI(key: keyof Settings, element: HTMLInputElement | HTMLSelectElement) {
    if (element.type === 'checkbox') {
      (this.settings as any)[key] = (element as HTMLInputElement).checked;
    } else if (element.type === 'number') {
      (this.settings as any)[key] = parseInt((element as HTMLInputElement).value, 10);
    } else {
      (this.settings as any)[key] = element.value;
    }
  }

  private updateUI() {
    // Update all form elements with current settings
    Object.entries(this.settings).forEach(([key, value]) => {
      const element = document.getElementById(key) as HTMLInputElement | HTMLSelectElement;
      if (element) {
        if (element.type === 'checkbox') {
          (element as HTMLInputElement).checked = value as boolean;
        } else {
          element.value = String(value);
        }
      }
    });
  }

  private async resetSettings() {
    if (confirm('Are you sure you want to reset all settings to defaults?')) {
      this.settings = { ...DEFAULT_SETTINGS };
      this.updateUI();
      await this.saveSettings();
      this.showToast('Settings reset to defaults');
    }
  }

  private async clearAllData() {
    if (confirm('Are you sure you want to clear all stored data? This cannot be undone.')) {
      try {
        await browser.storage.local.clear();
        await browser.storage.sync.clear();
        this.showToast('All data cleared successfully');
        
        // Reload settings
        this.settings = { ...DEFAULT_SETTINGS };
        this.updateUI();
        await this.saveSettings();
      } catch (error) {
        console.error('Failed to clear data:', error);
        this.showToast('Failed to clear data', 'error');
      }
    }
  }

  private showToast(message: string, type: 'success' | 'error' = 'success') {
    const toast = document.getElementById('toast');
    if (toast) {
      toast.textContent = message;
      toast.className = `toast ${type} show`;
      
      setTimeout(() => {
        toast.classList.remove('show');
      }, 3000);
    }
  }
}

// Initialize options when DOM is loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => new OptionsController());
} else {
  new OptionsController();
}