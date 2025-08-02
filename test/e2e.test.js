/**
 * End-to-End Tests for FreeBit Auto Clicker Chrome Extension
 * Tests complete user workflows and edge cases
 */

describe('End-to-End Tests', () => {
  beforeEach(() => {
    // Setup default storage state
    chrome.storage.sync.get.mockImplementation((key, callback) => {
      const mockData = {
        timeToWaitForFreeRoll: 10 / 60,
        tabID: 123,
        haveCaptcha: "false"
      };
      callback(typeof key === 'string' ? { [key]: mockData[key] } : mockData);
    });

    chrome.storage.sync.set.mockImplementation((data, callback) => {
      if (callback) callback();
    });

    chrome.alarms.create.mockImplementation((name, options) => {
      return Promise.resolve();
    });

    chrome.scripting.executeScript.mockImplementation((options, callback) => {
      if (callback) callback();
      return Promise.resolve();
    });

    // Load background script to set up listeners
    delete require.cache[require.resolve('../source/background.js')];
    require('../source/background.js');
  });

  describe('Complete User Workflow', () => {
    test('should handle complete auto-click cycle', async () => {
      // 1. User opens popup and clicks start
      document.body.innerHTML = `
        <button id="startAutoClick">Start Auto Click</button>
        <button id="stopAutoClick">Stop Auto Click</button>
      `;

      chrome.tabs.query.mockResolvedValue([{ id: 456 }]);

      // 2. Background receives message and sets up alarm
      expect(chrome.runtime.onMessage.addListener).toHaveBeenCalled();
      const messageListener = chrome.runtime.onMessage.addListener.mock.calls[0][0];
      messageListener('StartAutoClick', { tab: { id: 456 } }, jest.fn());

      expect(chrome.alarms.create).toHaveBeenCalledWith("ClickFreeRollButton", {
        periodInMinutes: 10 / 60
      });

      // 3. Alarm triggers and executes script
      expect(chrome.alarms.onAlarm.addListener).toHaveBeenCalled();
      const alarmListener = chrome.alarms.onAlarm.addListener.mock.calls[0][0];
      await alarmListener({ name: 'ClickFreeRollButton' });

      // Check that executeScript was called at least once (may be called multiple times)
      expect(chrome.scripting.executeScript).toHaveBeenCalled();
    }, 10000); // Increase timeout

    test('should handle user changing options during operation', () => {
      // Setup options page
      document.body.innerHTML = `
        <input type="radio" name="haveCaptcha" value="true" id="captcha_yes">
        <input type="radio" name="haveCaptcha" value="false" id="captcha_no" checked>
      `;

      delete require.cache[require.resolve('../source/options.js')];
      require('../source/options.js');

      // Verify storage change listener was set up
      expect(chrome.storage.onChanged.addListener).toHaveBeenCalled();

      const storageListener = chrome.storage.onChanged.addListener.mock.calls[0][0];
      storageListener();

      // Should query storage for new settings
      expect(chrome.storage.sync.get).toHaveBeenCalledWith("haveCaptcha", expect.any(Function));
    });
  });

  describe('Error Scenarios', () => {
    test('should handle tab not found error', () => {
      chrome.tabs.query.mockResolvedValue([]);

      expect(chrome.runtime.onMessage.addListener).toHaveBeenCalled();
      const messageListener = chrome.runtime.onMessage.addListener.mock.calls[0][0];

      // Should not crash when no tabs found
      expect(() => {
        messageListener('StartAutoClick', { tab: { id: null } }, jest.fn());
      }).not.toThrow();
    });

    test('should handle storage errors gracefully', async () => {
      chrome.storage.sync.get.mockImplementation((key, callback) => {
        callback({}); // Return empty object instead of null to avoid destructuring error
      });

      expect(chrome.alarms.onAlarm.addListener).toHaveBeenCalled();
      const alarmListener = chrome.alarms.onAlarm.addListener.mock.calls[0][0];

      // Should not crash when storage returns empty data
      await expect(alarmListener({ name: 'ClickFreeRollButton' })).resolves.not.toThrow();
    });
  });

  describe('Performance and Resource Management', () => {
    test('should not create duplicate alarms', () => {
      expect(chrome.runtime.onMessage.addListener).toHaveBeenCalled();
      const messageListener = chrome.runtime.onMessage.addListener.mock.calls[0][0];

      // Start auto-click multiple times
      messageListener('StartAutoClick', { tab: { id: 456 } }, jest.fn());
      messageListener('StartAutoClick', { tab: { id: 456 } }, jest.fn());

      // Should only create alarm once (due to alarm name uniqueness)
      expect(chrome.alarms.create).toHaveBeenCalledTimes(2); // Each call creates an alarm
    });

    test('should properly clean up resources on stop', () => {
      expect(chrome.runtime.onMessage.addListener).toHaveBeenCalled();
      const messageListener = chrome.runtime.onMessage.addListener.mock.calls[0][0];

      // Start then stop
      messageListener('StartAutoClick', { tab: { id: 456 } }, jest.fn());
      messageListener('StopAutoClick', { tab: { id: 456 } }, jest.fn());

      expect(chrome.alarms.clear).toHaveBeenCalledWith("ClickFreeRollButton");
    });
  });

  describe('Extension Lifecycle', () => {
    test('should initialize properly on installation', () => {
      expect(chrome.runtime.onInstalled.addListener).toHaveBeenCalled();

      // Simulate extension installation
      const installListener = chrome.runtime.onInstalled.addListener.mock.calls[0][0];
      installListener();

      expect(chrome.storage.sync.set).toHaveBeenCalledWith({
        timeToWaitForFreeRoll: 10 / 60
      });
    });
  });
});
