# Web AutoTest Pro - API Documentation

## 🌐 Overview

The Web AutoTest Pro API provides comprehensive endpoints for test automation, real-time synchronization, and cross-platform integration. This RESTful API supports JSON requests/responses and WebSocket connections for real-time features.

**Base URL**: `https://api.autotest-pro.dev/v1`  
**WebSocket URL**: `wss://api.autotest-pro.dev/ws`

## 🔐 Authentication

### JWT Token Authentication
All API requests require authentication via JWT tokens in the Authorization header.

```http
Authorization: Bearer <jwt_token>
```

### Authentication Endpoints

#### Login
```http
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securepassword"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user_123",
      "email": "user@example.com",
      "name": "John Doe",
      "role": "user"
    },
    "tokens": {
      "access": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "refresh": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "expiresIn": 3600
    }
  }
}
```

#### Register
```http
POST /auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securepassword",
  "name": "John Doe"
}
```

#### Refresh Token
```http
POST /auth/refresh
Content-Type: application/json

{
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### Logout
```http
POST /auth/logout
Authorization: Bearer <jwt_token>
```

## 🧪 Test Cases API

### List Test Cases
```http
GET /test-cases
Authorization: Bearer <jwt_token>

Query Parameters:
- page: number (default: 1)
- limit: number (default: 20)
- search: string (optional)
- status: string (optional: active, archived)
- tags: string[] (optional)
```

**Response**:
```json
{
  "success": true,
  "data": {
    "testCases": [
      {
        "id": "tc_123",
        "name": "Login Flow Test",
        "description": "Tests user login functionality",
        "status": "active",
        "steps": [...],
        "tags": ["authentication", "critical"],
        "created": "2024-01-15T10:30:00Z",
        "updated": "2024-01-16T14:20:00Z",
        "metadata": {
          "browser": "chrome",
          "viewport": { "width": 1920, "height": 1080 }
        }
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 45,
      "pages": 3
    }
  }
}
```

### Get Test Case
```http
GET /test-cases/{testCaseId}
Authorization: Bearer <jwt_token>
```

**Response**:
```json
{
  "success": true,
  "data": {
    "id": "tc_123",
    "name": "Login Flow Test",
    "description": "Tests user login functionality",
    "steps": [
      {
        "id": "step_1",
        "type": "navigate",
        "url": "https://example.com/login",
        "timeout": 5000,
        "description": "Navigate to login page"
      },
      {
        "id": "step_2",
        "type": "input",
        "selector": "#email",
        "value": "test@example.com",
        "timeout": 2000,
        "description": "Enter email address"
      },
      {
        "id": "step_3",
        "type": "click",
        "selector": "#login-button",
        "timeout": 3000,
        "description": "Click login button"
      },
      {
        "id": "step_4",
        "type": "assert",
        "assertion": "url",
        "expected": "https://example.com/dashboard",
        "timeout": 5000,
        "description": "Verify redirect to dashboard"
      }
    ],
    "metadata": {
      "browser": "chrome",
      "viewport": { "width": 1920, "height": 1080 },
      "userAgent": "Mozilla/5.0...",
      "recordingDate": "2024-01-15T10:30:00Z"
    }
  }
}
```

### Create Test Case
```http
POST /test-cases
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "name": "New Test Case",
  "description": "Description of the test case",
  "steps": [
    {
      "type": "navigate",
      "url": "https://example.com",
      "timeout": 5000,
      "description": "Navigate to homepage"
    }
  ],
  "tags": ["smoke", "regression"],
  "metadata": {
    "browser": "chrome",
    "viewport": { "width": 1920, "height": 1080 }
  }
}
```

### Update Test Case
```http
PUT /test-cases/{testCaseId}
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "name": "Updated Test Case Name",
  "description": "Updated description",
  "steps": [...],
  "tags": ["updated-tag"]
}
```

### Delete Test Case
```http
DELETE /test-cases/{testCaseId}
Authorization: Bearer <jwt_token>
```

## 🏃 Test Execution API

### Start Execution
```http
POST /executions
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "testCaseId": "tc_123",
  "options": {
    "browser": "chrome",
    "headless": false,
    "viewport": { "width": 1920, "height": 1080 },
    "timeout": 30000,
    "screenshots": true,
    "video": true,
    "parallel": false
  }
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "executionId": "exec_456",
    "status": "running",
    "testCaseId": "tc_123",
    "startTime": "2024-01-16T15:30:00Z",
    "options": {
      "browser": "chrome",
      "headless": false,
      "screenshots": true,
      "video": true
    }
  }
}
```

### Get Execution Status
```http
GET /executions/{executionId}
Authorization: Bearer <jwt_token>
```

**Response**:
```json
{
  "success": true,
  "data": {
    "id": "exec_456",
    "testCaseId": "tc_123",
    "status": "completed",
    "result": "passed",
    "startTime": "2024-01-16T15:30:00Z",
    "endTime": "2024-01-16T15:32:15Z",
    "duration": 135000,
    "currentStep": 4,
    "totalSteps": 4,
    "steps": [
      {
        "id": "step_1",
        "status": "passed",
        "startTime": "2024-01-16T15:30:00Z",
        "endTime": "2024-01-16T15:30:03Z",
        "duration": 3000,
        "screenshot": "https://screenshots.autotest-pro.dev/exec_456/step_1.png",
        "error": null
      }
    ],
    "screenshots": [
      "https://screenshots.autotest-pro.dev/exec_456/step_1.png",
      "https://screenshots.autotest-pro.dev/exec_456/step_2.png"
    ],
    "video": "https://videos.autotest-pro.dev/exec_456/recording.mp4",
    "logs": [
      {
        "level": "info",
        "message": "Starting test execution",
        "timestamp": "2024-01-16T15:30:00Z"
      }
    ]
  }
}
```

### Stop Execution
```http
POST /executions/{executionId}/stop
Authorization: Bearer <jwt_token>
```

### List Executions
```http
GET /executions
Authorization: Bearer <jwt_token>

Query Parameters:
- page: number (default: 1)
- limit: number (default: 20)
- status: string (running, completed, failed, cancelled)
- testCaseId: string (optional)
- dateFrom: string (ISO date, optional)
- dateTo: string (ISO date, optional)
```

## 📊 Analytics API

### Execution Statistics
```http
GET /analytics/executions
Authorization: Bearer <jwt_token>

Query Parameters:
- period: string (day, week, month, year)
- dateFrom: string (ISO date)
- dateTo: string (ISO date)
```

**Response**:
```json
{
  "success": true,
  "data": {
    "summary": {
      "totalExecutions": 1250,
      "passedExecutions": 1100,
      "failedExecutions": 150,
      "successRate": 88.0,
      "averageDuration": 45.5
    },
    "trends": [
      {
        "date": "2024-01-16",
        "executions": 45,
        "passed": 40,
        "failed": 5,
        "successRate": 88.9
      }
    ]
  }
}
```

### Test Case Performance
```http
GET /analytics/test-cases/{testCaseId}/performance
Authorization: Bearer <jwt_token>
```

**Response**:
```json
{
  "success": true,
  "data": {
    "testCaseId": "tc_123",
    "performance": {
      "averageDuration": 42.3,
      "minDuration": 38.1,
      "maxDuration": 58.7,
      "successRate": 92.5,
      "totalExecutions": 156,
      "recentTrend": "stable"
    },
    "stepPerformance": [
      {
        "stepId": "step_1",
        "averageDuration": 3.2,
        "failureRate": 2.1
      }
    ]
  }
}
```

## 🔄 WebSocket API

### Connection
```javascript
const socket = new WebSocket('wss://api.autotest-pro.dev/ws');

// Authentication after connection
socket.onopen = () => {
  socket.send(JSON.stringify({
    type: 'authenticate',
    token: 'your_jwt_token'
  }));
};
```

### Event Types

#### Subscribe to Execution Updates
```javascript
// Client to Server
socket.send(JSON.stringify({
  type: 'subscribe',
  channel: 'executions',
  executionId: 'exec_456' // optional, for specific execution
}));
```

#### Execution Status Updates
```javascript
// Server to Client
{
  "type": "execution-update",
  "data": {
    "executionId": "exec_456",
    "status": "running",
    "currentStep": 2,
    "totalSteps": 4,
    "stepResult": {
      "stepId": "step_2",
      "status": "completed",
      "duration": 2500,
      "screenshot": "https://screenshots.autotest-pro.dev/exec_456/step_2.png"
    }
  }
}
```

#### Real-time Logs
```javascript
// Server to Client
{
  "type": "execution-log",
  "data": {
    "executionId": "exec_456",
    "log": {
      "level": "info",
      "message": "Element found: #login-button",
      "timestamp": "2024-01-16T15:30:45Z",
      "stepId": "step_2"
    }
  }
}
```

#### Test Case Creation/Updates
```javascript
// Server to Client
{
  "type": "test-case-update",
  "data": {
    "action": "created", // created, updated, deleted
    "testCase": {
      "id": "tc_789",
      "name": "New Test Case",
      "status": "active"
    }
  }
}
```

## 🛠️ Browser Extension API

### Recording Control
```http
POST /extension/recording/start
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "url": "https://example.com",
  "options": {
    "captureScreenshots": true,
    "recordNetworkRequests": false,
    "recordConsoleMessages": true
  }
}
```

### Element Selection
```http
POST /extension/elements/capture
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "selector": "#login-button",
  "action": "click",
  "coordinates": { "x": 150, "y": 75 },
  "element": {
    "tagName": "BUTTON",
    "attributes": {
      "id": "login-button",
      "class": "btn btn-primary"
    },
    "textContent": "Login"
  }
}
```

## 📱 Mobile App API

### Device Registration
```http
POST /mobile/devices/register
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "deviceId": "device_123",
  "deviceInfo": {
    "platform": "android",
    "version": "13",
    "model": "Pixel 7",
    "appVersion": "1.0.0"
  },
  "pushToken": "firebase_push_token"
}
```

### Sync Test Cases
```http
GET /mobile/sync/test-cases
Authorization: Bearer <jwt_token>

Query Parameters:
- lastSync: string (ISO date, optional)
- deviceId: string
```

## 🔧 Configuration API

### User Preferences
```http
GET /config/preferences
Authorization: Bearer <jwt_token>
```

**Response**:
```json
{
  "success": true,
  "data": {
    "theme": "dark",
    "defaultBrowser": "chrome",
    "autoScreenshots": true,
    "defaultTimeout": 5000,
    "notifications": {
      "email": true,
      "push": true,
      "desktop": false
    }
  }
}
```

### Update Preferences
```http
PUT /config/preferences
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "theme": "light",
  "defaultBrowser": "firefox",
  "autoScreenshots": false
}
```

## 📈 Rate Limiting

The API implements rate limiting to ensure fair usage:

- **Authentication endpoints**: 10 requests per minute
- **Test execution**: 50 requests per hour
- **General API**: 1000 requests per hour
- **WebSocket connections**: 10 concurrent connections per user

Rate limit headers are included in responses:
```http
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1642345200
```

## 🚨 Error Handling

### Error Response Format
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request parameters",
    "details": {
      "field": "email",
      "reason": "Invalid email format"
    },
    "timestamp": "2024-01-16T15:30:00Z"
  }
}
```

### Common Error Codes
- `AUTHENTICATION_REQUIRED`: Missing or invalid authentication
- `AUTHORIZATION_FAILED`: Insufficient permissions
- `VALIDATION_ERROR`: Invalid request data
- `RESOURCE_NOT_FOUND`: Requested resource doesn't exist
- `RATE_LIMIT_EXCEEDED`: Too many requests
- `INTERNAL_ERROR`: Server-side error
- `SERVICE_UNAVAILABLE`: Service temporarily unavailable

## 🔍 SDK Examples

### JavaScript/TypeScript SDK
```typescript
import { AutoTestProAPI } from '@autotest-pro/sdk';

const api = new AutoTestProAPI({
  baseURL: 'https://api.autotest-pro.dev/v1',
  token: 'your_jwt_token'
});

// Create test case
const testCase = await api.testCases.create({
  name: 'My Test',
  steps: [
    { type: 'navigate', url: 'https://example.com' },
    { type: 'click', selector: '#button' }
  ]
});

// Execute test
const execution = await api.executions.start(testCase.id, {
  browser: 'chrome',
  screenshots: true
});

// Monitor execution
api.ws.subscribe('executions', execution.id, (update) => {
  console.log('Execution update:', update);
});
```

### Python SDK
```python
from autotest_pro import AutoTestProClient

client = AutoTestProClient(
    base_url='https://api.autotest-pro.dev/v1',
    token='your_jwt_token'
)

# Create test case
test_case = client.test_cases.create({
    'name': 'My Test',
    'steps': [
        {'type': 'navigate', 'url': 'https://example.com'},
        {'type': 'click', 'selector': '#button'}
    ]
})

# Execute test
execution = client.executions.start(test_case['id'], {
    'browser': 'chrome',
    'screenshots': True
})
```

## 📚 Additional Resources

- **Postman Collection**: [Download API Collection](https://api.autotest-pro.dev/postman)
- **OpenAPI Specification**: [https://api.autotest-pro.dev/openapi.json](https://api.autotest-pro.dev/openapi.json)
- **SDK Documentation**: [https://docs.autotest-pro.dev/sdks](https://docs.autotest-pro.dev/sdks)
- **WebSocket Documentation**: [https://docs.autotest-pro.dev/websockets](https://docs.autotest-pro.dev/websockets)

---

*API Version: v1.0.0 | Last Updated: January 2024*