// Core test action types
export interface TestAction {
  id: string;
  type: ActionType;
  selector?: string;
  value?: string;
  timestamp: number;
  description: string;
  mousePosition?: { x: number; y: number };
  condition?: string;
  timeout?: number;
  url?: string;
  x?: number;
  y?: number;
  critical?: boolean;
  assertion?: {
    type: 'visible' | 'hidden' | 'text' | 'value' | 'count';
    value?: string;
  };
}

export enum ActionType {
  CLICK = 'click',
  TYPE = 'type',
  INPUT = 'input',
  HOVER = 'hover',
  SCROLL = 'scroll',
  NAVIGATE = 'navigate',
  WAIT = 'wait',
  ASSERT = 'assert',
  SCREENSHOT = 'screenshot',
  REDIRECT = 'redirect',
  POPUP = 'popup',
  SWITCH_CONTEXT = 'switch_context',
  KEY_PRESS = 'key_press'
}

// Test case structure
export interface TestCase {
  id: string;
  name: string;
  description: string;
  url: string;
  tags: string[];
  steps: TestAction[];
  actions: TestAction[]; // Alias for steps for backward compatibility
  successCriteria: SuccessCriteria[];
  metadata: TestCaseMetadata;
  createdAt: number;
  updatedAt: number;
  version: number;
}

export interface SuccessCriteria {
  id: string;
  type: 'element_exists' | 'element_contains' | 'url_matches' | 'status_code';
  selector?: string;
  expectedValue: string;
  description: string;
}

export interface TestCaseMetadata {
  author: string;
  browser: string;
  deviceType: 'desktop' | 'tablet' | 'mobile';
  viewport: { width: number; height: number };
  userAgent: string;
}

// Recording state
export interface RecordingState {
  isRecording: boolean;
  isPaused: boolean;
  currentUrl: string;
  actions: TestAction[];
  startTime: number;
  pipWindows: PiPWindow[];
}

export interface PiPWindow {
  id: string;
  type: 'controls' | 'mouse_tracker' | 'steps';
  position: { x: number; y: number };
  size: { width: number; height: number };
  isVisible: boolean;
}

// Test execution
export interface TestExecution {
  id: string;
  testCaseId: string;
  status: ExecutionStatus;
  startTime: number;
  endTime?: number;
  duration?: number;
  results: TestStepResult[];
  steps?: ExecutionStep[];
  videoPath?: string;
  videos?: string[];
  screenshots: Screenshot[];
  logs: ExecutionLog[];
  metrics?: ExecutionMetrics;
  browser: string;
  environment?: ExecutionEnvironment;
  error?: string;
}

export interface ExecutionStep {
  action: TestAction;
  status: 'pending' | 'running' | 'passed' | 'failed' | 'skipped';
  error?: string;
  screenshot?: string;
  duration?: number;
}

export enum ExecutionStatus {
  RUNNING = 'running',
  COMPLETED = 'completed',
  PASSED = 'passed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
  ERROR = 'error'
}

export interface TestStepResult {
  stepId: string;
  status: ExecutionStatus;
  startTime: number;
  endTime: number;
  error?: string;
  screenshot?: string;
  actualValue?: string;
  expectedValue?: string;
}

export interface Screenshot {
  id: string;
  stepId: string;
  timestamp: number;
  data: string; // base64
  type: 'action' | 'assertion' | 'error';
}

export interface ExecutionLog {
  timestamp: number;
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  category: 'system' | 'browser' | 'ai' | 'user';
  details?: any;
}

export interface ExecutionMetrics {
  totalTime: number;
  stepCount: number;
  passedSteps: number;
  failedSteps: number;
  averageStepTime: number;
  retryCount: number;
  memoryUsage?: number;
  cpuUsage?: number;
}

export interface ExecutionEnvironment {
  browser: string;
  browserVersion: string;
  os: string;
  osVersion: string;
  viewport: { width: number; height: number };
  userAgent: string;
  timestamp: number;
}

// AI Integration
export interface AIRequest {
  type: AIRequestType;
  context: any;
  prompt: string;
  testCase?: TestCase;
  execution?: TestExecution;
}

export enum AIRequestType {
  GENERATE_STEPS = 'generate_steps',
  OPTIMIZE_SELECTORS = 'optimize_selectors',
  DEBUG_FAILURE = 'debug_failure',
  SUGGEST_ASSERTIONS = 'suggest_assertions',
  ANALYZE_DOM = 'analyze_dom',
  FIX_FLAKY_TEST = 'fix_flaky_test'
}

export interface AIResponse {
  success: boolean;
  suggestions: AISuggestion[];
  confidence: number;
  reasoning: string;
  error?: string;
}

export interface AISuggestion {
  type: 'action' | 'assertion' | 'optimization' | 'fix';
  description: string;
  code?: string;
  confidence: number;
  impact: 'low' | 'medium' | 'high';
}

// Storage
export interface StorageStats {
  testCases: number;
  executions: number;
  totalSize: number;
  aiModelSize: number;
  videoSize: number;
  lastBackup?: number;
}

export interface ExportOptions {
  format: ExportFormat;
  includeVideos: boolean;
  includeScreenshots: boolean;
  includeLogs: boolean;
  testCaseIds?: string[];
  dateRange?: { start: number; end: number };
}

export enum ExportFormat {
  JSON = 'json',
  YAML = 'yaml',
  PDF = 'pdf',
  HTML = 'html',
  CSV = 'csv',
  MARKDOWN = 'markdown',
  XML = 'xml'
}

// Browser-specific types
export interface BrowserCapabilities {
  recording: boolean;
  playback: boolean;
  ai: boolean;
  video: boolean;
  pip: boolean;
  webgpu: boolean;
  limitations: string[];
}

export interface BrowserConfig {
  name: string;
  version: string;
  capabilities: BrowserCapabilities;
  ieMode: boolean;
  headless: boolean;
}

// UI State
export interface UIState {
  theme: 'light' | 'dark' | 'auto';
  liquidGlass: {
    transparency: number;
    blur: number;
    animations: boolean;
  };
  layout: {
    sidebarCollapsed: boolean;
    activeTabs: string[];
    activePanel: string;
  };
  accessibility: {
    highContrast: boolean;
    reducedMotion: boolean;
    keyboardNavigation: boolean;
  };
}

// Android companion app types
export interface AndroidSyncData {
  testCases: TestCase[];
  executions: TestExecution[];
  lastSync: number;
}

export interface AndroidNotification {
  id: string;
  type: 'execution_complete' | 'sync_ready' | 'error';
  title: string;
  message: string;
  timestamp: number;
  data?: any;
}