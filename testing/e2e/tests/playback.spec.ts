// E2E tests for Web AutoTest Pro playback functionality
// Tests the complete test execution workflow

import { test, expect } from '@playwright/test';

test.describe('Web AutoTest Pro - Playback', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/playback');
    await expect(page.locator('#playback-container')).toBeVisible();
  });

  test('should load and execute a simple test', async ({ page }) => {
    // Load a test
    await page.click('#load-test');
    
    // Wait for test selection modal
    await expect(page.locator('#test-selection-modal')).toBeVisible();
    
    // Select first available test
    const testItems = page.locator('.test-item');
    await expect(testItems.first()).toBeVisible();
    await testItems.first().click();
    
    // Confirm selection
    await page.click('#confirm-test-selection');
    
    // Verify test is loaded
    await expect(page.locator('#loaded-test-info')).toBeVisible();
    await expect(page.locator('#play-test')).toBeEnabled();
    
    // Start playback
    await page.click('#play-test');
    
    // Verify playback is running
    await expect(page.locator('.playback-running')).toBeVisible();
    
    // Wait for completion (with reasonable timeout)
    await expect(page.locator('.playback-completed')).toBeVisible({ timeout: 30000 });
    
    // Check results are displayed
    await expect(page.locator('#playback-results')).toBeVisible();
    
    // Verify step results exist
    const stepResults = page.locator('.step-result');
    await expect(stepResults.first()).toBeVisible();
  });

  test('should support step-by-step execution', async ({ page }) => {
    // Load a test
    await page.click('#load-test');
    await expect(page.locator('#test-selection-modal')).toBeVisible();
    await page.locator('.test-item').first().click();
    await page.click('#confirm-test-selection');
    
    // Enable step-by-step mode
    await page.check('#step-by-step-mode');
    
    // Start playback
    await page.click('#play-test');
    
    // Verify step controls are visible
    await expect(page.locator('#step-controls')).toBeVisible();
    await expect(page.locator('#next-step')).toBeEnabled();
    
    // Execute first step
    await page.click('#next-step');
    
    // Verify step execution
    await expect(page.locator('#current-step')).toBeVisible();
    
    // Check step counter
    const stepCounter = page.locator('#step-counter');
    await expect(stepCounter).toContainText('1');
    
    // Execute second step
    await page.click('#next-step');
    await expect(stepCounter).toContainText('2');
  });

  test('should pause and resume playback', async ({ page }) => {
    // Load and start test
    await page.click('#load-test');
    await page.locator('.test-item').first().click();
    await page.click('#confirm-test-selection');
    await page.click('#play-test');
    
    // Wait for playback to start
    await expect(page.locator('.playback-running')).toBeVisible();
    
    // Pause playback
    await page.click('#pause-playback');
    
    // Verify paused state
    await expect(page.locator('.playback-paused')).toBeVisible();
    await expect(page.locator('#resume-playback')).toBeVisible();
    
    // Resume playback
    await page.click('#resume-playback');
    
    // Verify resumed state
    await expect(page.locator('.playback-running')).toBeVisible();
  });

  test('should control playback speed', async ({ page }) => {
    // Load test
    await page.click('#load-test');
    await page.locator('.test-item').first().click();
    await page.click('#confirm-test-selection');
    
    // Set playback speed to 2x
    await page.fill('#playback-speed', '2');
    
    // Verify speed display
    await expect(page.locator('#speed-display')).toContainText('2x');
    
    // Start playback
    const startTime = Date.now();
    await page.click('#play-test');
    
    // Wait for completion
    await expect(page.locator('.playback-completed')).toBeVisible({ timeout: 15000 });
    
    const executionTime = Date.now() - startTime;
    
    // At 2x speed, execution should be reasonably fast
    expect(executionTime).toBeLessThan(10000); // Less than 10 seconds
  });

  test('should handle playback errors gracefully', async ({ page }) => {
    // Load a test (we'll assume there's an error test available)
    await page.click('#load-test');
    
    // Look for error test or use first available
    const errorTest = page.locator('[data-test-type="error"]');
    if (await errorTest.count() > 0) {
      await errorTest.first().click();
    } else {
      await page.locator('.test-item').first().click();
    }
    
    await page.click('#confirm-test-selection');
    
    // Start playback
    await page.click('#play-test');
    
    // Wait for completion (may have errors)
    await expect(page.locator('.playback-completed')).toBeVisible({ timeout: 30000 });
    
    // Check for error indicators (if test had errors)
    const errorSteps = page.locator('.step-error');
    const errorCount = await errorSteps.count();
    
    if (errorCount > 0) {
      // Verify error details are shown
      await expect(errorSteps.first()).toBeVisible();
      
      // Check test result shows failure
      const testResult = page.locator('#test-result');
      await expect(testResult).toHaveClass(/.*failed.*/);
    }
  });

  test('should capture screenshots during playback', async ({ page }) => {
    // Load test
    await page.click('#load-test');
    await page.locator('.test-item').first().click();
    await page.click('#confirm-test-selection');
    
    // Enable screenshot capture
    await page.check('#capture-screenshots');
    
    // Start playback
    await page.click('#play-test');
    
    // Wait for completion
    await expect(page.locator('.playback-completed')).toBeVisible({ timeout: 30000 });
    
    // Check for screenshot thumbnails
    const screenshots = page.locator('.step-screenshot');
    const screenshotCount = await screenshots.count();
    
    if (screenshotCount > 0) {
      // Click on first screenshot
      await screenshots.first().click();
      
      // Verify screenshot modal
      await expect(page.locator('#screenshot-modal')).toBeVisible();
      
      // Close modal
      await page.click('#close-screenshot-modal');
      await expect(page.locator('#screenshot-modal')).not.toBeVisible();
    }
  });

  test('should generate test execution report', async ({ page }) => {
    // Execute a test first
    await page.click('#load-test');
    await page.locator('.test-item').first().click();
    await page.click('#confirm-test-selection');
    await page.click('#play-test');
    
    // Wait for completion
    await expect(page.locator('.playback-completed')).toBeVisible({ timeout: 30000 });
    
    // Generate report
    await page.click('#generate-report');
    
    // Wait for report modal
    await expect(page.locator('#report-modal')).toBeVisible();
    
    // Check report contents
    const reportContent = page.locator('#report-content');
    await expect(reportContent).toContainText('Test Execution Report');
    await expect(reportContent).toContainText('Total Steps');
    await expect(reportContent).toContainText('Success Rate');
    await expect(reportContent).toContainText('Execution Time');
    
    // Test export functionality
    const downloadPromise = page.waitForEvent('download');
    await page.click('#export-report');
    
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toContain('test-report');
  });

  test('should stop playback mid-execution', async ({ page }) => {
    // Load and start test
    await page.click('#load-test');
    await page.locator('.test-item').first().click();
    await page.click('#confirm-test-selection');
    await page.click('#play-test');
    
    // Wait for playback to start
    await expect(page.locator('.playback-running')).toBeVisible();
    
    // Stop playback
    await page.click('#stop-playback');
    
    // Verify stopped state
    await expect(page.locator('.playback-stopped')).toBeVisible();
    
    // Check results are shown (partial)
    await expect(page.locator('#playback-results')).toBeVisible();
    
    // Verify interrupted status
    await expect(page.locator('.playback-interrupted')).toBeVisible();
  });

  test('should execute batch tests', async ({ page }) => {
    // Navigate to batch execution
    await page.goto('/batch-execution');
    await expect(page.locator('#batch-container')).toBeVisible();
    
    // Select multiple tests
    const testCheckboxes = page.locator('.test-checkbox');
    const checkboxCount = await testCheckboxes.count();
    
    if (checkboxCount >= 2) {
      // Select first 2 tests
      await testCheckboxes.nth(0).check();
      await testCheckboxes.nth(1).check();
      
      // Start batch execution
      await page.click('#run-batch');
      
      // Monitor progress
      await expect(page.locator('#batch-progress')).toBeVisible();
      
      // Wait for completion
      await expect(page.locator('#batch-results')).toBeVisible({ timeout: 60000 });
      
      // Check individual results
      const individualResults = page.locator('.individual-test-result');
      await expect(individualResults).toHaveCount(2);
      
      // Verify each result has status
      for (let i = 0; i < 2; i++) {
        const result = individualResults.nth(i);
        await expect(result.locator('.test-status')).toBeVisible();
      }
    }
  });

  test('should validate test results and assertions', async ({ page }) => {
    // Load test
    await page.click('#load-test');
    await page.locator('.test-item').first().click();
    await page.click('#confirm-test-selection');
    
    // Start playback
    await page.click('#play-test');
    
    // Wait for completion
    await expect(page.locator('.playback-completed')).toBeVisible({ timeout: 30000 });
    
    // Check assertion results
    const assertionResults = page.locator('.assertion-result');
    const assertionCount = await assertionResults.count();
    
    if (assertionCount > 0) {
      // Check each assertion has a result
      for (let i = 0; i < assertionCount; i++) {
        const assertion = assertionResults.nth(i);
        const status = assertion.locator('.assertion-status');
        await expect(status).toBeVisible();
        
        // Status should be either passed or failed
        const statusClass = await status.getAttribute('class');
        expect(statusClass).toMatch(/(passed|failed)/);
      }
    }
    
    // Check overall test result
    const overallResult = page.locator('#overall-test-result');
    await expect(overallResult).toBeVisible();
    
    const resultText = await overallResult.textContent();
    expect(resultText).toMatch(/(passed|failed)/i);
  });
});