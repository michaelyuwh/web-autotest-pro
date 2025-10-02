import browser from 'webextension-polyfill';

class PopupController {
  private isRecording = false;
  private actionCount = 0;
  private startTime = 0;
  private updateInterval?: number;

  constructor() {
    this.init();
  }

  private async init() {
    // Get DOM elements
    const startBtn = document.getElementById('startBtn') as HTMLButtonElement;
    const stopBtn = document.getElementById('stopBtn') as HTMLButtonElement;
    const pipBtn = document.getElementById('pipBtn') as HTMLButtonElement;
    const openWebAppBtn = document.getElementById('openWebApp') as HTMLButtonElement;
    const settingsBtn = document.getElementById('settingsBtn') as HTMLButtonElement;
    const urlInput = document.getElementById('urlInput') as HTMLInputElement;

    // Set up event listeners
    startBtn?.addEventListener('click', () => this.startRecording());
    stopBtn?.addEventListener('click', () => this.stopRecording());
    pipBtn?.addEventListener('click', () => this.togglePiP());
    openWebAppBtn?.addEventListener('click', () => this.openWebApp());
    settingsBtn?.addEventListener('click', () => this.openSettings());

    // Get current recording state
    await this.updateState();

    // Listen for recording updates
    browser.runtime.onMessage.addListener((message: any) => {
      if (message.type === 'RECORDING_UPDATE') {
        this.handleRecordingUpdate(message.data);
      }
    });

    // Auto-fill URL from active tab
    const tabs = await browser.tabs.query({ active: true, currentWindow: true });
    if (tabs[0]?.url && urlInput) {
      urlInput.value = tabs[0].url;
    }
  }

  private async updateState() {
    try {
      const response = await browser.runtime.sendMessage({
        type: 'GET_RECORDING_STATE'
      });

      this.isRecording = response.isRecording;
      this.actionCount = response.actionCount || 0;

      this.updateUI();
    } catch (error) {
      console.error('Failed to get recording state:', error);
    }
  }

  private async startRecording() {
    try {
      const urlInput = document.getElementById('urlInput') as HTMLInputElement;
      const url = urlInput?.value.trim();

      await browser.runtime.sendMessage({
        type: 'START_RECORDING',
        url: url || undefined
      });

      this.isRecording = true;
      this.actionCount = 0;
      this.startTime = Date.now();
      this.updateUI();
      this.startTimer();
    } catch (error) {
      console.error('Failed to start recording:', error);
      this.showError('Failed to start recording');
    }
  }

  private async stopRecording() {
    try {
      const response = await browser.runtime.sendMessage({
        type: 'STOP_RECORDING'
      });

      this.isRecording = false;
      this.updateUI();
      this.stopTimer();

      // Show success message
      this.showSuccess(`Recording saved with ${response.actions?.length || 0} actions`);
    } catch (error) {
      console.error('Failed to stop recording:', error);
      this.showError('Failed to stop recording');
    }
  }

  private async togglePiP() {
    try {
      await browser.runtime.sendMessage({
        type: 'TOGGLE_PIP'
      });
    } catch (error) {
      console.error('Failed to toggle PiP:', error);
    }
  }

  private async openWebApp() {
    try {
      await browser.tabs.create({
        url: 'http://localhost:3000'
      });
      window.close();
    } catch (error) {
      console.error('Failed to open web app:', error);
    }
  }

  private async openSettings() {
    try {
      await browser.runtime.openOptionsPage();
      window.close();
    } catch (error) {
      console.error('Failed to open settings:', error);
    }
  }

  private handleRecordingUpdate(data: any) {
    this.isRecording = data.isRecording;
    this.actionCount = data.actionCount || 0;
    this.updateUI();
  }

  private updateUI() {
    const startBtn = document.getElementById('startBtn');
    const stopBtn = document.getElementById('stopBtn');
    const status = document.getElementById('status');
    const statusIndicator = document.getElementById('statusIndicator');
    const stats = document.getElementById('stats');
    const actionCountEl = document.getElementById('actionCount');
    const urlInput = document.getElementById('urlInput') as HTMLInputElement;

    if (this.isRecording) {
      // Recording state
      startBtn!.style.display = 'none';
      stopBtn!.style.display = 'flex';
      status!.classList.add('status-recording');
      statusIndicator!.innerHTML = `
        <div class="pulse"></div>
        <span>Recording in progress...</span>
      `;
      stats!.style.display = 'flex';
      urlInput!.disabled = true;
    } else {
      // Idle state
      startBtn!.style.display = 'flex';
      stopBtn!.style.display = 'none';
      status!.classList.remove('status-recording');
      statusIndicator!.innerHTML = '<span>Ready to record</span>';
      stats!.style.display = 'none';
      urlInput!.disabled = false;
    }

    // Update action count
    if (actionCountEl) {
      actionCountEl.textContent = `${this.actionCount} actions`;
    }
  }

  private startTimer() {
    this.updateInterval = window.setInterval(() => {
      const duration = Math.floor((Date.now() - this.startTime) / 1000);
      const minutes = Math.floor(duration / 60);
      const seconds = duration % 60;
      
      const durationEl = document.getElementById('duration');
      if (durationEl) {
        durationEl.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
      }
    }, 1000);
  }

  private stopTimer() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = undefined;
    }
  }

  private showSuccess(message: string) {
    // You could implement a toast notification here
    console.log('Success:', message);
  }

  private showError(message: string) {
    // You could implement a toast notification here
    console.error('Error:', message);
  }
}

// Initialize popup when DOM is loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => new PopupController());
} else {
  new PopupController();
}