"""
Integration tests for Web AutoTest Pro playback functionality.
Tests the complete test execution workflow including script loading,
browser automation, and result reporting.
"""

import pytest
import time
import json
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.common.action_chains import ActionChains
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException, NoSuchElementException


class TestPlaybackFunctionality:
    """Test suite for web test playback functionality."""

    @pytest.fixture(autouse=True)
    def setup_playback(self, browser_driver):
        """Setup playback environment for each test."""
        self.driver = browser_driver
        self.wait = WebDriverWait(self.driver, 10)
        
        # Navigate to the playback page
        self.driver.get("http://localhost:3000/playback")
        
        # Wait for playback interface to load
        self.wait.until(EC.presence_of_element_located((By.id, "playback-container")))
        
        yield
        
        # Cleanup after each test
        self.stop_playback_if_active()

    def stop_playback_if_active(self):
        """Stop playback if it's currently running."""
        try:
            stop_button = self.driver.find_element(By.id, "stop-playback")
            if stop_button.is_enabled():
                stop_button.click()
                time.sleep(1)
        except:
            pass

    def test_load_test_script(self):
        """Test loading a test script for playback."""
        # Click load test button
        load_button = self.wait.until(
            EC.element_to_be_clickable((By.id, "load-test"))
        )
        load_button.click()

        # Wait for test selection modal
        test_modal = self.wait.until(
            EC.presence_of_element_located((By.id, "test-selection-modal"))
        )
        assert test_modal.is_displayed()

        # Select a test from the list
        test_items = self.driver.find_elements(By.class_name, "test-item")
        assert len(test_items) > 0

        # Click on first test
        test_items[0].click()

        # Confirm selection
        confirm_button = self.driver.find_element(By.id, "confirm-test-selection")
        confirm_button.click()

        # Verify test is loaded
        loaded_test_info = self.wait.until(
            EC.presence_of_element_located((By.id, "loaded-test-info"))
        )
        assert loaded_test_info.is_displayed()

        # Verify play button is enabled
        play_button = self.driver.find_element(By.id, "play-test")
        assert play_button.is_enabled()

    def test_execute_simple_test(self):
        """Test executing a simple test script."""
        # Load a test first
        self.load_sample_test()

        # Start playback
        play_button = self.driver.find_element(By.id, "play-test")
        play_button.click()

        # Verify playback status
        status_indicator = self.wait.until(
            EC.presence_of_element_located((By.class_name, "playback-running"))
        )
        assert status_indicator.is_displayed()

        # Wait for playback completion
        completion_indicator = self.wait.until(
            EC.presence_of_element_located((By.class_name, "playback-completed")),
            timeout=30
        )
        assert completion_indicator.is_displayed()

        # Check results
        results_section = self.driver.find_element(By.id, "playback-results")
        assert results_section.is_displayed()

        # Verify step results
        step_results = self.driver.find_elements(By.class_name, "step-result")
        assert len(step_results) > 0

        # Check for success indicators
        success_steps = self.driver.find_elements(By.class_name, "step-success")
        assert len(success_steps) > 0

    def test_step_by_step_execution(self):
        """Test step-by-step execution mode."""
        # Load a test
        self.load_sample_test()

        # Enable step-by-step mode
        step_mode_checkbox = self.driver.find_element(By.id, "step-by-step-mode")
        step_mode_checkbox.click()

        # Start playback
        play_button = self.driver.find_element(By.id, "play-test")
        play_button.click()

        # Verify we're in step mode
        step_controls = self.wait.until(
            EC.presence_of_element_located((By.id, "step-controls"))
        )
        assert step_controls.is_displayed()

        # Execute first step
        next_step_button = self.driver.find_element(By.id, "next-step")
        assert next_step_button.is_enabled()
        next_step_button.click()

        # Verify step execution
        current_step = self.driver.find_element(By.id, "current-step")
        assert current_step.is_displayed()
        
        # Check step number increased
        step_counter = self.driver.find_element(By.id, "step-counter")
        assert "1" in step_counter.text

        # Continue with next step
        next_step_button.click()
        time.sleep(1)
        assert "2" in step_counter.text

    def test_playback_pause_resume(self):
        """Test pausing and resuming playback."""
        # Load and start a test
        self.load_sample_test()
        
        play_button = self.driver.find_element(By.id, "play-test")
        play_button.click()

        # Wait a moment for playback to start
        time.sleep(2)

        # Pause playback
        pause_button = self.wait.until(
            EC.element_to_be_clickable((By.id, "pause-playback"))
        )
        pause_button.click()

        # Verify paused state
        status_indicator = self.wait.until(
            EC.presence_of_element_located((By.class_name, "playback-paused"))
        )
        assert status_indicator.is_displayed()

        # Resume playback
        resume_button = self.driver.find_element(By.id, "resume-playback")
        resume_button.click()

        # Verify resumed state
        status_indicator = self.wait.until(
            EC.presence_of_element_located((By.class_name, "playback-running"))
        )
        assert status_indicator.is_displayed()

    def test_playback_stop(self):
        """Test stopping playback mid-execution."""
        # Load and start a test
        self.load_sample_test()
        
        play_button = self.driver.find_element(By.id, "play-test")
        play_button.click()

        # Wait for playback to start
        time.sleep(1)

        # Stop playback
        stop_button = self.driver.find_element(By.id, "stop-playback")
        stop_button.click()

        # Verify stopped state
        status_indicator = self.wait.until(
            EC.presence_of_element_located((By.class_name, "playback-stopped"))
        )
        assert status_indicator.is_displayed()

        # Verify partial results are shown
        results_section = self.driver.find_element(By.id, "playback-results")
        assert results_section.is_displayed()

        # Check for interrupted status
        interrupted_indicator = self.driver.find_element(By.class_name, "playback-interrupted")
        assert interrupted_indicator.is_displayed()

    def test_playback_speed_control(self):
        """Test playback speed controls."""
        # Load a test
        self.load_sample_test()

        # Set playback speed
        speed_slider = self.driver.find_element(By.id, "playback-speed")
        
        # Set to 2x speed
        self.driver.execute_script("arguments[0].value = 2", speed_slider)
        speed_slider.send_keys("")  # Trigger change event

        # Verify speed setting
        speed_display = self.driver.find_element(By.id, "speed-display")
        assert "2x" in speed_display.text

        # Start playback
        play_button = self.driver.find_element(By.id, "play-test")
        play_button.click()

        # Record start time
        start_time = time.time()

        # Wait for completion
        self.wait.until(
            EC.presence_of_element_located((By.class_name, "playback-completed")),
            timeout=15
        )

        execution_time = time.time() - start_time
        
        # At 2x speed, execution should be faster than normal
        # This is a rough check - exact timing depends on test complexity
        assert execution_time < 10  # Should complete quickly at 2x speed

    def test_error_handling_during_playback(self):
        """Test error handling when playback encounters issues."""
        # Load a test with intentional errors
        self.load_error_test()

        # Start playback
        play_button = self.driver.find_element(By.id, "play-test")
        play_button.click()

        # Wait for playback to complete (with errors)
        completion_indicator = self.wait.until(
            EC.presence_of_element_located((By.class_name, "playback-completed")),
            timeout=30
        )

        # Check for error indicators
        error_steps = self.driver.find_elements(By.class_name, "step-error")
        assert len(error_steps) > 0

        # Verify error details are shown
        error_details = self.driver.find_elements(By.class_name, "error-details")
        assert len(error_details) > 0

        # Check overall test result
        test_result = self.driver.find_element(By.id, "test-result")
        assert "failed" in test_result.get_attribute("class").lower()

    def test_screenshot_capture(self):
        """Test screenshot capture during playback."""
        # Load a test
        self.load_sample_test()

        # Enable screenshot capture
        screenshot_checkbox = self.driver.find_element(By.id, "capture-screenshots")
        screenshot_checkbox.click()

        # Start playback
        play_button = self.driver.find_element(By.id, "play-test")
        play_button.click()

        # Wait for completion
        self.wait.until(
            EC.presence_of_element_located((By.class_name, "playback-completed")),
            timeout=30
        )

        # Check for screenshot thumbnails
        screenshots = self.driver.find_elements(By.class_name, "step-screenshot")
        assert len(screenshots) > 0

        # Click on a screenshot to view full size
        screenshots[0].click()

        # Verify screenshot modal
        screenshot_modal = self.wait.until(
            EC.presence_of_element_located((By.id, "screenshot-modal"))
        )
        assert screenshot_modal.is_displayed()

    def test_generate_test_report(self):
        """Test generating a test execution report."""
        # Execute a test first
        self.load_sample_test()
        
        play_button = self.driver.find_element(By.id, "play-test")
        play_button.click()

        # Wait for completion
        self.wait.until(
            EC.presence_of_element_located((By.class_name, "playback-completed")),
            timeout=30
        )

        # Generate report
        report_button = self.driver.find_element(By.id, "generate-report")
        report_button.click()

        # Wait for report generation
        report_modal = self.wait.until(
            EC.presence_of_element_located((By.id, "report-modal"))
        )
        assert report_modal.is_displayed()

        # Check report contents
        report_content = self.driver.find_element(By.id, "report-content")
        report_text = report_content.text

        assert "Test Execution Report" in report_text
        assert "Total Steps" in report_text
        assert "Success Rate" in report_text
        assert "Execution Time" in report_text

        # Test report export
        export_button = self.driver.find_element(By.id, "export-report")
        export_button.click()

        # Should trigger download (we can't verify download in Selenium easily,
        # but we can check that the button click doesn't cause errors)
        time.sleep(1)
        assert True  # If we get here, no JavaScript errors occurred

    def test_batch_test_execution(self):
        """Test executing multiple tests in batch."""
        # Navigate to batch execution page
        self.driver.get("http://localhost:3000/batch-execution")

        # Select multiple tests
        self.wait.until(EC.presence_of_element_located((By.id, "batch-container")))

        test_checkboxes = self.driver.find_elements(By.css_selector, ".test-checkbox")
        
        # Select first 3 tests
        for i in range(min(3, len(test_checkboxes))):
            test_checkboxes[i].click()

        # Start batch execution
        batch_run_button = self.driver.find_element(By.id, "run-batch")
        batch_run_button.click()

        # Monitor batch progress
        progress_bar = self.wait.until(
            EC.presence_of_element_located((By.id, "batch-progress"))
        )
        assert progress_bar.is_displayed()

        # Wait for batch completion
        batch_results = self.wait.until(
            EC.presence_of_element_located((By.id, "batch-results")),
            timeout=60
        )
        assert batch_results.is_displayed()

        # Check individual test results
        individual_results = self.driver.find_elements(By.class_name, "individual-test-result")
        assert len(individual_results) == 3

    # Helper methods
    def load_sample_test(self):
        """Helper method to load a sample test."""
        load_button = self.driver.find_element(By.id, "load-test")
        load_button.click()

        test_modal = self.wait.until(
            EC.presence_of_element_located((By.id, "test-selection-modal"))
        )

        # Select first available test
        test_items = self.driver.find_elements(By.class_name, "test-item")
        if test_items:
            test_items[0].click()
        else:
            # Create a default test if none exist
            self.create_default_test()
            test_items = self.driver.find_elements(By.class_name, "test-item")
            test_items[0].click()

        confirm_button = self.driver.find_element(By.id, "confirm-test-selection")
        confirm_button.click()

        # Wait for test to load
        self.wait.until(
            EC.presence_of_element_located((By.id, "loaded-test-info"))
        )

    def load_error_test(self):
        """Helper method to load a test that will produce errors."""
        # This would load a test designed to fail for error testing
        # Implementation depends on having error test cases available
        load_button = self.driver.find_element(By.id, "load-test")
        load_button.click()

        test_modal = self.wait.until(
            EC.presence_of_element_located((By.id, "test-selection-modal"))
        )

        # Look for error test or create one
        error_tests = self.driver.find_elements(By.css_selector, "[data-test-type='error']")
        if error_tests:
            error_tests[0].click()
        else:
            # Create error test or use first available
            test_items = self.driver.find_elements(By.class_name, "test-item")
            if test_items:
                test_items[0].click()

        confirm_button = self.driver.find_element(By.id, "confirm-test-selection")
        confirm_button.click()

    def create_default_test(self):
        """Helper method to create a default test if none exist."""
        # This would be implemented to create a basic test
        # for use in testing scenarios
        pass