import browser from 'webextension-polyfill';
import { TestAction, ActionType, createTestAction, optimizeSelector } from '@web-autotest-pro/shared';

class ContentRecorder {
  private isRecording = false;
  private sessionId: string | null = null;
  private pipWindow: Window | null = null;
  private observers: MutationObserver[] = [];
  private lastMousePosition = { x: 0, y: 0 };
  private recordedActions: TestAction[] = [];

  constructor() {
    this.init();
  }

  private init() {
    // Listen for messages from background script
    browser.runtime.onMessage.addListener(this.handleMessage.bind(this));
    
    // Set up mouse tracking
    document.addEventListener('mousemove', this.handleMouseMove.bind(this), { passive: true });
    
    console.log('Web AutoTest Pro: Content script initialized');
  }

  private async handleMessage(message: any, sender: any, sendResponse: Function) {
    try {
      switch (message.type) {
        case 'START_RECORDING':
          await this.startRecording(message.sessionId);
          sendResponse({ success: true });
          break;
          
        case 'STOP_RECORDING':
          await this.stopRecording();
          sendResponse({ success: true });
          break;
          
        case 'TOGGLE_PIP':
          await this.togglePiP();
          sendResponse({ success: true });
          break;
          
        default:
          sendResponse({ error: 'Unknown message type' });
      }
    } catch (error) {
      console.error('Web AutoTest Pro: Error in content script:', error);
      sendResponse({ error: (error as Error).message });
    }
    
    return true;
  }

  private async startRecording(sessionId: string) {
    if (this.isRecording) return;
    
    this.isRecording = true;
    this.sessionId = sessionId;
    this.recordedActions = [];
    
    // Set up event listeners
    this.setupEventListeners();
    
    // Set up DOM observers
    this.setupObservers();
    
    // Show recording indicator
    this.showRecordingIndicator();
    
    // Open PiP window if supported
    if (document.pictureInPictureEnabled) {
      await this.openPiPWindow();
    }
    
    console.log('Web AutoTest Pro: Recording started');
  }

  private async stopRecording() {
    if (!this.isRecording) return;
    
    this.isRecording = false;
    
    // Remove event listeners
    this.removeEventListeners();
    
    // Disconnect observers
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
    
    // Hide recording indicator
    this.hideRecordingIndicator();
    
    // Close PiP window
    if (this.pipWindow) {
      this.pipWindow.close();
      this.pipWindow = null;
    }
    
    console.log('Web AutoTest Pro: Recording stopped');
  }

  private setupEventListeners() {
    // Click events
    document.addEventListener('click', this.handleClick.bind(this), { 
      capture: true, 
      passive: false 
    });
    
    // Input events
    document.addEventListener('input', this.handleInput.bind(this), { 
      capture: true, 
      passive: true 
    });
    
    // Keyboard events
    document.addEventListener('keydown', this.handleKeyDown.bind(this), { 
      capture: true, 
      passive: true 
    });
    
    // Scroll events
    document.addEventListener('scroll', this.handleScroll.bind(this), { 
      capture: true, 
      passive: true 
    });
    
    // Mouse events
    document.addEventListener('mouseenter', this.handleMouseEnter.bind(this), { 
      capture: true, 
      passive: true 
    });
    
    // Context menu events
    document.addEventListener('contextmenu', this.handleContextMenu.bind(this), { 
      capture: true, 
      passive: false 
    });
    
    // Form submission
    document.addEventListener('submit', this.handleSubmit.bind(this), { 
      capture: true, 
      passive: false 
    });
  }

  private removeEventListeners() {
    document.removeEventListener('click', this.handleClick.bind(this), { capture: true });
    document.removeEventListener('input', this.handleInput.bind(this), { capture: true });
    document.removeEventListener('keydown', this.handleKeyDown.bind(this), { capture: true });
    document.removeEventListener('scroll', this.handleScroll.bind(this), { capture: true });
    document.removeEventListener('mouseenter', this.handleMouseEnter.bind(this), { capture: true });
    document.removeEventListener('contextmenu', this.handleContextMenu.bind(this), { capture: true });
    document.removeEventListener('submit', this.handleSubmit.bind(this), { capture: true });
  }

  private setupObservers() {
    // DOM mutation observer
    const domObserver = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList') {
          // Track dynamic content changes
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              const element = node as Element;
              if (element.tagName === 'DIALOG' || element.classList.contains('modal')) {
                this.recordAction(ActionType.POPUP, element, 'Modal appeared');
              }
            }
          });
        }
      });
    });
    
    domObserver.observe(document.body, {
      childList: true,
      subtree: true
    });
    
    this.observers.push(domObserver);
  }

  private handleMouseMove(event: MouseEvent) {
    this.lastMousePosition = { x: event.clientX, y: event.clientY };
    
    // Update PiP window with mouse position
    if (this.pipWindow) {
      this.updatePiPWindow();
    }
  }

  private handleClick(event: MouseEvent) {
    if (!this.isRecording) return;
    
    const target = event.target as Element;
    if (!target || this.isRecordingElement(target)) return;
    
    const selector = optimizeSelector(target);
    const action = createTestAction(
      ActionType.CLICK,
      selector,
      {
        mousePosition: { x: event.clientX, y: event.clientY },
        description: `Clicked ${target.tagName.toLowerCase()}${target.id ? `#${target.id}` : ''}`,
        timestamp: Date.now()
      }
    );
    
    this.recordAction(ActionType.CLICK, target, action.description, action);
  }

  private handleInput(event: Event) {
    if (!this.isRecording) return;
    
    const target = event.target as HTMLInputElement;
    if (!target || this.isRecordingElement(target)) return;
    
    const selector = optimizeSelector(target);
    const action = createTestAction(
      ActionType.INPUT,
      selector,
      {
        value: target.type === 'password' ? '****' : target.value,
        description: `Entered text in ${target.tagName.toLowerCase()}${target.id ? `#${target.id}` : ''}`,
        timestamp: Date.now()
      }
    );
    
    this.recordAction(ActionType.INPUT, target, action.description, action);
  }

  private handleKeyDown(event: KeyboardEvent) {
    if (!this.isRecording) return;
    
    // Record special key combinations
    if (event.key === 'Enter' && (event.target as Element).tagName === 'INPUT') {
      const target = event.target as Element;
      const selector = optimizeSelector(target);
      const action = createTestAction(
        ActionType.CLICK,
        selector,
        {
          description: `Pressed Enter in ${target.tagName.toLowerCase()}`,
          timestamp: Date.now()
        }
      );
      
      this.recordAction(ActionType.CLICK, target, action.description, action);
    }
  }

  private handleScroll(event: Event) {
    if (!this.isRecording) return;
    
    // Throttle scroll events
    clearTimeout((this as any).scrollTimeout);
    (this as any).scrollTimeout = setTimeout(() => {
      const action = createTestAction(
        ActionType.SCROLL,
        'window',
        {
          value: `${window.scrollX},${window.scrollY}`,
          description: `Scrolled to position (${window.scrollX}, ${window.scrollY})`,
          timestamp: Date.now()
        }
      );
      
      this.recordAction(ActionType.SCROLL, document.body, action.description, action);
    }, 500);
  }

  private handleMouseEnter(event: MouseEvent) {
    if (!this.isRecording) return;
    
    const target = event.target as Element;
    if (!target || this.isRecordingElement(target)) return;
    
    // Only record hover for interactive elements
    if (this.isInteractiveElement(target)) {
      const selector = optimizeSelector(target);
      const action = createTestAction(
        ActionType.HOVER,
        selector,
        {
          mousePosition: { x: event.clientX, y: event.clientY },
          description: `Hovered over ${target.tagName.toLowerCase()}`,
          timestamp: Date.now()
        }
      );
      
      this.recordAction(ActionType.HOVER, target, action.description, action);
    }
  }

  private handleContextMenu(event: MouseEvent) {
    if (!this.isRecording) return;
    
    const target = event.target as Element;
    if (!target || this.isRecordingElement(target)) return;
    
    const selector = optimizeSelector(target);
    const action = createTestAction(
      ActionType.CLICK,
      selector,
      {
        value: 'right-click',
        mousePosition: { x: event.clientX, y: event.clientY },
        description: `Right-clicked ${target.tagName.toLowerCase()}`,
        timestamp: Date.now()
      }
    );
    
    this.recordAction(ActionType.CLICK, target, action.description, action);
  }

  private handleSubmit(event: Event) {
    if (!this.isRecording) return;
    
    const target = event.target as HTMLFormElement;
    if (!target || this.isRecordingElement(target)) return;
    
    const selector = optimizeSelector(target);
    const action = createTestAction(
      ActionType.CLICK,
      selector,
      {
        description: 'Submitted form',
        timestamp: Date.now()
      }
    );
    
    this.recordAction(ActionType.CLICK, target, action.description, action);
  }

  private async recordAction(type: ActionType, element: Element, description: string, action?: TestAction) {
    if (!this.isRecording) return;
    
    const finalAction = action || createTestAction(
      type,
      optimizeSelector(element),
      { description, timestamp: Date.now() }
    );
    
    this.recordedActions.push(finalAction);
    
    // Send to background script
    await browser.runtime.sendMessage({
      type: 'ADD_ACTION',
      action: finalAction
    });
    
    // Update PiP window
    if (this.pipWindow) {
      this.updatePiPWindow();
    }
    
    // Highlight element briefly
    this.highlightElement(element);
  }

  private isRecordingElement(element: Element): boolean {
    return element.closest('.autotest-recording-ui') !== null;
  }

  private isInteractiveElement(element: Element): boolean {
    const interactiveTags = ['A', 'BUTTON', 'INPUT', 'SELECT', 'TEXTAREA'];
    return interactiveTags.includes(element.tagName) || 
           element.hasAttribute('onclick') || 
           element.hasAttribute('role');
  }

  private highlightElement(element: Element) {
    const originalStyle = (element as HTMLElement).style.outline;
    (element as HTMLElement).style.outline = '2px solid #007BFF';
    
    setTimeout(() => {
      (element as HTMLElement).style.outline = originalStyle;
    }, 1000);
  }

  private showRecordingIndicator() {
    const indicator = document.createElement('div');
    indicator.className = 'autotest-recording-ui';
    indicator.id = 'autotest-recording-indicator';
    indicator.innerHTML = `
      <div style="
        position: fixed;
        top: 20px;
        right: 20px;
        background: rgba(220, 53, 69, 0.9);
        color: white;
        padding: 12px 16px;
        border-radius: 8px;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        font-size: 14px;
        font-weight: 500;
        z-index: 10000;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        display: flex;
        align-items: center;
        gap: 8px;
      ">
        <div style="
          width: 8px;
          height: 8px;
          background: #fff;
          border-radius: 50%;
          animation: pulse 2s infinite;
        "></div>
        Recording...
      </div>
      <style>
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      </style>
    `;
    
    document.body.appendChild(indicator);
  }

  private hideRecordingIndicator() {
    const indicator = document.getElementById('autotest-recording-indicator');
    if (indicator) {
      indicator.remove();
    }
  }

  private async openPiPWindow() {
    if (!document.pictureInPictureEnabled || this.pipWindow) return;
    
    try {
      // Create a canvas for PiP content
      const canvas = document.createElement('canvas');
      canvas.width = 320;
      canvas.height = 240;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      
      // Create PiP content
      this.drawPiPContent(ctx);
      
      // Request PiP
      const video = document.createElement('video');
      video.srcObject = canvas.captureStream();
      video.play();
      
      this.pipWindow = await (video as any).requestPictureInPicture();
      
      // Update PiP content periodically
      setInterval(() => {
        if (this.pipWindow && this.isRecording) {
          this.drawPiPContent(ctx);
        }
      }, 1000);
      
    } catch (error) {
      console.warn('Web AutoTest Pro: Failed to open PiP window:', error);
    }
  }

  private drawPiPContent(ctx: CanvasRenderingContext2D) {
    // Clear canvas
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, 320, 240);
    
    // Draw title
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 16px sans-serif';
    ctx.fillText('Web AutoTest Pro', 10, 30);
    
    // Draw recording status
    ctx.fillStyle = '#dc3545';
    ctx.font = '14px sans-serif';
    ctx.fillText('● Recording', 10, 55);
    
    // Draw action count
    ctx.fillStyle = '#fff';
    ctx.font = '12px sans-serif';
    ctx.fillText(`Actions: ${this.recordedActions.length}`, 10, 80);
    
    // Draw mouse position
    ctx.fillText(`Mouse: (${this.lastMousePosition.x}, ${this.lastMousePosition.y})`, 10, 100);
    
    // Draw recent actions
    ctx.fillText('Recent Actions:', 10, 130);
    const recentActions = this.recordedActions.slice(-3);
    recentActions.forEach((action, index) => {
      ctx.fillStyle = '#ccc';
      ctx.font = '10px sans-serif';
      const text = `${action.type}: ${action.description.substring(0, 25)}...`;
      ctx.fillText(text, 10, 150 + (index * 15));
    });
  }

  private updatePiPWindow() {
    // PiP content is updated via the drawing interval
  }

  private async togglePiP() {
    if (this.pipWindow) {
      this.pipWindow.close();
      this.pipWindow = null;
    } else {
      await this.openPiPWindow();
    }
  }
}

// Initialize content recorder
new ContentRecorder();