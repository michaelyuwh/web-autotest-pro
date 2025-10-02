import browser from 'webextension-polyfill';
import { TestAction, ActionType, createTestAction } from '@web-autotest-pro/shared';

class AutoTestBackground {
  private isRecording = false;
  private currentSession: string | null = null;
  private recordedActions: TestAction[] = [];

  constructor() {
    this.init();
  }

  private async init() {
    // Set up event listeners
    browser.runtime.onInstalled.addListener(this.handleInstalled.bind(this));
    browser.tabs.onUpdated.addListener(this.handleTabUpdated.bind(this));
    browser.webNavigation.onBeforeNavigate.addListener(this.handleNavigation.bind(this));
    browser.commands.onCommand.addListener(this.handleCommand.bind(this));
    
    // Message handling
    browser.runtime.onMessage.addListener(this.handleMessage.bind(this));
    
    console.log('Web AutoTest Pro: Background script initialized');
  }

  private async handleInstalled(details: browser.Runtime.OnInstalledDetailsType) {
    if (details.reason === 'install') {
      // Show welcome notification
      await browser.notifications.create({
        type: 'basic',
        iconUrl: 'icons/icon-48.png',
        title: 'Web AutoTest Pro Installed',
        message: 'Click the extension icon to start recording your first test!'
      });
      
      // Open welcome page
      await browser.tabs.create({
        url: browser.runtime.getURL('welcome.html')
      });
    }
  }

  private async handleTabUpdated(
    tabId: number, 
    changeInfo: browser.Tabs.OnUpdatedChangeInfoType, 
    tab: browser.Tabs.Tab
  ) {
    if (this.isRecording && changeInfo.status === 'complete' && tab.url) {
      // Record navigation action
      const action = createTestAction(
        ActionType.NAVIGATE,
        tab.url,
        { 
          description: `Navigated to ${tab.url}`,
          timestamp: Date.now()
        }
      );
      
      this.recordedActions.push(action);
      await this.broadcastUpdate();
    }
  }

  private async handleNavigation(details: browser.WebNavigation.OnBeforeNavigateDetailsType) {
    if (this.isRecording && details.frameId === 0) {
      // Record redirect if it's a redirect
      if (details.url !== details.url) {
        const action = createTestAction(
          ActionType.REDIRECT,
          details.url,
          { 
            description: `Redirected to ${details.url}`,
            timestamp: Date.now()
          }
        );
        
        this.recordedActions.push(action);
        await this.broadcastUpdate();
      }
    }
  }

  private async handleCommand(command: string) {
    switch (command) {
      case 'start_recording':
        await this.toggleRecording();
        break;
      case 'toggle_pip':
        await this.togglePiP();
        break;
    }
  }

  private async handleMessage(
    message: any,
    sender: browser.Runtime.MessageSender,
    sendResponse: Function
  ) {
    try {
      switch (message.type) {
        case 'START_RECORDING':
          await this.startRecording(message.url);
          sendResponse({ success: true });
          break;
          
        case 'STOP_RECORDING':
          await this.stopRecording();
          sendResponse({ success: true, actions: this.recordedActions });
          break;
          
        case 'ADD_ACTION':
          await this.addAction(message.action);
          sendResponse({ success: true });
          break;
          
        case 'GET_RECORDING_STATE':
          sendResponse({
            isRecording: this.isRecording,
            sessionId: this.currentSession,
            actionCount: this.recordedActions.length
          });
          break;
          
        case 'INJECT_RECORDER':
          await this.injectRecorder(sender.tab?.id);
          sendResponse({ success: true });
          break;
          
        default:
          sendResponse({ error: 'Unknown message type' });
      }
        } catch (error) {
      console.error('Failed to stop recording:', error);
      throw error as Error;
    }
    
    return true; // Keep message channel open for async response
  }

  private async startRecording(url?: string) {
    this.isRecording = true;
    this.currentSession = Date.now().toString();
    this.recordedActions = [];
    
    // Get active tab if no URL provided
    if (!url) {
      const tabs = await browser.tabs.query({ active: true, currentWindow: true });
      url = tabs[0]?.url;
    }
    
    if (url) {
      // Navigate to URL if provided
      const tabs = await browser.tabs.query({ active: true, currentWindow: true });
      if (tabs[0] && tabs[0].url !== url) {
        await browser.tabs.update(tabs[0].id, { url });
      }
      
      // Inject content script to start recording
      await this.injectRecorder(tabs[0]?.id);
    }
    
    // Update icon to recording state
    await browser.action.setIcon({
      path: {
        16: 'icons/recording-16.png',
        32: 'icons/recording-32.png',
        48: 'icons/recording-48.png',
        128: 'icons/recording-128.png'
      }
    });
    
    await this.broadcastUpdate();
  }

  private async stopRecording() {
    this.isRecording = false;
    
    // Reset icon
    await browser.action.setIcon({
      path: {
        16: 'icons/icon-16.png',
        32: 'icons/icon-32.png',
        48: 'icons/icon-48.png',
        128: 'icons/icon-128.png'
      }
    });
    
    // Notify content scripts to stop recording
    const tabs = await browser.tabs.query({});
    for (const tab of tabs) {
      if (tab.id) {
        try {
          await browser.tabs.sendMessage(tab.id, {
            type: 'STOP_RECORDING'
          });
        } catch (error) {
          // Tab might not have content script, ignore
        }
      }
    }
    
    await this.broadcastUpdate();
    
    // Save recording to storage
    await this.saveRecording();
  }

  private async toggleRecording() {
    if (this.isRecording) {
      await this.stopRecording();
    } else {
      await this.startRecording();
    }
  }

  private async togglePiP() {
    // Send message to content scripts to toggle PiP
    const tabs = await browser.tabs.query({ active: true, currentWindow: true });
    if (tabs[0]?.id) {
      await browser.tabs.sendMessage(tabs[0].id, {
        type: 'TOGGLE_PIP'
      });
    }
  }

  private async addAction(action: TestAction) {
    if (this.isRecording) {
      this.recordedActions.push(action);
      await this.broadcastUpdate();
    }
  }

  private async injectRecorder(tabId?: number) {
    if (!tabId) return;
    
    try {
      // Inject content script if not already injected
      await browser.scripting.executeScript({
        target: { tabId },
        files: ['content.js']
      });
      
      // Send start recording message
      await browser.tabs.sendMessage(tabId, {
        type: 'START_RECORDING',
        sessionId: this.currentSession
      });
    } catch (error) {
      console.error('Web AutoTest Pro: Failed to inject recorder:', error);
    }
  }

  private async broadcastUpdate() {
    // Update popup if open
    try {
      await browser.runtime.sendMessage({
        type: 'RECORDING_UPDATE',
        data: {
          isRecording: this.isRecording,
          sessionId: this.currentSession,
          actionCount: this.recordedActions.length,
          actions: this.recordedActions.slice(-5) // Last 5 actions
        }
      });
    } catch (error) {
      // Popup might not be open, ignore
    }
  }

  private async saveRecording() {
    if (this.recordedActions.length === 0) return;
    
    const recording = {
      id: this.currentSession,
      timestamp: Date.now(),
      actions: this.recordedActions,
      metadata: {
        userAgent: navigator.userAgent,
        url: this.recordedActions[0]?.selector || 'unknown'
      }
    };
    
    // Save to storage
    const stored = await browser.storage.local.get('recordings');
    const recordings = stored.recordings || [];
    recordings.push(recording);
    
    await browser.storage.local.set({ recordings });
    
    console.log('Web AutoTest Pro: Recording saved:', recording.id);
  }
}

// Initialize background script
new AutoTestBackground();