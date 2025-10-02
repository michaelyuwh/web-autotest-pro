import { v4 as uuidv4 } from 'uuid';
import { TestAction, ActionType, TestCase, TestExecution, ExecutionStatus } from './types';

// Utility functions for test actions
export const createTestAction = (
  type: ActionType,
  selector: string,
  options: Partial<TestAction> = {}
): TestAction => ({
  id: uuidv4(),
  type,
  selector,
  timestamp: Date.now(),
  description: generateActionDescription(type, selector, options.value),
  ...options
});

export const generateActionDescription = (
  type: ActionType,
  selector: string,
  value?: string
): string => {
  const element = selector.includes('#') 
    ? `element ${selector}` 
    : selector.includes('.') 
    ? `element with class ${selector}` 
    : `element ${selector}`;

  switch (type) {
    case ActionType.CLICK:
      return `Click ${element}`;
    case ActionType.INPUT:
      return `Enter "${value}" in ${element}`;
    case ActionType.HOVER:
      return `Hover over ${element}`;
    case ActionType.SCROLL:
      return `Scroll ${value || 'down'}`;
    case ActionType.NAVIGATE:
      return `Navigate to ${selector}`;
    case ActionType.WAIT:
      return `Wait for ${element}`;
    case ActionType.ASSERT:
      return `Assert ${element} ${value ? `contains "${value}"` : 'exists'}`;
    case ActionType.SCREENSHOT:
      return `Take screenshot`;
    case ActionType.REDIRECT:
      return `Redirected to ${selector}`;
    case ActionType.POPUP:
      return `Handle popup: ${value || 'dismiss'}`;
    case ActionType.SWITCH_CONTEXT:
      return `Switch to ${selector}`;
    default:
      return `Perform ${type} on ${element}`;
  }
};

// Selector utilities
export const optimizeSelector = (element: Element): string => {
  // Priority order: data-testid > id > unique class > CSS selector
  const testId = element.getAttribute('data-testid');
  if (testId) return `[data-testid="${testId}"]`;

  const id = element.id;
  if (id && document.querySelectorAll(`#${id}`).length === 1) {
    return `#${id}`;
  }

  const classes = Array.from(element.classList);
  for (const className of classes) {
    if (document.querySelectorAll(`.${className}`).length === 1) {
      return `.${className}`;
    }
  }

  // Generate unique CSS selector
  return generateUniqueSelector(element);
};

export const generateUniqueSelector = (element: Element): string => {
  if (element.id) {
    return `#${element.id}`;
  }

  const path = [];
  let current = element;

  while (current && current.nodeType === Node.ELEMENT_NODE) {
    let selector = current.nodeName.toLowerCase();
    
    if (current.id) {
      selector += `#${current.id}`;
      path.unshift(selector);
      break;
    }

    if (current.className) {
      const classes = current.className.trim().split(/\s+/).slice(0, 2);
      selector += `.${classes.join('.')}`;
    }

    const parent = current.parentNode as Element;
    if (parent) {
      const siblings = Array.from(parent.children);
      const index = siblings.indexOf(current);
      if (siblings.filter(s => s.nodeName === current.nodeName).length > 1) {
        selector += `:nth-child(${index + 1})`;
      }
    }

    path.unshift(selector);
    current = parent;
  }

  return path.join(' > ');
};

// Test case utilities
export const createTestCase = (
  name: string,
  url: string,
  steps: TestAction[] = []
): TestCase => ({
  id: uuidv4(),
  name,
  description: '',
  url,
  tags: [],
  steps,
  actions: steps, // Add actions alias
  successCriteria: [],
  metadata: {
    author: 'User',
    browser: typeof navigator !== 'undefined' ? navigator.userAgent.split(' ')[0] : 'unknown',
    deviceType: 'desktop',
    viewport: typeof window !== 'undefined' ? { width: window.innerWidth, height: window.innerHeight } : { width: 1280, height: 720 },
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown'
  },
  createdAt: Date.now(),
  updatedAt: Date.now(),
  version: 1
});

export const validateTestCase = (testCase: TestCase): string[] => {
  const errors: string[] = [];

  if (!testCase.name.trim()) {
    errors.push('Test case name is required');
  }

  if (!testCase.url.trim()) {
    errors.push('Test case URL is required');
  }

  if (!isValidUrl(testCase.url)) {
    errors.push('Invalid URL format');
  }

  if (testCase.steps.length === 0) {
    errors.push('Test case must have at least one step');
  }

  testCase.steps.forEach((step, index) => {
    if (step.selector && !step.selector.trim()) {
      errors.push(`Step ${index + 1}: Selector is required`);
    }
    if (step.type === ActionType.INPUT && !step.value) {
      errors.push(`Step ${index + 1}: Input value is required`);
    }
  });

  return errors;
};

// URL utilities
export const isValidUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

export const normalizeUrl = (url: string): string => {
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    return `https://${url}`;
  }
  return url;
};

// Execution utilities
export const createTestExecution = (testCaseId: string, browser: string): TestExecution => ({
  id: uuidv4(),
  testCaseId,
  status: ExecutionStatus.RUNNING,
  startTime: Date.now(),
  results: [],
  screenshots: [],
  logs: [],
  metrics: {
    totalTime: 0,
    stepCount: 0,
    passedSteps: 0,
    failedSteps: 0,
    averageStepTime: 0,
    retryCount: 0
  },
  browser,
  environment: {
    browser,
    browserVersion: getBrowserVersion(),
    os: getOperatingSystem(),
    osVersion: getOSVersion(),
    viewport: { width: window.innerWidth, height: window.innerHeight },
    userAgent: navigator.userAgent,
    timestamp: Date.now()
  }
});

// Browser detection utilities
export const getBrowserVersion = (): string => {
  const userAgent = navigator.userAgent;
  
  if (userAgent.includes('Chrome')) {
    const match = userAgent.match(/Chrome\/(\d+\.\d+)/);
    return match ? match[1] : 'Unknown';
  }
  
  if (userAgent.includes('Firefox')) {
    const match = userAgent.match(/Firefox\/(\d+\.\d+)/);
    return match ? match[1] : 'Unknown';
  }
  
  if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) {
    const match = userAgent.match(/Version\/(\d+\.\d+)/);
    return match ? match[1] : 'Unknown';
  }
  
  if (userAgent.includes('Edge')) {
    const match = userAgent.match(/Edge\/(\d+\.\d+)/);
    return match ? match[1] : 'Unknown';
  }
  
  return 'Unknown';
};

export const getOperatingSystem = (): string => {
  const userAgent = navigator.userAgent;
  
  if (userAgent.includes('Win')) return 'Windows';
  if (userAgent.includes('Mac')) return 'macOS';
  if (userAgent.includes('X11') || userAgent.includes('Linux')) return 'Linux';
  if (userAgent.includes('Android')) return 'Android';
  if (userAgent.includes('iOS')) return 'iOS';
  
  return 'Unknown';
};

export const getOSVersion = (): string => {
  const userAgent = navigator.userAgent;
  
  // Windows
  if (userAgent.includes('Windows NT 10.0')) return '10/11';
  if (userAgent.includes('Windows NT 6.3')) return '8.1';
  if (userAgent.includes('Windows NT 6.2')) return '8';
  if (userAgent.includes('Windows NT 6.1')) return '7';
  
  // macOS
  const macMatch = userAgent.match(/Mac OS X (\d+[._]\d+[._]\d+)/);
  if (macMatch) return macMatch[1].replace(/_/g, '.');
  
  // Linux
  if (userAgent.includes('Linux')) return 'Linux';
  
  return 'Unknown';
};

// Format utilities
export const formatDuration = (milliseconds: number): string => {
  if (milliseconds < 1000) return `${milliseconds}ms`;
  if (milliseconds < 60000) return `${(milliseconds / 1000).toFixed(1)}s`;
  if (milliseconds < 3600000) return `${Math.floor(milliseconds / 60000)}m ${Math.floor((milliseconds % 60000) / 1000)}s`;
  return `${Math.floor(milliseconds / 3600000)}h ${Math.floor((milliseconds % 3600000) / 60000)}m`;
};

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

// Debounce utility
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

// Throttle utility
export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let inThrottle: boolean;
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};