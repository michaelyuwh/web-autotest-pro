/**
 * Jest setup file for Web AutoTest Pro unit tests
 * Configures testing environment and global test utilities
 */

import '@testing-library/jest-dom';
import { configure } from '@testing-library/react';
import { jest } from '@jest/globals';

// Configure React Testing Library
configure({
  testIdAttribute: 'data-testid',
  asyncUtilTimeout: 5000,
});

// Mock IntersectionObserver
global.IntersectionObserver = jest.fn(() => ({
  disconnect: jest.fn(),
  observe: jest.fn(),
  unobserve: jest.fn(),
}));

// Mock ResizeObserver
global.ResizeObserver = jest.fn(() => ({
  disconnect: jest.fn(),
  observe: jest.fn(),
  unobserve: jest.fn(),
}));

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // Deprecated
    removeListener: jest.fn(), // Deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock window.scrollTo
Object.defineProperty(window, 'scrollTo', {
  value: jest.fn(),
  writable: true,
});

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
  length: 0,
  key: jest.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock sessionStorage
Object.defineProperty(window, 'sessionStorage', {
  value: localStorageMock,
});

// Mock crypto.randomUUID
Object.defineProperty(window, 'crypto', {
  value: {
    randomUUID: jest.fn(() => 'test-uuid-1234-5678-9012'),
    getRandomValues: jest.fn((arr) => {
      for (let i = 0; i < arr.length; i++) {
        arr[i] = Math.floor(Math.random() * 256);
      }
      return arr;
    }),
  },
});

// Mock URL.createObjectURL
Object.defineProperty(URL, 'createObjectURL', {
  value: jest.fn(() => 'blob:mock-url'),
});

Object.defineProperty(URL, 'revokeObjectURL', {
  value: jest.fn(),
});

// Mock WebSocket
global.WebSocket = jest.fn(() => ({
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  send: jest.fn(),
  close: jest.fn(),
  readyState: 1, // OPEN
  CONNECTING: 0,
  OPEN: 1,
  CLOSING: 2,
  CLOSED: 3,
}));

// Mock fetch
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    status: 200,
    json: () => Promise.resolve({}),
    text: () => Promise.resolve(''),
    blob: () => Promise.resolve(new Blob()),
  })
);

// Mock navigator
Object.defineProperty(navigator, 'clipboard', {
  value: {
    writeText: jest.fn(() => Promise.resolve()),
    readText: jest.fn(() => Promise.resolve('mock clipboard text')),
  },
});

Object.defineProperty(navigator, 'serviceWorker', {
  value: {
    register: jest.fn(() => Promise.resolve()),
    ready: Promise.resolve({
      active: {
        postMessage: jest.fn(),
      },
    }),
  },
});

// Mock FileReader
global.FileReader = jest.fn(() => ({
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  readAsText: jest.fn(),
  readAsDataURL: jest.fn(),
  result: 'mock file content',
}));

// Mock File and Blob
global.File = jest.fn((bits, name, options) => ({
  name,
  size: bits ? bits.join('').length : 0,
  type: options?.type || 'text/plain',
  lastModified: Date.now(),
  arrayBuffer: () => Promise.resolve(new ArrayBuffer(8)),
  text: () => Promise.resolve(bits ? bits.join('') : ''),
}));

global.Blob = jest.fn((bits, options) => ({
  size: bits ? bits.join('').length : 0,
  type: options?.type || 'text/plain',
  arrayBuffer: () => Promise.resolve(new ArrayBuffer(8)),
  text: () => Promise.resolve(bits ? bits.join('') : ''),
}));

// Mock canvas
HTMLCanvasElement.prototype.getContext = jest.fn(() => ({
  fillRect: jest.fn(),
  clearRect: jest.fn(),
  getImageData: jest.fn(() => ({ data: new Array(4) })),
  putImageData: jest.fn(),
  createImageData: jest.fn(() => ({ data: new Array(4) })),
  setTransform: jest.fn(),
  drawImage: jest.fn(),
  save: jest.fn(),
  fillText: jest.fn(),
  restore: jest.fn(),
  beginPath: jest.fn(),
  moveTo: jest.fn(),
  lineTo: jest.fn(),
  closePath: jest.fn(),
  stroke: jest.fn(),
  translate: jest.fn(),
  scale: jest.fn(),
  rotate: jest.fn(),
  arc: jest.fn(),
  fill: jest.fn(),
  measureText: jest.fn(() => ({ width: 0 })),
  transform: jest.fn(),
  rect: jest.fn(),
  clip: jest.fn(),
}));

// Mock HTMLMediaElement
Object.defineProperty(HTMLMediaElement.prototype, 'muted', {
  writable: true,
  value: false,
});

Object.defineProperty(HTMLMediaElement.prototype, 'play', {
  writable: true,
  value: jest.fn(() => Promise.resolve()),
});

Object.defineProperty(HTMLMediaElement.prototype, 'pause', {
  writable: true,
  value: jest.fn(),
});

// Mock getBoundingClientRect
Element.prototype.getBoundingClientRect = jest.fn(() => ({
  width: 100,
  height: 100,
  top: 0,
  left: 0,
  bottom: 100,
  right: 100,
  x: 0,
  y: 0,
  toJSON: jest.fn(),
}));

// Mock scrollIntoView
Element.prototype.scrollIntoView = jest.fn();

// Mock focus
HTMLElement.prototype.focus = jest.fn();

// Mock blur
HTMLElement.prototype.blur = jest.fn();

// Mock click
HTMLElement.prototype.click = jest.fn();

// Global test utilities
export const createMockTestCase = (overrides = {}) => ({
  id: 'test-case-1',
  name: 'Sample Test Case',
  description: 'A sample test case for testing',
  steps: [
    {
      id: 'step-1',
      type: 'navigate',
      url: 'https://example.com',
      description: 'Navigate to example.com',
    },
    {
      id: 'step-2',
      type: 'click',
      selector: '#button',
      description: 'Click the button',
    },
  ],
  created: new Date().toISOString(),
  updated: new Date().toISOString(),
  ...overrides,
});

export const createMockExecutionResult = (overrides = {}) => ({
  id: 'execution-1',
  testCaseId: 'test-case-1',
  status: 'passed',
  startTime: new Date().toISOString(),
  endTime: new Date().toISOString(),
  duration: 1500,
  steps: [
    {
      id: 'step-1',
      status: 'passed',
      duration: 500,
      screenshot: 'data:image/png;base64,mock-screenshot',
    },
    {
      id: 'step-2',
      status: 'passed',
      duration: 1000,
      screenshot: 'data:image/png;base64,mock-screenshot-2',
    },
  ],
  ...overrides,
});

// Console warnings suppressions for tests
const originalWarn = console.warn;
const originalError = console.error;

beforeAll(() => {
  console.warn = (...args) => {
    // Suppress specific warnings that are expected in tests
    const message = args[0];
    if (
      typeof message === 'string' &&
      (message.includes('Warning: ReactDOM.render is deprecated') ||
        message.includes('Warning: componentWillReceiveProps has been renamed') ||
        message.includes('Warning: componentWillMount has been renamed'))
    ) {
      return;
    }
    originalWarn(...args);
  };

  console.error = (...args) => {
    // Suppress specific errors that are expected in tests
    const message = args[0];
    if (
      typeof message === 'string' &&
      (message.includes('Error: Not implemented: HTMLCanvasElement.prototype.getContext') ||
        message.includes('Error: Not implemented: window.scrollTo'))
    ) {
      return;
    }
    originalError(...args);
  };
});

afterAll(() => {
  console.warn = originalWarn;
  console.error = originalError;
});

// Cleanup after each test
afterEach(() => {
  jest.clearAllMocks();
  localStorageMock.clear();
});