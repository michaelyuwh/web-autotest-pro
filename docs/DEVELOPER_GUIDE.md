# Web AutoTest Pro - Developer Documentation

## 🏗️ Architecture Overview

Web AutoTest Pro is a comprehensive testing platform built with modern web technologies and cross-platform compatibility.

### System Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Web App PWA   │    │ Browser Extension│    │ Android App     │
│   (React/Vite)  │◄──►│ (Chrome/Firefox) │◄──►│ (React Native)  │
└─────────┬───────┘    └─────────┬───────┘    └─────────┬───────┘
          │                      │                      │
          └──────────────────────┼──────────────────────┘
                                 │
                    ┌─────────────▼───────────┐
                    │    WebSocket Server    │
                    │   (Real-time Sync)     │
                    └─────────────┬───────────┘
                                 │
                    ┌─────────────▼───────────┐
                    │     Backend API        │
                    │  (Node.js/Express)     │
                    └─────────────┬───────────┘
                                 │
                    ┌─────────────▼───────────┐
                    │     Database           │
                    │   (MongoDB/SQLite)     │
                    └─────────────────────────┘
```

### Technology Stack

#### Frontend
- **Web App**: React 18, TypeScript, Vite, Tailwind CSS
- **State Management**: Zustand for global state
- **UI Components**: Headless UI, Heroicons
- **PWA**: Workbox service workers, offline support
- **Testing**: Jest, React Testing Library, Playwright

#### Browser Extension
- **Manifest V3**: Modern extension architecture
- **Content Scripts**: DOM interaction and event capture
- **Background Service Worker**: Cross-tab communication
- **Popup Interface**: React-based configuration UI

#### Mobile App
- **React Native**: Expo managed workflow
- **Jetpack Compose**: Native Android UI components
- **Navigation**: React Navigation v6
- **Real-time**: WebSocket integration

#### Backend Services
- **API Server**: Node.js with Express framework
- **WebSocket**: Real-time synchronization
- **Authentication**: JWT tokens with refresh
- **Database**: MongoDB for production, SQLite for local

## 🚀 Development Setup

### Prerequisites
- Node.js 18+ and npm 9+
- Python 3.11+ (for testing infrastructure)
- Java 17+ (for Android development)
- Docker (optional, for containerized development)

### Quick Start
```bash
# Clone the repository
git clone https://github.com/username/web-autotest-pro.git
cd web-autotest-pro

# Install dependencies
npm install

# Start development server
npm run dev

# Run tests
npm test
```

### Component Setup

#### Web Application
```bash
cd web-app
npm install
npm run dev          # Development server
npm run build        # Production build
npm run test         # Run tests
```

#### Browser Extension
```bash
cd browser-extension
npm install
npm run dev          # Development build with watch
npm run build        # Production build
npm run test         # Run tests
```

#### Android App
```bash
cd android-app/web-autotest-companion
npm install
expo start           # Start Expo development server
expo build:android   # Build APK
npm test            # Run tests
```

### Environment Variables
Create `.env` files for each environment:

```bash
# .env.development
REACT_APP_API_URL=http://localhost:8000
REACT_APP_WS_URL=ws://localhost:8000
REACT_APP_AI_ENABLED=true

# .env.production
REACT_APP_API_URL=https://api.autotest-pro.dev
REACT_APP_WS_URL=wss://api.autotest-pro.dev
REACT_APP_AI_ENABLED=true
```

## 🔧 API Reference

### REST API Endpoints

#### Authentication
```typescript
POST /api/auth/login
POST /api/auth/register
POST /api/auth/refresh
POST /api/auth/logout
```

#### Test Cases
```typescript
GET    /api/test-cases           // List all test cases
POST   /api/test-cases           // Create new test case
GET    /api/test-cases/:id       // Get specific test case
PUT    /api/test-cases/:id       // Update test case
DELETE /api/test-cases/:id       // Delete test case
```

#### Test Execution
```typescript
POST   /api/executions           // Start test execution
GET    /api/executions/:id       // Get execution status
POST   /api/executions/:id/stop  // Stop execution
GET    /api/executions/:id/logs  // Get execution logs
```

#### Data Types
```typescript
interface TestCase {
  id: string;
  name: string;
  description: string;
  steps: TestStep[];
  created: string;
  updated: string;
  metadata: TestMetadata;
}

interface TestStep {
  id: string;
  type: 'navigate' | 'click' | 'input' | 'assert' | 'wait';
  selector?: string;
  value?: string;
  timeout: number;
  description: string;
}

interface ExecutionResult {
  id: string;
  testCaseId: string;
  status: 'running' | 'passed' | 'failed' | 'cancelled';
  startTime: string;
  endTime?: string;
  steps: StepResult[];
  screenshots: string[];
  video?: string;
}
```

### WebSocket Events

#### Client to Server
```typescript
// Subscribe to execution updates
{
  type: 'subscribe',
  executionId: string
}

// Start test execution
{
  type: 'execute',
  testCaseId: string,
  options: ExecutionOptions
}

// Stop execution
{
  type: 'stop',
  executionId: string
}
```

#### Server to Client
```typescript
// Execution status update
{
  type: 'execution-update',
  executionId: string,
  status: ExecutionStatus,
  currentStep?: number
}

// Step completion
{
  type: 'step-complete',
  executionId: string,
  stepId: string,
  result: StepResult
}

// Execution complete
{
  type: 'execution-complete',
  executionId: string,
  result: ExecutionResult
}
```

## 🧪 Testing Strategy

### Unit Tests
- **Framework**: Jest with React Testing Library
- **Coverage**: Minimum 80% code coverage
- **Location**: `testing/unit/`
- **Command**: `npm run test:unit`

```typescript
// Example component test
import { render, screen, fireEvent } from '@testing-library/react';
import { TestRecorder } from '../components/TestRecorder';

test('should start recording when button clicked', () => {
  render(<TestRecorder />);
  const startButton = screen.getByRole('button', { name: /start recording/i });
  
  fireEvent.click(startButton);
  
  expect(screen.getByText(/recording active/i)).toBeInTheDocument();
});
```

### Integration Tests
- **Framework**: Selenium WebDriver with PyTest
- **Coverage**: API endpoints and cross-component interactions
- **Location**: `testing/integration/`
- **Command**: `npm run test:integration`

```python
# Example integration test
def test_recording_workflow(browser_driver):
    driver = browser_driver
    
    # Navigate to recorder
    driver.get("http://localhost:3000/recorder")
    
    # Start recording
    start_button = driver.find_element(By.ID, "start-recording")
    start_button.click()
    
    # Verify recording state
    assert driver.find_element(By.CLASS_NAME, "recording-active")
```

### End-to-End Tests
- **Framework**: Playwright
- **Coverage**: Complete user workflows
- **Location**: `testing/e2e/tests/`
- **Command**: `npm run test:e2e`

```typescript
// Example E2E test
test('complete test creation workflow', async ({ page }) => {
  await page.goto('/recorder');
  
  // Start recording
  await page.click('#start-recording');
  
  // Perform actions
  await page.goto('/test-page');
  await page.click('#test-button');
  
  // Stop and save
  await page.goto('/recorder');
  await page.click('#stop-recording');
  await page.fill('#test-name', 'My Test');
  await page.click('#save-test');
  
  // Verify test saved
  await expect(page.locator('.save-success')).toBeVisible();
});
```

## 🏗️ Build & Deployment

### Development Build
```bash
npm run dev          # Start all development servers
npm run build        # Build all components
npm run lint         # Run linting
npm run type-check   # TypeScript type checking
```

### Production Build
```bash
npm run build:prod   # Production build with optimizations
npm run build:pwa    # PWA build with service workers
npm run analyze      # Bundle analysis
```

### Docker Deployment
```dockerfile
# Multi-stage build
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

FROM node:18-alpine AS runtime
WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
COPY dist ./dist
EXPOSE 3000
CMD ["npm", "start"]
```

### CI/CD Pipeline
The project uses GitHub Actions for automated testing and deployment:

- **Pull Request**: Lint, test, build verification
- **Main Branch**: Full test suite, security scan, build artifacts
- **Release Tags**: Deploy to production, publish to stores

## 🔌 Extension Development

### Manifest Configuration
```json
{
  "manifest_version": 3,
  "name": "Web AutoTest Pro",
  "version": "1.0.0",
  "permissions": [
    "activeTab",
    "storage",
    "scripting"
  ],
  "content_scripts": [{
    "matches": ["<all_urls>"],
    "js": ["content.js"],
    "run_at": "document_end"
  }],
  "background": {
    "service_worker": "background.js"
  },
  "action": {
    "default_popup": "popup.html"
  }
}
```

### Content Script Communication
```typescript
// Content script to background communication
chrome.runtime.sendMessage({
  type: 'ELEMENT_CLICKED',
  selector: getElementSelector(event.target),
  coordinates: { x: event.clientX, y: event.clientY }
});

// Background script response
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'ELEMENT_CLICKED') {
    // Process click event
    recordUserAction(message);
    sendResponse({ success: true });
  }
});
```

## 📱 Mobile App Development

### React Native Structure
```
android-app/web-autotest-companion/
├── src/
│   ├── components/         # Reusable UI components
│   ├── screens/           # Screen components
│   ├── navigation/        # Navigation configuration
│   ├── services/         # API and WebSocket services
│   ├── hooks/            # Custom React hooks
│   └── utils/            # Utility functions
├── app.json              # Expo configuration
└── package.json
```

### WebSocket Integration
```typescript
// Real-time monitoring hook
export const useRealtimeMonitoring = () => {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [executions, setExecutions] = useState<Execution[]>([]);

  useEffect(() => {
    const ws = new WebSocket('wss://api.autotest-pro.dev/ws');
    
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'execution-update') {
        setExecutions(prev => updateExecution(prev, data));
      }
    };
    
    setSocket(ws);
    return () => ws.close();
  }, []);

  return { socket, executions };
};
```

## 🔒 Security Considerations

### Content Security Policy
```typescript
// CSP for web app
const csp = {
  "default-src": ["'self'"],
  "script-src": ["'self'", "'wasm-unsafe-eval'"],
  "connect-src": ["'self'", "wss:", "https:"],
  "img-src": ["'self'", "data:", "blob:"],
  "style-src": ["'self'", "'unsafe-inline'"]
};
```

### Data Sanitization
```typescript
// Input sanitization
export const sanitizeSelector = (selector: string): string => {
  return selector.replace(/[<>\"']/g, '');
};

// XSS prevention
export const escapeHtml = (text: string): string => {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
};
```

### Secure Storage
```typescript
// Encrypted local storage
export class SecureStorage {
  private key: string;

  constructor() {
    this.key = generateEncryptionKey();
  }

  set(key: string, value: any): void {
    const encrypted = encrypt(JSON.stringify(value), this.key);
    localStorage.setItem(key, encrypted);
  }

  get(key: string): any {
    const encrypted = localStorage.getItem(key);
    if (!encrypted) return null;
    
    const decrypted = decrypt(encrypted, this.key);
    return JSON.parse(decrypted);
  }
}
```

## 🎯 Performance Optimization

### Bundle Optimization
```typescript
// Vite configuration for optimal bundling
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          router: ['react-router-dom'],
          ui: ['@headlessui/react', '@heroicons/react']
        }
      }
    },
    chunkSizeWarningLimit: 1000
  }
});
```

### Service Worker Caching
```typescript
// Advanced caching strategy
const cacheStrategy = {
  'api-calls': new NetworkFirst({
    cacheName: 'api-cache',
    networkTimeoutSeconds: 3,
    cacheableResponse: { statuses: [0, 200] }
  }),
  'static-assets': new CacheFirst({
    cacheName: 'static-cache',
    cacheableResponse: { statuses: [0, 200] }
  })
};
```

## 🐛 Debugging

### Browser DevTools Integration
```typescript
// Development debugging utilities
if (process.env.NODE_ENV === 'development') {
  (window as any).__AUTOTEST_DEBUG__ = {
    getCurrentTest: () => useTestStore.getState().currentTest,
    getExecutions: () => useExecutionStore.getState().executions,
    triggerRecording: () => recordingService.start()
  };
}
```

### Logging Configuration
```typescript
// Structured logging
export const logger = {
  debug: (message: string, data?: any) => {
    console.debug(`[DEBUG] ${message}`, data);
  },
  info: (message: string, data?: any) => {
    console.info(`[INFO] ${message}`, data);
  },
  error: (message: string, error?: Error) => {
    console.error(`[ERROR] ${message}`, error);
  }
};
```

## 📚 Contributing

### Code Style
- **ESLint**: Enforced linting rules
- **Prettier**: Automatic code formatting
- **TypeScript**: Strict type checking
- **Conventional Commits**: Standardized commit messages

### Pull Request Process
1. **Fork** the repository
2. **Create** feature branch from `develop`
3. **Write** tests for new functionality
4. **Ensure** all tests pass
5. **Submit** pull request with description

### Development Workflow
```bash
# Feature development
git checkout -b feature/new-feature
git commit -m "feat: add new recording feature"
git push origin feature/new-feature

# Testing
npm run test:all
npm run lint:fix
npm run type-check

# Pull request
gh pr create --title "feat: add new recording feature"
```

---

## 📖 Additional Resources

- **API Documentation**: [https://api.autotest-pro.dev/docs](https://api.autotest-pro.dev/docs)
- **Component Storybook**: [https://storybook.autotest-pro.dev](https://storybook.autotest-pro.dev)
- **Code Coverage**: [https://coverage.autotest-pro.dev](https://coverage.autotest-pro.dev)
- **Performance Monitoring**: [https://performance.autotest-pro.dev](https://performance.autotest-pro.dev)

*This documentation is continuously updated. For the latest information, visit our [documentation site](https://docs.autotest-pro.dev).*