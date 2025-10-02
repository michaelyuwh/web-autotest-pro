/**
 * Global teardown for Jest tests
 * Runs once after all tests complete
 */

export default async function globalTeardown() {
  // Cleanup any global resources
  console.log('🧹 Global test teardown completed');
}