# Test Data and Fixtures for Web AutoTest Pro

This directory contains test data, mock files, and fixtures used across the testing suite.

## Directory Structure

```
fixtures/
├── test-cases/          # Sample test case definitions
├── form-data/          # Form input test data  
├── api-responses/      # Mock API response data
├── screenshots/        # Sample screenshot files
├── videos/            # Sample video recordings
├── export-files/      # Sample export/import files
└── error-scenarios/   # Error condition test data
```

## Test Cases (test-cases/)

Contains JSON files with complete test case definitions for use in integration and E2E tests.

### basic-click-test.json
Simple test case with navigation and click actions.

### form-submission-test.json  
Test case demonstrating form filling and submission workflow.

### multi-step-navigation.json
Complex test case with multiple page navigation and interactions.

### error-handling-test.json
Test case designed to trigger various error conditions.

## Form Data (form-data/)

Contains realistic form data for testing input scenarios.

### user-profiles.json
Sample user profile data with various field combinations.

### search-queries.json
Common search terms and queries for testing search functionality.

### validation-data.json
Data sets for testing form validation (valid/invalid inputs).

## API Responses (api-responses/)

Mock API responses for testing without external dependencies.

### test-cases-list.json
Mock response for test case listing API.

### execution-results.json
Sample test execution results and reports.

### sync-data.json
Mock data for cross-device synchronization testing.

## Screenshots (screenshots/)

Sample screenshot files in various formats for testing screenshot functionality.

- sample-desktop-1920x1080.png
- sample-mobile-375x667.png
- sample-tablet-768x1024.png
- error-screenshot.png

## Videos (videos/)

Sample video files for testing video recording and playback features.

- sample-test-recording.webm
- mobile-test-session.mp4
- error-scenario-recording.webm

## Export Files (export-files/)

Sample export/import files for testing data portability.

### selenium-export.py
Sample Selenium script export format.

### playwright-export.js
Sample Playwright script export format.

### test-suite-backup.json
Complete test suite backup format.

## Error Scenarios (error-scenarios/)

Test data designed to trigger various error conditions and edge cases.

### network-errors.json
Simulated network error responses.

### invalid-selectors.json
Test cases with invalid CSS/XPath selectors.

### timeout-scenarios.json
Test cases designed to trigger timeout conditions.

## Usage in Tests

```javascript
// Load test fixture data
import testCase from '../fixtures/test-cases/basic-click-test.json';
import userData from '../fixtures/form-data/user-profiles.json';

// Use in test
it('should execute basic click test', async () => {
  const result = await executeTest(testCase);
  expect(result.status).toBe('passed');
});
```

## Data Generation

Test data is generated using realistic patterns and includes:

- Valid and invalid input combinations
- Edge cases and boundary conditions  
- Localized data for internationalization testing
- Performance testing data sets
- Security testing payloads (sanitized)

## Maintenance

- Update test data regularly to reflect real-world scenarios
- Validate data integrity with schema validation
- Keep file sizes reasonable for CI/CD performance
- Document any special data requirements or constraints