// E2E tests for Web AutoTest Pro recorder functionality
// Tests the complete user workflow for recording web interactions

import { test, expect } from '@playwright/test';

test.describe('Web AutoTest Pro - Recorder', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/recorder');
    await expect(page.locator('#recorder-container')).toBeVisible();
  });

  test('should start recording session', async ({ page }) => {
    // Click start recording button
    await page.click('#start-recording');
    
    // Verify recording status indicator
    await expect(page.locator('.recording-active')).toBeVisible();
    
    // Verify recording controls are visible
    await expect(page.locator('#stop-recording')).toBeVisible();
    await expect(page.locator('#pause-recording')).toBeVisible();
    
    // Verify recording controls are enabled
    await expect(page.locator('#stop-recording')).toBeEnabled();
    await expect(page.locator('#pause-recording')).toBeEnabled();
  });

  test('should record click interactions', async ({ page, context }) => {
    // Start recording
    await page.click('#start-recording');
    await expect(page.locator('.recording-active')).toBeVisible();
    
    // Open new tab for test page
    const testPage = await context.newPage();
    await testPage.goto('/test-page');
    
    // Click on test elements
    await testPage.click('#test-button');
    await testPage.click('#secondary-button');
    
    // Go back to recorder
    await page.bringToFront();
    
    // Stop recording
    await page.click('#stop-recording');
    
    // Verify recorded actions
    const recordedActions = page.locator('.recorded-action[data-type="click"]');
    await expect(recordedActions).toHaveCount(2);
    
    // Verify action details
    const firstAction = recordedActions.first();
    const actionData = await firstAction.getAttribute('data-action');
    const parsedAction = JSON.parse(actionData);
    
    expect(parsedAction.type).toBe('click');
    expect(parsedAction.selector).toContain('test-button');
    expect(parsedAction.timestamp).toBeDefined();
  });

  test('should record form input', async ({ page, context }) => {
    // Start recording
    await page.click('#start-recording');
    
    // Open test form
    const testPage = await context.newPage();
    await testPage.goto('/test-form');
    
    // Fill form fields
    await testPage.fill('#username', 'testuser123');
    await testPage.fill('#password', 'secretpass');
    await testPage.fill('#email', 'test@example.com');
    
    // Submit form
    await testPage.click('#submit-form');
    
    // Go back to recorder and stop
    await page.bringToFront();
    await page.click('#stop-recording');
    
    // Verify recorded input actions
    const inputActions = page.locator('.recorded-action[data-type="input"]');
    await expect(inputActions).toHaveCount(3);
    
    // Verify form submission was recorded
    const submitActions = page.locator('.recorded-action[data-type="click"]');
    await expect(submitActions).toHaveCount(1);
  });

  test('should record navigation between pages', async ({ page, context }) => {
    // Start recording
    await page.click('#start-recording');
    
    // Navigate through multiple pages
    const testPage = await context.newPage();
    await testPage.goto('/page1');
    await testPage.waitForLoadState('networkidle');
    
    await testPage.goto('/page2');
    await testPage.waitForLoadState('networkidle');
    
    await testPage.goto('/page3');
    await testPage.waitForLoadState('networkidle');
    
    // Go back to recorder and stop
    await page.bringToFront();
    await page.click('#stop-recording');
    
    // Verify navigation actions
    const navActions = page.locator('.recorded-action[data-type="navigate"]');
    await expect(navActions).toHaveCount(3);
    
    // Verify navigation URLs
    const navData = await navActions.allTextContents();
    expect(navData.some(text => text.includes('page1'))).toBeTruthy();
    expect(navData.some(text => text.includes('page2'))).toBeTruthy();
    expect(navData.some(text => text.includes('page3'))).toBeTruthy();
  });

  test('should pause and resume recording', async ({ page, context }) => {
    // Start recording
    await page.click('#start-recording');
    
    // Perform initial action
    const testPage = await context.newPage();
    await testPage.goto('/test-page');
    await testPage.click('#test-button');
    
    // Go back and pause recording
    await page.bringToFront();
    await page.click('#pause-recording');
    
    // Verify paused state
    await expect(page.locator('.recording-paused')).toBeVisible();
    await expect(page.locator('#resume-recording')).toBeVisible();
    
    // Perform action while paused (should not be recorded)
    await testPage.bringToFront();
    await testPage.click('#secondary-button');
    
    // Resume recording
    await page.bringToFront();
    await page.click('#resume-recording');
    
    // Verify resumed state
    await expect(page.locator('.recording-active')).toBeVisible();
    
    // Perform action after resume (should be recorded)
    await testPage.bringToFront();
    await testPage.click('#third-button');
    
    // Stop recording
    await page.bringToFront();
    await page.click('#stop-recording');
    
    // Verify only actions before pause and after resume were recorded
    const clickActions = page.locator('.recorded-action[data-type="click"]');
    await expect(clickActions).toHaveCount(2); // test-button and third-button, not secondary-button
  });

  test('should save recorded test with metadata', async ({ page, context }) => {
    // Record some actions
    await page.click('#start-recording');
    
    const testPage = await context.newPage();
    await testPage.goto('/test-page');
    await testPage.click('#test-button');
    
    await page.bringToFront();
    await page.click('#stop-recording');
    
    // Fill test metadata
    await page.fill('#test-name', 'Automated Button Click Test');
    await page.fill('#test-description', 'Test to verify button click functionality');
    
    // Select test category
    await page.selectOption('#test-category', 'functional');
    
    // Add tags
    await page.fill('#test-tags', 'button, click, ui');
    
    // Save test
    await page.click('#save-test');
    
    // Verify save success
    await expect(page.locator('.save-success')).toBeVisible();
    await expect(page.locator('.save-success')).toContainText('Test saved successfully');
    
    // Navigate to test list to verify
    await page.goto('/tests');
    
    const testItems = page.locator('.test-item');
    await expect(testItems).not.toHaveCount(0);
    
    // Find our saved test
    const savedTest = page.locator('.test-item', { hasText: 'Automated Button Click Test' });
    await expect(savedTest).toBeVisible();
    
    // Verify test metadata
    await expect(savedTest.locator('.test-description')).toContainText('Test to verify button click functionality');
    await expect(savedTest.locator('.test-category')).toContainText('functional');
  });

  test('should export test in multiple formats', async ({ page, context }) => {
    // Record a simple test
    await page.click('#start-recording');
    
    const testPage = await context.newPage();
    await testPage.goto('/test-page');
    await testPage.fill('#username', 'testuser');
    await testPage.click('#submit-button');
    
    await page.bringToFront();
    await page.click('#stop-recording');
    
    // Test Selenium export
    await page.selectOption('#export-format', 'selenium');
    await page.click('#export-test');
    
    await expect(page.locator('#export-modal')).toBeVisible();
    
    const seleniumCode = await page.locator('#generated-code').inputValue();
    expect(seleniumCode).toContain('WebDriver');
    expect(seleniumCode).toContain('find_element');
    expect(seleniumCode).toContain('click()');
    
    // Close modal and test Playwright export
    await page.click('#close-export-modal');
    await page.selectOption('#export-format', 'playwright');
    await page.click('#export-test');
    
    const playwrightCode = await page.locator('#generated-code').inputValue();
    expect(playwrightCode).toContain('page.');
    expect(playwrightCode).toContain('fill(');
    expect(playwrightCode).toContain('click(');
    
    // Test Cypress export
    await page.click('#close-export-modal');
    await page.selectOption('#export-format', 'cypress');
    await page.click('#export-test');
    
    const cypressCode = await page.locator('#generated-code').inputValue();
    expect(cypressCode).toContain('cy.');
    expect(cypressCode).toContain('type(');
    expect(cypressCode).toContain('click()');
  });

  test('should handle recording errors gracefully', async ({ page, context }) => {
    // Start recording
    await page.click('#start-recording');
    
    // Navigate to non-existent page
    const testPage = await context.newPage();
    
    // This should not crash the recorder
    const response = await testPage.goto('/non-existent-page', { waitUntil: 'commit' });
    expect(response?.status()).toBe(404);
    
    // Go back to recorder
    await page.bringToFront();
    
    // Recorder should still be functional
    await expect(page.locator('.recording-active')).toBeVisible();
    await expect(page.locator('#stop-recording')).toBeEnabled();
    
    // Should be able to stop recording
    await page.click('#stop-recording');
    await expect(page.locator('.recording-stopped')).toBeVisible();
  });

  test('should prevent multiple concurrent recording sessions', async ({ page, context }) => {
    // Start first recording
    await page.click('#start-recording');
    await expect(page.locator('.recording-active')).toBeVisible();
    
    // Start recording button should be disabled
    await expect(page.locator('#start-recording')).toBeDisabled();
    
    // Open second tab with recorder
    const secondRecorderPage = await context.newPage();
    await secondRecorderPage.goto('/recorder');
    
    // Start recording should be disabled on second instance too
    await expect(secondRecorderPage.locator('#start-recording')).toBeDisabled();
    await expect(secondRecorderPage.locator('.recording-in-progress-elsewhere')).toBeVisible();
    
    // Stop recording on first tab
    await page.bringToFront();
    await page.click('#stop-recording');
    
    // Now start recording should be enabled on both tabs
    await expect(page.locator('#start-recording')).toBeEnabled();
    
    await secondRecorderPage.bringToFront();
    await expect(secondRecorderPage.locator('#start-recording')).toBeEnabled();
  });

  test('should record complex user interactions', async ({ page, context }) => {
    // Start recording
    await page.click('#start-recording');
    
    const testPage = await context.newPage();
    await testPage.goto('/complex-form');
    
    // Complex interaction sequence
    await testPage.fill('#search-field', 'test query');
    await testPage.press('#search-field', 'Enter');
    
    // Wait for search results
    await testPage.waitForSelector('.search-results');
    
    // Click on first result
    await testPage.click('.search-result:first-child');
    
    // Fill out multi-step form
    await testPage.selectOption('#dropdown1', 'option1');
    await testPage.check('#checkbox1');
    await testPage.check('#checkbox2');
    
    // Upload file (simulate)
    await testPage.setInputFiles('#file-upload', 'test-files/sample.txt');
    
    // Drag and drop (simulate)
    await testPage.dragAndDrop('#draggable-item', '#drop-zone');
    
    // Submit form
    await testPage.click('#submit-complex-form');
    
    // Stop recording
    await page.bringToFront();
    await page.click('#stop-recording');
    
    // Verify all interaction types were recorded
    const allActions = page.locator('.recorded-action');
    await expect(allActions.count()).toBeGreaterThan(8);
    
    // Check for different action types
    await expect(page.locator('.recorded-action[data-type="input"]')).not.toHaveCount(0);
    await expect(page.locator('.recorded-action[data-type="click"]')).not.toHaveCount(0);
    await expect(page.locator('.recorded-action[data-type="select"]')).not.toHaveCount(0);
    await expect(page.locator('.recorded-action[data-type="check"]')).not.toHaveCount(0);
  });
});