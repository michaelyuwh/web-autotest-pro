# Test Execution Engine

The Test Execution Engine is a core component of Web AutoTest Pro that provides cross-browser test automation using Playwright. It enables running automated tests with comprehensive reporting, screenshot capture, and real-time monitoring.

## Architecture

### Components

1. **PlaywrightExecutor** (`services/playwrightExecutor.ts`)
   - Core execution engine using Playwright
   - Supports Chrome, Firefox, and Safari (WebKit)
   - Handles action execution, assertions, and error recovery
   - Captures screenshots and videos
   - Provides real-time execution feedback

2. **TestExecutionService** (`services/testExecutionService.ts`)
   - High-level service managing test execution lifecycle
   - Integrates with React app state management
   - Provides hooks for UI components
   - Handles multiple concurrent executions
   - Manages cleanup and resource disposal

3. **TestExecution Component** (`components/TestExecution.tsx`)
   - React UI for test execution control
   - Real-time execution monitoring
   - Configuration options (browser, viewport, options)
   - Visual progress tracking
   - Results display and analysis

4. **Execution Page** (`components/pages/Execution.tsx`)
   - Main execution interface
   - Test case selection sidebar
   - Integrated execution controls
   - Execution history and status

## Features

### Cross-Browser Support
- **Chromium**: Google Chrome, Microsoft Edge
- **Firefox**: Mozilla Firefox
- **WebKit**: Safari (macOS)

### Execution Options
- **Headless/Headed**: Run with or without browser UI
- **Viewport Control**: Desktop, tablet, mobile viewports
- **Speed Control**: Slow motion for debugging
- **Media Capture**: Screenshots and video recording
- **Timeout Management**: Configurable per-action timeouts

### Action Types
- **Navigation**: Go to URLs, handle redirects
- **Interaction**: Click, type, hover, scroll
- **Waiting**: Wait for elements, timeouts
- **Assertions**: Verify element state, text, values
- **Screenshots**: Capture page state
- **Keyboard**: Key presses, shortcuts

### Real-time Monitoring
- **Progress Tracking**: Step-by-step execution progress
- **Status Updates**: Running, passed, failed, cancelled
- **Error Reporting**: Detailed error messages and stack traces
- **Performance Metrics**: Execution time, step duration
- **Visual Feedback**: Screenshots on each step and failure

## Usage

### Basic Test Execution

```typescript
import { useTestExecution } from '../services/testExecutionService';

const MyComponent = () => {
  const { executeTest, executions } = useTestExecution();

  const runTest = async (testCase: TestCase) => {
    try {
      const execution = await executeTest(testCase, {
        browser: 'chromium',
        headless: false,
        screenshots: true,
        slowMotion: 500
      });
      console.log('Test completed:', execution.status);
    } catch (error) {
      console.error('Test failed:', error);
    }
  };
};
```

### Execution Options

```typescript
const executionOptions: ExecutionOptions = {
  browser: 'chromium' | 'firefox' | 'webkit',
  headless: false,
  viewport: { width: 1280, height: 720 },
  timeout: 30000,
  screenshots: true,
  video: false,
  slowMotion: 200
};
```

### Multiple Test Execution

```typescript
const runMultipleTests = async (testCases: TestCase[]) => {
  const executions = await executeMultipleTests(testCases, {
    browser: 'chromium',
    screenshots: true
  });
  
  executions.forEach(execution => {
    console.log(`${execution.testCaseId}: ${execution.status}`);
  });
};
```

## Test Case Structure

Test cases follow the shared type definitions:

```typescript
interface TestCase {
  id: string;
  name: string;
  description: string;
  url: string;
  steps: TestAction[];
  // ... other properties
}

interface TestAction {
  id: string;
  type: ActionType;
  selector?: string;
  value?: string;
  url?: string;
  assertion?: {
    type: 'visible' | 'hidden' | 'text' | 'value' | 'count';
    value?: string;
  };
  // ... other properties
}
```

## Error Handling

The execution engine provides comprehensive error handling:

### Action-Level Errors
- **Selector Not Found**: Element doesn't exist or isn't visible
- **Timeout Errors**: Action took too long to complete
- **Assertion Failures**: Expected vs actual value mismatches
- **Network Errors**: Page navigation failures

### Execution-Level Errors
- **Browser Launch Failures**: Browser couldn't be started
- **Page Crashes**: Browser page became unresponsive
- **Resource Exhaustion**: Out of memory or other system limits

### Recovery Strategies
- **Critical vs Non-Critical**: Continue execution for non-critical failures
- **Retry Logic**: Automatic retry for transient failures
- **Graceful Degradation**: Partial execution results when possible
- **Screenshot Capture**: Evidence collection on failures

## Performance Considerations

### Resource Management
- **Browser Lifecycle**: Proper cleanup of browser instances
- **Memory Usage**: Monitoring and limits for large test suites
- **Concurrent Execution**: Controlled parallelism to prevent resource exhaustion

### Optimization Features
- **Selector Caching**: Reuse element selections when possible
- **Page Preloading**: Optimize navigation for test suites
- **Media Compression**: Efficient storage of screenshots and videos

## Integration Points

### State Management
- Zustand store integration for UI updates
- Real-time execution status synchronization
- Persistent execution history

### AI Integration
- Execution failure analysis
- Test optimization suggestions
- Smart retry strategies
- Pattern recognition for flaky tests

### Reporting
- Detailed execution reports
- Export capabilities (PDF, JSON, CSV)
- Screenshot and video attachments
- Performance analytics

## Development

### Adding New Action Types

1. Update `ActionType` enum in shared types
2. Implement action handler in `PlaywrightExecutor.executeAction()`
3. Add UI controls in `TestExecution` component
4. Update documentation and examples

### Browser Support Extension

1. Add browser configuration to `ExecutionOptions`
2. Implement browser launch logic in `PlaywrightExecutor.initialize()`
3. Update UI browser selection
4. Test cross-platform compatibility

### Custom Assertions

1. Extend assertion type definitions
2. Implement assertion logic in `executeAssertion()`
3. Add UI configuration options
4. Provide helper utilities for common patterns

## Future Enhancements

- **Cloud Execution**: Remote browser execution
- **Mobile Testing**: Real device integration
- **Visual Testing**: Screenshot comparison
- **Load Testing**: Performance and stress testing
- **API Testing**: REST/GraphQL endpoint testing
- **Database Validation**: Data integrity checks
- **Accessibility Testing**: WCAG compliance checks

## Sample Test Cases

The engine includes sample test cases for demonstration:

1. **Google Search Test**: Basic search functionality
2. **GitHub Login Test**: Form validation and UI elements
3. **React Documentation Test**: Navigation and content verification

These samples demonstrate various action types, assertion patterns, and common testing scenarios.