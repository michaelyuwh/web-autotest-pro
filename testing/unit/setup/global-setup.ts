/**
 * Global setup for Jest tests
 * Runs once before all tests
 */

export default async function globalSetup() {
  // Set timezone for consistent date testing
  process.env.TZ = 'UTC';
  
  // Set test environment variables
  process.env.NODE_ENV = 'test';
  process.env.REACT_APP_API_URL = 'http://localhost:8000';
  process.env.REACT_APP_WS_URL = 'ws://localhost:8000';
  
  console.log('🧪 Global test setup completed');
}