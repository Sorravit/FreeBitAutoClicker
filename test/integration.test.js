/**
 * Integration tests for FreeBit Auto Clicker Chrome Extension
 * Tests the interaction between different components
 */

describe('Integration Tests - Component Interactions', () => {
  beforeEach(() => {
    // Mock complete chrome API
    chrome.storage.sync.get.mockImplementation((key, callback) => {
      const mockData = {
        timeToWaitForFreeRoll: 10 / 60,
        tabID: 123,
        haveCaptcha: "false"
      };
      callback(typeof key === 'string' ? { [key]: mockData[key] } : mockData);
    });
  });

  describe('Popup to Background Communication', () => {
    test('should complete full start auto-click workflow', async () => {
      // Setup popup DOM
      document.body.innerHTML = `
        <button id="startAutoClick">Start Auto Click</button>
        <button id="stopAutoClick">Stop Auto Click</button>
      `;

      // Mock tab query
      chrome.tabs.query.mockResolvedValue([{ id: 456 }]);

      // Load popup script
      delete require.cache[require.resolve('../source/popup.js')];
      require('../source/popup.js');

      // Load background script
      delete require.cache[require.resolve('../source/background.js')];
      require('../source/background.js');

      // Simulate clicking start button
      const startButton = document.getElementById("startAutoClick");
      const clickEvent = new Event('click');
      startButton.dispatchEvent(clickEvent);

      // Wait for async operations
      await new Promise(resolve => setTimeout(resolve, 0));

      // Verify tab query was called
      expect(chrome.tabs.query).toHaveBeenCalledWith({
        active: true,
        currentWindow: true
      });

      // Verify script execution was called
      expect(chrome.scripting.executeScript).toHaveBeenCalledWith({
        target: { tabId: 456 },
        function: expect.any(Function)
      });
    });

    test('should complete full stop auto-click workflow', async () => {
      // Setup popup DOM
      document.body.innerHTML = `
        <button id="startAutoClick">Start Auto Click</button>
        <button id="stopAutoClick">Stop Auto Click</button>
      `;

      chrome.tabs.query.mockResolvedValue([{ id: 456 }]);

      delete require.cache[require.resolve('../source/popup.js')];
      require('../source/popup.js');

      delete require.cache[require.resolve('../source/background.js')];
      require('../source/background.js');

      const stopButton = document.getElementById("stopAutoClick");
      const clickEvent = new Event('click');
      stopButton.dispatchEvent(clickEvent);

      await new Promise(resolve => setTimeout(resolve, 0));

      // Simulate the background message handler
      const messageListener = chrome.runtime.onMessage.addListener.mock.calls[0][0];
      const mockSender = { tab: { id: 456 } };
      const mockSendResponse = jest.fn();

      messageListener('StopAutoClick', mockSender, mockSendResponse);

      expect(chrome.alarms.clear).toHaveBeenCalledWith("ClickFreeRollButton");
      expect(mockSendResponse).toHaveBeenCalledWith("Auto click process terminated");
    });
  });
});
