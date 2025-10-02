"""
Integration tests for Web AutoTest Pro recorder functionality.
Tests the complete recording workflow including browser automation,
user interaction capture, and test script generation.
"""

import pytest
import time
import json
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.common.action_chains import ActionChains
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.options import Options as ChromeOptions
from selenium.webdriver.firefox.options import Options as FirefoxOptions


class TestRecorderFunctionality:
    """Test suite for web test recorder functionality."""

    @pytest.fixture(autouse=True)
    def setup_recorder(self, browser_driver):
        """Setup recorder for each test."""
        self.driver = browser_driver
        self.wait = WebDriverWait(self.driver, 10)
        
        # Navigate to the recorder page
        self.driver.get("http://localhost:3000/recorder")
        
        # Wait for recorder to load
        self.wait.until(EC.presence_of_element_located((By.id, "recorder-container")))
        
        yield
        
        # Cleanup after each test
        self.stop_recording_if_active()

    def stop_recording_if_active(self):
        """Stop recording if it's currently active."""
        try:
            stop_button = self.driver.find_element(By.id, "stop-recording")
            if stop_button.is_enabled():
                stop_button.click()
                time.sleep(1)
        except:
            pass

    def test_start_recording(self):
        """Test starting a new recording session."""
        # Click start recording button
        start_button = self.wait.until(
            EC.element_to_be_clickable((By.id, "start-recording"))
        )
        start_button.click()

        # Verify recording status indicator
        status_indicator = self.wait.until(
            EC.presence_of_element_located((By.class_name, "recording-active"))
        )
        assert status_indicator.is_displayed()

        # Verify recording controls are visible
        stop_button = self.driver.find_element(By.id, "stop-recording")
        assert stop_button.is_displayed()
        assert stop_button.is_enabled()

        pause_button = self.driver.find_element(By.id, "pause-recording")
        assert pause_button.is_displayed()
        assert pause_button.is_enabled()

    def test_record_click_action(self):
        """Test recording a click action."""
        # Start recording
        self.driver.find_element(By.id, "start-recording").click()
        time.sleep(1)

        # Navigate to test page with clickable elements
        self.driver.get("http://localhost:3000/test-page")
        
        # Click on a test button
        test_button = self.wait.until(
            EC.element_to_be_clickable((By.id, "test-button"))
        )
        test_button.click()

        # Go back to recorder
        self.driver.get("http://localhost:3000/recorder")

        # Stop recording
        self.driver.find_element(By.id, "stop-recording").click()

        # Verify recorded actions
        actions_list = self.wait.until(
            EC.presence_of_element_located((By.id, "recorded-actions"))
        )
        
        # Check that click action was recorded
        click_actions = self.driver.find_elements(
            By.css_selector, ".recorded-action[data-type='click']"
        )
        assert len(click_actions) >= 1

        # Verify action details
        click_action = click_actions[0]
        action_data = json.loads(click_action.get_attribute("data-action"))
        
        assert action_data["type"] == "click"
        assert action_data["selector"] == "#test-button"
        assert "timestamp" in action_data

    def test_record_form_input(self):
        """Test recording form input actions."""
        # Start recording
        self.driver.find_element(By.id, "start-recording").click()
        time.sleep(1)

        # Navigate to form page
        self.driver.get("http://localhost:3000/test-form")
        
        # Fill out form fields
        username_field = self.wait.until(
            EC.presence_of_element_located((By.id, "username"))
        )
        username_field.send_keys("testuser")

        password_field = self.driver.find_element(By.id, "password")
        password_field.send_keys("testpass123")

        email_field = self.driver.find_element(By.id, "email"))
        email_field.send_keys("test@example.com")

        # Submit form
        submit_button = self.driver.find_element(By.id, "submit-form")
        submit_button.click()

        # Go back to recorder
        self.driver.get("http://localhost:3000/recorder")

        # Stop recording
        self.driver.find_element(By.id, "stop-recording").click()

        # Verify recorded form inputs
        input_actions = self.driver.find_elements(
            By.css_selector, ".recorded-action[data-type='input']"
        )
        assert len(input_actions) >= 3  # username, password, email

        # Verify input action details
        for action_element in input_actions:
            action_data = json.loads(action_element.get_attribute("data-action"))
            assert action_data["type"] == "input"
            assert "selector" in action_data
            assert "value" in action_data
            assert "timestamp" in action_data

    def test_record_navigation(self):
        """Test recording page navigation."""
        # Start recording
        self.driver.find_element(By.id, "start-recording").click()
        time.sleep(1)

        # Navigate to different pages
        self.driver.get("http://localhost:3000/page1")
        time.sleep(1)
        
        self.driver.get("http://localhost:3000/page2")
        time.sleep(1)

        # Go back to recorder
        self.driver.get("http://localhost:3000/recorder")

        # Stop recording
        self.driver.find_element(By.id, "stop-recording").click()

        # Verify navigation actions
        nav_actions = self.driver.find_elements(
            By.css_selector, ".recorded-action[data-type='navigate']"
        )
        assert len(nav_actions) >= 2

        # Check navigation URLs
        nav_urls = []
        for action_element in nav_actions:
            action_data = json.loads(action_element.get_attribute("data-action"))
            nav_urls.append(action_data["url"])
        
        assert "http://localhost:3000/page1" in nav_urls
        assert "http://localhost:3000/page2" in nav_urls

    def test_pause_resume_recording(self):
        """Test pausing and resuming recording."""
        # Start recording
        self.driver.find_element(By.id, "start-recording").click()
        time.sleep(1)

        # Perform some actions
        self.driver.get("http://localhost:3000/test-page")
        self.driver.find_element(By.id, "test-button").click()

        # Go back to recorder and pause
        self.driver.get("http://localhost:3000/recorder")
        pause_button = self.driver.find_element(By.id, "pause-recording")
        pause_button.click()

        # Verify paused state
        status_indicator = self.driver.find_element(By.class_name, "recording-paused")
        assert status_indicator.is_displayed()

        # Resume recording
        resume_button = self.driver.find_element(By.id, "resume-recording")
        resume_button.click()

        # Verify resumed state
        status_indicator = self.driver.find_element(By.class_name, "recording-active")
        assert status_indicator.is_displayed()

        # Stop recording
        self.driver.find_element(By.id, "stop-recording").click()

    def test_save_recorded_test(self):
        """Test saving a recorded test."""
        # Record some actions
        self.driver.find_element(By.id, "start-recording").click()
        time.sleep(1)
        
        self.driver.get("http://localhost:3000/test-page")
        self.driver.find_element(By.id, "test-button").click()
        
        self.driver.get("http://localhost:3000/recorder")
        self.driver.find_element(By.id, "stop-recording").click()

        # Save the test
        test_name_input = self.driver.find_element(By.id, "test-name")
        test_name_input.send_keys("Test Button Click")

        test_description = self.driver.find_element(By.id, "test-description")
        test_description.send_keys("Test clicking the test button")

        save_button = self.driver.find_element(By.id, "save-test")
        save_button.click()

        # Verify save confirmation
        success_message = self.wait.until(
            EC.presence_of_element_located((By.class_name, "save-success"))
        )
        assert "Test saved successfully" in success_message.text

        # Verify test appears in test list
        self.driver.get("http://localhost:3000/tests")
        test_items = self.driver.find_elements(By.class_name, "test-item")
        
        test_names = [item.find_element(By.class_name, "test-name").text for item in test_items]
        assert "Test Button Click" in test_names

    def test_export_test_script(self):
        """Test exporting recorded test as script."""
        # Record and save a test
        self.driver.find_element(By.id, "start-recording").click()
        time.sleep(1)
        
        self.driver.get("http://localhost:3000/test-page")
        self.driver.find_element(By.id, "test-button").click()
        
        self.driver.get("http://localhost:3000/recorder")
        self.driver.find_element(By.id, "stop-recording").click()

        # Export as different formats
        export_dropdown = self.driver.find_element(By.id, "export-format")
        export_dropdown.click()

        # Test Selenium export
        selenium_option = self.driver.find_element(By.value, "selenium")
        selenium_option.click()

        export_button = self.driver.find_element(By.id, "export-test")
        export_button.click()

        # Verify export modal
        export_modal = self.wait.until(
            EC.presence_of_element_located((By.id, "export-modal"))
        )
        assert export_modal.is_displayed()

        # Check generated code
        code_content = self.driver.find_element(By.id, "generated-code")
        generated_code = code_content.get_attribute("value")
        
        assert "selenium" in generated_code.lower()
        assert "click" in generated_code.lower()
        assert "#test-button" in generated_code

    def test_recording_error_handling(self):
        """Test error handling during recording."""
        # Start recording
        self.driver.find_element(By.id, "start-recording").click()
        time.sleep(1)

        # Navigate to non-existent page
        self.driver.get("http://localhost:3000/non-existent-page")
        time.sleep(2)

        # Go back to recorder
        self.driver.get("http://localhost:3000/recorder")

        # Check for error indicators
        error_indicators = self.driver.find_elements(By.class_name, "recording-error")
        
        # Should handle navigation errors gracefully
        assert len(error_indicators) == 0 or "404" not in error_indicators[0].text

        # Stop recording should still work
        stop_button = self.driver.find_element(By.id, "stop-recording")
        assert stop_button.is_enabled()
        stop_button.click()

    def test_concurrent_recording_prevention(self):
        """Test that only one recording session can be active."""
        # Start first recording
        self.driver.find_element(By.id, "start-recording").click()
        time.sleep(1)

        # Try to start another recording (should be disabled/prevented)
        start_button = self.driver.find_element(By.id, "start-recording")
        assert not start_button.is_enabled()

        # Stop recording
        self.driver.find_element(By.id, "stop-recording").click()

        # Now start button should be enabled again
        self.wait.until(lambda driver: start_button.is_enabled())
        assert start_button.is_enabled()