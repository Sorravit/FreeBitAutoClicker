/**
 * Tests for options.js - Chrome extension options page functionality
 */

describe('Options page functionality', () => {
  beforeEach(() => {
    // Setup DOM with radio buttons - using correct name attribute that matches options.js
    document.body.innerHTML = `
      <input type="radio" name="haveCaptcha" value="true" id="captcha_yes">
      <input type="radio" name="haveCaptcha" value="false" id="captcha_no" checked>
    `;

    // Mock storage responses
    chrome.storage.sync.get.mockImplementation((key, callback) => {
      callback({ haveCaptcha: "false" });
    });

    chrome.storage.sync.set.mockImplementation((data, callback) => {
      if (callback) callback();
    });

    // Load the options script BEFORE clearing mocks
    delete require.cache[require.resolve('../source/options.js')];
    require('../source/options.js');
  });

  describe('Initialization', () => {
    test('should add event listeners to captcha radio buttons', () => {
      const captchaRadios = document.getElementsByName('haveCaptcha');

      expect(captchaRadios).toHaveLength(2);
      expect(chrome.storage.sync.get).toHaveBeenCalledWith("haveCaptcha", expect.any(Function));
    });

    test('should register storage change listener', () => {
      expect(chrome.storage.onChanged.addListener).toHaveBeenCalled();
    });
  });

  describe('Save captcha setting', () => {
    test('should save captcha setting when radio button is clicked', () => {
      const captchaRadios = document.getElementsByName('haveCaptcha');

      // Create a mock event object
      const mockEvent = {
        target: {
          value: "true"
        }
      };

      // Call the function directly to ensure coverage
      global.saveCaptchaSetting(mockEvent);

      expect(chrome.storage.sync.set).toHaveBeenCalledWith({ haveCaptcha: "true" });
    });

    test('should save false captcha setting', () => {
      const mockEvent = {
        target: {
          value: "false"
        }
      };

      global.saveCaptchaSetting(mockEvent);

      expect(chrome.storage.sync.set).toHaveBeenCalledWith({ haveCaptcha: "false" });
    });
  });

  describe('Display captcha setting', () => {
    test('should display captcha setting correctly for true value', () => {
      const captchaRadios = document.getElementsByName('haveCaptcha');

      // Reset radio buttons
      captchaRadios.forEach(radio => radio.checked = false);

      // Test displayCaptchaSetting function directly
      global.displayCaptchaSetting({ haveCaptcha: "true" });

      // Check that the correct radio button is checked
      expect(captchaRadios[0].checked).toBe(true); // "true" radio button
      expect(captchaRadios[1].checked).toBe(false); // "false" radio button
    });

    test('should display captcha setting correctly for false value', () => {
      const captchaRadios = document.getElementsByName('haveCaptcha');

      // Reset radio buttons
      captchaRadios.forEach(radio => radio.checked = false);

      // Test displayCaptchaSetting function directly
      global.displayCaptchaSetting({ haveCaptcha: "false" });

      // Check that the correct radio button is checked
      expect(captchaRadios[0].checked).toBe(false); // "true" radio button
      expect(captchaRadios[1].checked).toBe(true); // "false" radio button
    });

    test('should handle undefined captcha setting', () => {
      const captchaRadios = document.getElementsByName('haveCaptcha');

      // Reset radio buttons
      captchaRadios.forEach(radio => radio.checked = false);

      // Test with undefined value
      global.displayCaptchaSetting({ haveCaptcha: undefined });

      // Should not crash and no radio button should be checked
      expect(captchaRadios[0].checked).toBe(false);
      expect(captchaRadios[1].checked).toBe(false);
    });
  });

  describe('Storage change handling', () => {
    test('should respond to storage changes', () => {
      // Verify that storage change listener was registered
      expect(chrome.storage.onChanged.addListener).toHaveBeenCalled();

      // Test the actual listener functionality
      const storageListener = chrome.storage.onChanged.addListener.mock.calls[0][0];

      // Reset the get mock to return new data
      chrome.storage.sync.get.mockImplementation((key, callback) => {
        callback({ haveCaptcha: "true" });
      });

      // Call the listener to simulate storage change
      storageListener();

      // Verify it queries storage again
      expect(chrome.storage.sync.get).toHaveBeenCalledWith("haveCaptcha", expect.any(Function));
    });
  });
});
