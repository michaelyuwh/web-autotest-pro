// Enhanced Video Recording Service with Action Overlays and GIF Generation
// Supports MediaRecorder, html2canvas fallback, and action visualization

import html2canvas from 'html2canvas';
import { TestAction, TestExecution } from './types';

export interface VideoRecordingOptions {
  format: 'webm' | 'mp4' | 'gif';
  quality: 'low' | 'medium' | 'high';
  fps: number;
  includeActionOverlays: boolean;
  includeCursor: boolean;
  maxDuration: number; // in seconds
  compressionLevel: number; // 0-1
  fallbackToScreenshots: boolean;
}

export interface ActionOverlay {
  id: string;
  action: TestAction;
  timestamp: number;
  position: { x: number; y: number };
  duration: number;
  style: OverlayStyle;
}

export interface OverlayStyle {
  color: string;
  backgroundColor: string;
  borderColor: string;
  fontSize: number;
  padding: number;
  borderRadius: number;
  opacity: number;
}

export interface VideoRecordingResult {
  success: boolean;
  videoBlob?: Blob;
  gifBlob?: Blob;
  screenshots?: string[];
  duration: number;
  fileSize: number;
  error?: string;
  metadata: {
    format: string;
    fps: number;
    resolution: { width: number; height: number };
    actionsRecorded: number;
  };
}

export interface RecordingSession {
  id: string;
  startTime: number;
  endTime?: number;
  mediaRecorder?: MediaRecorder;
  stream?: MediaStream;
  chunks: Blob[];
  actions: ActionOverlay[];
  screenshots: string[];
  canvas?: HTMLCanvasElement;
  context?: CanvasRenderingContext2D;
  isRecording: boolean;
  options: VideoRecordingOptions;
}

export class EnhancedVideoRecorder {
  private sessions = new Map<string, RecordingSession>();
  private animationFrameId?: number;
  private overlayContainer?: HTMLElement;

  /**
   * Start video recording with enhanced features
   */
  async startRecording(
    sessionId: string,
    options: Partial<VideoRecordingOptions> = {}
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const fullOptions: VideoRecordingOptions = {
        format: 'webm',
        quality: 'high',
        fps: 30,
        includeActionOverlays: true,
        includeCursor: true,
        maxDuration: 300, // 5 minutes
        compressionLevel: 0.8,
        fallbackToScreenshots: true,
        ...options
      };

      // Check if session already exists
      if (this.sessions.has(sessionId)) {
        await this.stopRecording(sessionId);
      }

      const session: RecordingSession = {
        id: sessionId,
        startTime: Date.now(),
        chunks: [],
        actions: [],
        screenshots: [],
        isRecording: false,
        options: fullOptions
      };

      // Try MediaRecorder first
      const mediaResult = await this.initializeMediaRecorder(session);
      
      if (!mediaResult.success && fullOptions.fallbackToScreenshots) {
        // Fallback to screenshot-based recording
        await this.initializeScreenshotRecording(session);
      } else if (!mediaResult.success) {
        return { success: false, error: mediaResult.error };
      }

      // Set up action overlay system
      if (fullOptions.includeActionOverlays) {
        this.initializeOverlaySystem();
      }

      this.sessions.set(sessionId, session);
      session.isRecording = true;

      // Start recording loop for screenshots if needed
      if (!session.mediaRecorder) {
        this.startScreenshotLoop(session);
      }

      console.log(`Enhanced video recording started for session: ${sessionId}`);
      return { success: true };

    } catch (error) {
      console.error('Failed to start enhanced video recording:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Stop recording and generate final video/GIF
   */
  async stopRecording(sessionId: string): Promise<VideoRecordingResult> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return {
        success: false,
        duration: 0,
        fileSize: 0,
        error: 'Recording session not found',
        metadata: { format: '', fps: 0, resolution: { width: 0, height: 0 }, actionsRecorded: 0 }
      };
    }

    try {
      session.isRecording = false;
      session.endTime = Date.now();
      const duration = session.endTime - session.startTime;

      // Stop media recorder if active
      if (session.mediaRecorder && session.mediaRecorder.state === 'recording') {
        session.mediaRecorder.stop();
        
        // Wait for final data
        await new Promise(resolve => {
          if (session.mediaRecorder) {
            session.mediaRecorder.ondataavailable = (event) => {
              if (event.data.size > 0) {
                session.chunks.push(event.data);
              }
            };
            session.mediaRecorder.onstop = resolve;
          } else {
            resolve(undefined);
          }
        });
      }

      // Stop screenshot loop
      if (this.animationFrameId) {
        cancelAnimationFrame(this.animationFrameId);
        this.animationFrameId = undefined;
      }

      // Clean up overlay system
      this.cleanupOverlaySystem();

      // Generate final video/GIF
      const result = await this.generateFinalVideo(session);
      
      // Clean up session
      this.sessions.delete(sessionId);
      
      return result;

    } catch (error) {
      console.error('Failed to stop recording:', error);
      return {
        success: false,
        duration: 0,
        fileSize: 0,
        error: error instanceof Error ? error.message : 'Unknown error',
        metadata: { format: '', fps: 0, resolution: { width: 0, height: 0 }, actionsRecorded: 0 }
      };
    }
  }

  /**
   * Add action overlay during recording
   */
  addActionOverlay(sessionId: string, action: TestAction, position: { x: number; y: number }): void {
    const session = this.sessions.get(sessionId);
    if (!session || !session.isRecording) return;

    const overlay: ActionOverlay = {
      id: `overlay_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      action,
      timestamp: Date.now() - session.startTime,
      position,
      duration: this.getOverlayDuration(action.type),
      style: this.getOverlayStyle(action.type)
    };

    session.actions.push(overlay);
    
    // Show visual overlay if enabled
    if (session.options.includeActionOverlays) {
      this.displayActionOverlay(overlay);
    }
  }

  /**
   * Capture screenshot manually
   */
  async captureScreenshot(sessionId: string): Promise<string | null> {
    const session = this.sessions.get(sessionId);
    if (!session) return null;

    try {
      const canvas = await html2canvas(document.body, {
        useCORS: true,
        allowTaint: true,
        backgroundColor: null,
        ignoreElements: (element) => {
          // Ignore overlay elements to prevent recursion
          return element.classList.contains('video-recorder-overlay');
        }
      });

      const screenshot = canvas.toDataURL('image/png');
      session.screenshots.push(screenshot);
      
      return screenshot;
    } catch (error) {
      console.error('Failed to capture screenshot:', error);
      return null;
    }
  }

  // Private methods
  private async initializeMediaRecorder(session: RecordingSession): Promise<{ success: boolean; error?: string }> {
    try {
      // Request screen capture
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          frameRate: session.options.fps
        } as MediaTrackConstraints,
        audio: false
      });

      session.stream = stream;

      // Determine MIME type based on format
      let mimeType = 'video/webm;codecs=vp8';
      if (session.options.format === 'mp4') {
        mimeType = 'video/mp4';
      }

      // Check if MIME type is supported
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'video/webm'; // Fallback
      }

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType,
        videoBitsPerSecond: this.getBitrate(session.options.quality)
      });

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          session.chunks.push(event.data);
        }
      };

      mediaRecorder.onerror = (event) => {
        console.error('MediaRecorder error:', event);
      };

      session.mediaRecorder = mediaRecorder;
      mediaRecorder.start(1000); // Collect data every second

      return { success: true };

    } catch (error) {
      console.error('Failed to initialize MediaRecorder:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to access screen recording'
      };
    }
  }

  private async initializeScreenshotRecording(session: RecordingSession): Promise<void> {
    // Create canvas for screenshot composition
    const canvas = document.createElement('canvas');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    const context = canvas.getContext('2d');
    if (!context) {
      throw new Error('Failed to get canvas context');
    }

    session.canvas = canvas;
    session.context = context;
  }

  private startScreenshotLoop(session: RecordingSession): void {
    const captureFrame = async () => {
      if (!session.isRecording) return;

      await this.captureScreenshot(session.id);

      // Schedule next frame
      this.animationFrameId = requestAnimationFrame(() => {
        setTimeout(captureFrame, 1000 / session.options.fps);
      });
    };

    captureFrame();
  }

  private initializeOverlaySystem(): void {
    // Create overlay container if it doesn't exist
    if (!this.overlayContainer) {
      this.overlayContainer = document.createElement('div');
      this.overlayContainer.className = 'video-recorder-overlay-container';
      this.overlayContainer.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        pointer-events: none;
        z-index: 9999;
      `;
      document.body.appendChild(this.overlayContainer);
    }
  }

  private cleanupOverlaySystem(): void {
    if (this.overlayContainer) {
      this.overlayContainer.remove();
      this.overlayContainer = undefined;
    }
  }

  private displayActionOverlay(overlay: ActionOverlay): void {
    if (!this.overlayContainer) return;

    const overlayElement = document.createElement('div');
    overlayElement.className = 'video-recorder-overlay';
    overlayElement.style.cssText = `
      position: absolute;
      left: ${overlay.position.x}px;
      top: ${overlay.position.y}px;
      background: ${overlay.style.backgroundColor};
      color: ${overlay.style.color};
      border: 2px solid ${overlay.style.borderColor};
      border-radius: ${overlay.style.borderRadius}px;
      padding: ${overlay.style.padding}px;
      font-size: ${overlay.style.fontSize}px;
      font-weight: bold;
      opacity: ${overlay.style.opacity};
      pointer-events: none;
      animation: actionOverlayFade ${overlay.duration}ms ease-out forwards;
      white-space: nowrap;
      z-index: 10000;
    `;

    // Add animation keyframes if not already added
    if (!document.getElementById('action-overlay-styles')) {
      const styleSheet = document.createElement('style');
      styleSheet.id = 'action-overlay-styles';
      styleSheet.textContent = `
        @keyframes actionOverlayFade {
          0% { opacity: ${overlay.style.opacity}; transform: scale(1.2); }
          20% { opacity: ${overlay.style.opacity}; transform: scale(1); }
          80% { opacity: ${overlay.style.opacity}; transform: scale(1); }
          100% { opacity: 0; transform: scale(0.8); }
        }
      `;
      document.head.appendChild(styleSheet);
    }

    overlayElement.textContent = this.getActionDisplayText(overlay.action);
    this.overlayContainer.appendChild(overlayElement);

    // Remove overlay after animation
    setTimeout(() => {
      if (overlayElement.parentNode) {
        overlayElement.parentNode.removeChild(overlayElement);
      }
    }, overlay.duration);
  }

  private async generateFinalVideo(session: RecordingSession): Promise<VideoRecordingResult> {
    const duration = (session.endTime || Date.now()) - session.startTime;
    
    try {
      let videoBlob: Blob | undefined;
      let gifBlob: Blob | undefined;
      let fileSize = 0;

      // Generate video from MediaRecorder chunks
      if (session.chunks.length > 0) {
        videoBlob = new Blob(session.chunks, { 
          type: session.options.format === 'mp4' ? 'video/mp4' : 'video/webm' 
        });
        fileSize = videoBlob.size;
      }

      // Generate GIF if requested or if no video available
      if (session.options.format === 'gif' || (!videoBlob && session.screenshots.length > 0)) {
        const generatedGif = await this.generateGIF(session);
        if (generatedGif) {
          gifBlob = generatedGif;
          fileSize = gifBlob.size;
        }
      }

      // Generate video from screenshots if no MediaRecorder data
      if (!videoBlob && session.screenshots.length > 0 && session.options.format !== 'gif') {
        const generatedVideo = await this.generateVideoFromScreenshots(session);
        if (generatedVideo) {
          videoBlob = generatedVideo;
          fileSize = videoBlob.size;
        }
      }

      const resolution = {
        width: session.canvas?.width || window.innerWidth,
        height: session.canvas?.height || window.innerHeight
      };

      return {
        success: true,
        videoBlob,
        gifBlob,
        screenshots: session.screenshots,
        duration,
        fileSize,
        metadata: {
          format: session.options.format,
          fps: session.options.fps,
          resolution,
          actionsRecorded: session.actions.length
        }
      };

    } catch (error) {
      console.error('Failed to generate final video:', error);
      return {
        success: false,
        duration,
        fileSize: 0,
        error: error instanceof Error ? error.message : 'Failed to generate video',
        metadata: {
          format: session.options.format,
          fps: session.options.fps,
          resolution: { width: 0, height: 0 },
          actionsRecorded: session.actions.length
        }
      };
    }
  }

  private async generateGIF(session: RecordingSession): Promise<Blob | null> {
    try {
      // This is a simplified GIF generation - in production, you'd use a library like gif.js
      // For now, we'll create a basic implementation using canvas frames
      
      if (session.screenshots.length === 0) {
        return null;
      }

      // Create frames for GIF
      const frames: ImageData[] = [];
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) return null;

      // Set canvas size
      canvas.width = Math.min(800, window.innerWidth); // Limit GIF size
      canvas.height = Math.min(600, window.innerHeight);

      for (const screenshot of session.screenshots) {
        const img = new Image();
        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = reject;
          img.src = screenshot;
        });

        // Draw image to canvas with scaling
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        // Add action overlays for this frame
        const frameTime = (frames.length / session.options.fps) * 1000;
        this.drawActionOverlaysOnCanvas(ctx, session.actions, frameTime);

        // Get frame data
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        frames.push(imageData);
      }

      // Convert frames to GIF blob (simplified - would use gif.js in production)
      return await this.framesToGIF(frames, session.options.fps);

    } catch (error) {
      console.error('Failed to generate GIF:', error);
      return null;
    }
  }

  private async generateVideoFromScreenshots(session: RecordingSession): Promise<Blob | null> {
    try {
      // This would require a more complex implementation using canvas and MediaRecorder
      // For now, return null to indicate this feature needs full implementation
      console.warn('Video generation from screenshots not fully implemented');
      return null;
    } catch (error) {
      console.error('Failed to generate video from screenshots:', error);
      return null;
    }
  }

  private async framesToGIF(frames: ImageData[], fps: number): Promise<Blob> {
    // Simplified GIF generation - in production use gif.js
    // This is a placeholder that creates a basic animated image
    
    const canvas = document.createElement('canvas');
    canvas.width = frames[0]?.width || 800;
    canvas.height = frames[0]?.height || 600;
    
    const ctx = canvas.getContext('2d');
    if (!ctx || frames.length === 0) {
      throw new Error('No frames to convert to GIF');
    }

    // For now, just return the first frame as a static image
    // In production, implement proper GIF encoding
    ctx.putImageData(frames[0], 0, 0);
    
    return new Promise(resolve => {
      canvas.toBlob((blob) => {
        resolve(blob || new Blob());
      }, 'image/png');
    });
  }

  private drawActionOverlaysOnCanvas(
    ctx: CanvasRenderingContext2D,
    actions: ActionOverlay[],
    currentTime: number
  ): void {
    for (const overlay of actions) {
      const overlayStart = overlay.timestamp;
      const overlayEnd = overlay.timestamp + overlay.duration;
      
      if (currentTime >= overlayStart && currentTime <= overlayEnd) {
        // Calculate opacity based on time
        const progress = (currentTime - overlayStart) / overlay.duration;
        let opacity = overlay.style.opacity;
        
        if (progress > 0.8) {
          opacity *= (1 - (progress - 0.8) / 0.2); // Fade out in last 20%
        }

        // Draw overlay
        ctx.save();
        ctx.globalAlpha = opacity;
        ctx.fillStyle = overlay.style.backgroundColor;
        ctx.strokeStyle = overlay.style.borderColor;
        ctx.lineWidth = 2;
        ctx.font = `bold ${overlay.style.fontSize}px Arial`;

        const text = this.getActionDisplayText(overlay.action);
        const metrics = ctx.measureText(text);
        const padding = overlay.style.padding;
        const width = metrics.width + padding * 2;
        const height = overlay.style.fontSize + padding * 2;

        // Draw background
        this.drawRoundedRect(
          ctx,
          overlay.position.x,
          overlay.position.y,
          width,
          height,
          overlay.style.borderRadius
        );
        ctx.fill();
        ctx.stroke();

        // Draw text
        ctx.fillStyle = overlay.style.color;
        ctx.fillText(
          text,
          overlay.position.x + padding,
          overlay.position.y + padding + overlay.style.fontSize
        );

        ctx.restore();
      }
    }
  }

  private drawRoundedRect(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    radius: number
  ): void {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
  }

  private getOverlayDuration(actionType: string): number {
    const durations: Record<string, number> = {
      'click': 2000,
      'input': 3000,
      'navigate': 2500,
      'hover': 1500,
      'scroll': 2000,
      'wait': 1000,
      'assert': 2500
    };
    return durations[actionType] || 2000;
  }

  private getOverlayStyle(actionType: string): OverlayStyle {
    const styles: Record<string, OverlayStyle> = {
      'click': {
        color: '#ffffff',
        backgroundColor: 'rgba(0, 123, 255, 0.9)',
        borderColor: '#007bff',
        fontSize: 14,
        padding: 8,
        borderRadius: 6,
        opacity: 0.9
      },
      'input': {
        color: '#ffffff',
        backgroundColor: 'rgba(40, 167, 69, 0.9)',
        borderColor: '#28a745',
        fontSize: 14,
        padding: 8,
        borderRadius: 6,
        opacity: 0.9
      },
      'navigate': {
        color: '#ffffff',
        backgroundColor: 'rgba(255, 193, 7, 0.9)',
        borderColor: '#ffc107',
        fontSize: 14,
        padding: 8,
        borderRadius: 6,
        opacity: 0.9
      },
      'assert': {
        color: '#ffffff',
        backgroundColor: 'rgba(220, 53, 69, 0.9)',
        borderColor: '#dc3545',
        fontSize: 14,
        padding: 8,
        borderRadius: 6,
        opacity: 0.9
      }
    };

    return styles[actionType] || styles['click'];
  }

  private getActionDisplayText(action: TestAction): string {
    switch (action.type) {
      case 'click':
        return `Click ${action.selector || 'element'}`;
      case 'input':
        return `Type "${action.value || ''}"`;
      case 'navigate':
        return `Navigate to ${action.url || action.selector || 'page'}`;
      case 'hover':
        return `Hover ${action.selector || 'element'}`;
      case 'scroll':
        return 'Scroll';
      case 'wait':
        return `Wait ${action.value || ''}`;
      case 'assert':
        return `Assert ${action.selector || 'condition'}`;
      default:
        return action.type.charAt(0).toUpperCase() + action.type.slice(1);
    }
  }

  private getBitrate(quality: string): number {
    const bitrates = {
      'low': 1000000,    // 1 Mbps
      'medium': 2500000, // 2.5 Mbps
      'high': 5000000    // 5 Mbps
    };
    return bitrates[quality as keyof typeof bitrates] || bitrates.medium;
  }

  /**
   * Get recording status
   */
  getRecordingStatus(sessionId: string): { isRecording: boolean; duration: number; actionsCount: number } {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return { isRecording: false, duration: 0, actionsCount: 0 };
    }

    return {
      isRecording: session.isRecording,
      duration: (session.endTime || Date.now()) - session.startTime,
      actionsCount: session.actions.length
    };
  }

  /**
   * Clean up all sessions
   */
  cleanup(): void {
    for (const [sessionId] of this.sessions) {
      this.stopRecording(sessionId);
    }
    this.sessions.clear();
    this.cleanupOverlaySystem();
  }
}

// Export default instance
export const videoRecorder = new EnhancedVideoRecorder();