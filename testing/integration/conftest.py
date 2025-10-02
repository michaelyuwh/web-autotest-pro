"""
PyTest configuration for Web AutoTest Pro integration tests.
Provides fixtures and configuration for browser automation testing.
"""

import pytest
import os
import json
from selenium import webdriver
from selenium.webdriver.chrome.options import Options as ChromeOptions
from selenium.webdriver.firefox.options import Options as FirefoxOptions
from selenium.webdriver.chrome.service import Service as ChromeService
from selenium.webdriver.firefox.service import Service as FirefoxService
from webdriver_manager.chrome import ChromeDriverManager
from webdriver_manager.firefox import GeckoDriverManager


@pytest.fixture(scope="session")
def test_config():
    """Load test configuration."""
    config = {
        "base_url": os.getenv("APP_BASE_URL", "http://localhost:3000"),
        "selenium_hub_url": os.getenv("SELENIUM_HUB_URL", None),
        "headless": os.getenv("HEADLESS", "true").lower() == "true",
        "browser": os.getenv("BROWSER", "chrome"),
        "implicit_wait": 10,
        "page_load_timeout": 30,
        "window_size": "1920,1080"
    }
    return config


@pytest.fixture(scope="session")
def browser_options(test_config):
    """Configure browser options based on test configuration."""
    browser = test_config["browser"].lower()
    
    if browser == "chrome":
        options = ChromeOptions()
        if test_config["headless"]:
            options.add_argument("--headless")
        options.add_argument("--no-sandbox")
        options.add_argument("--disable-dev-shm-usage")
        options.add_argument("--disable-gpu")
        options.add_argument("--disable-extensions")
        options.add_argument("--disable-plugins")
        options.add_argument(f"--window-size={test_config['window_size']}")
        options.add_argument("--start-maximized")
        
        # Additional Chrome options for CI environments
        options.add_argument("--disable-background-timer-throttling")
        options.add_argument("--disable-backgrounding-occluded-windows")
        options.add_argument("--disable-renderer-backgrounding")
        
        return options
        
    elif browser == "firefox":
        options = FirefoxOptions()
        if test_config["headless"]:
            options.add_argument("--headless")
        options.add_argument("--width=1920")
        options.add_argument("--height=1080")
        
        return options
    
    else:
        raise ValueError(f"Unsupported browser: {browser}")


@pytest.fixture
def browser_driver(test_config, browser_options):
    """Create and configure WebDriver instance."""
    browser = test_config["browser"].lower()
    selenium_hub_url = test_config["selenium_hub_url"]
    
    if selenium_hub_url:
        # Use remote WebDriver for CI/Grid execution
        if browser == "chrome":
            capabilities = {
                "browserName": "chrome",
                "browserVersion": "latest",
                "platformName": "linux"
            }
        elif browser == "firefox":
            capabilities = {
                "browserName": "firefox",
                "browserVersion": "latest",
                "platformName": "linux"
            }
        
        driver = webdriver.Remote(
            command_executor=selenium_hub_url,
            options=browser_options,
            desired_capabilities=capabilities
        )
    else:
        # Use local WebDriver
        if browser == "chrome":
            service = ChromeService(ChromeDriverManager().install())
            driver = webdriver.Chrome(service=service, options=browser_options)
        elif browser == "firefox":
            service = FirefoxService(GeckoDriverManager().install())
            driver = webdriver.Firefox(service=service, options=browser_options)
        else:
            raise ValueError(f"Unsupported browser: {browser}")
    
    # Configure timeouts
    driver.implicitly_wait(test_config["implicit_wait"])
    driver.set_page_load_timeout(test_config["page_load_timeout"])
    
    yield driver
    
    # Cleanup
    driver.quit()


@pytest.fixture
def authenticated_driver(browser_driver, test_config):
    """Provide an authenticated driver session."""
    driver = browser_driver
    
    # Navigate to login page
    driver.get(f"{test_config['base_url']}/login")
    
    # Perform login (this would be customized based on actual login flow)
    # For now, we'll assume a simple form-based login
    try:
        from selenium.webdriver.common.by import By
        from selenium.webdriver.support.ui import WebDriverWait
        from selenium.webdriver.support import expected_conditions as EC
        
        wait = WebDriverWait(driver, 10)
        
        # Wait for login form
        username_field = wait.until(
            EC.presence_of_element_located((By.id, "username"))
        )
        password_field = driver.find_element(By.id, "password")
        login_button = driver.find_element(By.id, "login-button")
        
        # Use test credentials
        username_field.send_keys(os.getenv("TEST_USERNAME", "testuser"))
        password_field.send_keys(os.getenv("TEST_PASSWORD", "testpass"))
        login_button.click()
        
        # Wait for successful login redirect
        wait.until(EC.url_contains("/dashboard"))
        
    except Exception as e:
        # If login fails, continue with unauthenticated session
        print(f"Authentication failed: {e}")
    
    yield driver


@pytest.fixture
def test_data():
    """Provide test data for use in tests."""
    return {
        "sample_test_script": {
            "name": "Sample Test",
            "description": "A sample test for testing purposes",
            "steps": [
                {
                    "type": "navigate",
                    "url": "http://localhost:3000/test-page",
                    "timeout": 5000
                },
                {
                    "type": "click",
                    "selector": "#test-button",
                    "timeout": 3000
                },
                {
                    "type": "input",
                    "selector": "#username",
                    "value": "testuser",
                    "timeout": 3000
                },
                {
                    "type": "assert",
                    "selector": "#success-message",
                    "expected": "Success!",
                    "timeout": 5000
                }
            ]
        },
        "error_test_script": {
            "name": "Error Test",
            "description": "A test designed to produce errors",
            "steps": [
                {
                    "type": "navigate",
                    "url": "http://localhost:3000/non-existent-page",
                    "timeout": 5000
                },
                {
                    "type": "click",
                    "selector": "#non-existent-element",
                    "timeout": 3000
                }
            ]
        },
        "form_test_data": {
            "username": "testuser123",
            "password": "testpass456",
            "email": "test@example.com",
            "first_name": "Test",
            "last_name": "User"
        }
    }


@pytest.fixture
def screenshot_on_failure(request, browser_driver):
    """Take screenshot on test failure."""
    yield
    
    if request.node.rep_call.failed:
        # Create screenshots directory if it doesn't exist
        screenshots_dir = "test-results/screenshots"
        os.makedirs(screenshots_dir, exist_ok=True)
        
        # Generate screenshot filename
        test_name = request.node.name
        timestamp = pytest.current_timestamp if hasattr(pytest, 'current_timestamp') else "unknown"
        screenshot_path = f"{screenshots_dir}/{test_name}_{timestamp}.png"
        
        # Take screenshot
        try:
            browser_driver.save_screenshot(screenshot_path)
            print(f"Screenshot saved: {screenshot_path}")
        except Exception as e:
            print(f"Failed to take screenshot: {e}")


@pytest.fixture(autouse=True)
def setup_test_reporting(request):
    """Setup test reporting and logging."""
    # Add timestamp for screenshot naming
    import time
    pytest.current_timestamp = str(int(time.time()))
    
    # Log test start
    print(f"\n=== Starting test: {request.node.name} ===")
    
    yield
    
    # Log test completion
    if hasattr(request.node, 'rep_call'):
        result = "PASSED" if request.node.rep_call.passed else "FAILED"
        print(f"=== Test completed: {request.node.name} - {result} ===")


@pytest.hookimpl(tryfirst=True, hookwrapper=True)
def pytest_runtest_makereport(item, call):
    """Hook to capture test results for use in fixtures."""
    outcome = yield
    rep = outcome.get_result()
    setattr(item, f"rep_{rep.when}", rep)


def pytest_configure(config):
    """Configure pytest with custom markers and settings."""
    config.addinivalue_line(
        "markers", "smoke: mark test as smoke test"
    )
    config.addinivalue_line(
        "markers", "regression: mark test as regression test"
    )
    config.addinivalue_line(
        "markers", "slow: mark test as slow running"
    )
    config.addinivalue_line(
        "markers", "integration: mark test as integration test"
    )


def pytest_collection_modifyitems(config, items):
    """Modify test collection to add markers based on test location."""
    for item in items:
        # Add integration marker to integration tests
        if "integration" in str(item.fspath):
            item.add_marker(pytest.mark.integration)
        
        # Add slow marker to tests that might be slow
        if any(keyword in item.name.lower() for keyword in ["batch", "load", "performance"]):
            item.add_marker(pytest.mark.slow)


@pytest.fixture(scope="session", autouse=True)
def setup_test_environment():
    """Setup test environment before running tests."""
    # Create necessary directories
    os.makedirs("test-results", exist_ok=True)
    os.makedirs("test-results/screenshots", exist_ok=True)
    os.makedirs("test-results/reports", exist_ok=True)
    
    # Setup environment variables if not set
    if not os.getenv("APP_BASE_URL"):
        os.environ["APP_BASE_URL"] = "http://localhost:3000"
    
    print("Test environment setup completed")
    
    yield
    
    print("Test environment cleanup completed")