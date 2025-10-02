// Application constants
export const APP_NAME = 'AutoTest Pro';
export const VERSION = '1.0.0';

// Storage keys
export const STORAGE_KEYS = {
  TEST_CASES: 'autotest_test_cases',
  EXECUTIONS: 'autotest_executions',
  SETTINGS: 'autotest_settings',
  AI_MODEL: 'autotest_ai_model',
  RECORDINGS: 'autotest_recordings'
} as const;

// Timing constants
export const TIMEOUTS = {
  DEFAULT_ACTION: 5000,
  PAGE_LOAD: 30000,
  ELEMENT_WAIT: 10000,
  AI_INFERENCE: 15000,
  VIDEO_PROCESSING: 60000
} as const;

// UI constants
export const UI_CONSTANTS = {
  SIDEBAR_WIDTH: 280,
  HEADER_HEIGHT: 64,
  FOOTER_HEIGHT: 48,
  PIP_MIN_SIZE: { width: 320, height: 240 },
  PIP_MAX_SIZE: { width: 800, height: 600 }
} as const;

// Browser capabilities
export const BROWSER_SUPPORT = {
  CHROME: {
    recording: true,
    playback: true,
    ai: true,
    video: true,
    pip: true,
    webgpu: true
  },
  FIREFOX: {
    recording: true,
    playback: true,
    ai: true,
    video: true,
    pip: true,
    webgpu: true
  },
  EDGE: {
    recording: true,
    playback: true,
    ai: true,
    video: true,
    pip: true,
    webgpu: true
  },
  SAFARI: {
    recording: true,
    playback: true,
    ai: true,
    video: false, // html2canvas fallback
    pip: true,
    webgpu: false
  },
  IE: {
    recording: false, // limited
    playback: false, // limited
    ai: false,
    video: false,
    pip: false,
    webgpu: false
  }
} as const;

// AI model constants
export const AI_CONFIG = {
  MODEL_NAME: 'phi-3-mini-4k-instruct',
  MAX_TOKENS: 4096,
  TEMPERATURE: 0.7,
  MAX_SUGGESTIONS: 5,
  CONFIDENCE_THRESHOLD: 0.6
} as const;

// Export formats
export const EXPORT_FORMATS = {
  JSON: { extension: 'json', mimeType: 'application/json' },
  YAML: { extension: 'yaml', mimeType: 'application/x-yaml' },
  PDF: { extension: 'pdf', mimeType: 'application/pdf' },
  HTML: { extension: 'html', mimeType: 'text/html' },
  CSV: { extension: 'csv', mimeType: 'text/csv' },
  MARKDOWN: { extension: 'md', mimeType: 'text/markdown' },
  XML: { extension: 'xml', mimeType: 'application/xml' }
} as const;

// Validation rules
export const VALIDATION_RULES = {
  TEST_CASE_NAME: {
    minLength: 3,
    maxLength: 100,
    pattern: /^[a-zA-Z0-9\s\-_]+$/
  },
  URL: {
    pattern: /^https?:\/\/.+/
  },
  SELECTOR: {
    minLength: 1,
    maxLength: 500
  }
} as const;

// Theme configuration
export const THEME_CONFIG = {
  LIQUID_GLASS: {
    defaultTransparency: 0.1,
    maxTransparency: 0.3,
    blurRadius: 10,
    borderRadius: 16,
    animationDuration: 300
  },
  COLORS: {
    primary: '#007BFF',
    success: '#28A745',
    error: '#DC3545',
    warning: '#FFC107',
    info: '#17A2B8'
  }
} as const;