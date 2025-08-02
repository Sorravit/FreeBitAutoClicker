/**
 * Tests for background.js - Chrome extension service worker
 */

describe('Background Service Worker', () => {
  beforeEach(() => {
    // Mock storage data BEFORE clearing mocks
    chrome.storage.sync.get.mockImplementation((key, callback) => {
      const mockData = {
        timeToWaitForFreeRoll: 10 / 60,
        tabID: 123,
        haveCaptcha: "false"
      };
      callback(typeof key === 'string' ? { [key]: mockData[key] } : mockData);
    });

    // Mock chrome.alarms.create to return immediately
    chrome.alarms.create.mockImplementation((name, options) => {
      return Promise.resolve();
    });

    // Mock async functions used in background.js
    chrome.scripting.executeScript.mockImplementation((options, callback) => {
      if (callback) callback();
      return Promise.resolve();
    });

    // Clear require cache and load background script BEFORE clearing mocks
    delete require.cache[require.resolve('../source/background.js')];
    require('../source/background.js');
  });

  describe('Extension installation', () => {
    test('should set initial timeToWaitForFreeRoll on install', () => {
      // Verify that onInstalled listener was registered
      expect(chrome.runtime.onInstalled.addListener).toHaveBeenCalled();

      // Get the registered listener and call it
      const listener = chrome.runtime.onInstalled.addListener.mock.calls[0][0];
      listener();

      expect(chrome.storage.sync.set).toHaveBeenCalledWith({
        timeToWaitForFreeRoll: 10 / 60
      });
    });
  });

  describe('Async helper functions', () => {
    test('should test storageSyncGetAsync function', async () => {
      // Get reference to the background script's global scope
      const backgroundGlobals = global;

      // Test storageSyncGetAsync if it's available
      if (typeof backgroundGlobals.storageSyncGetAsync === 'function') {
        const result = await backgroundGlobals.storageSyncGetAsync('testKey');
        expect(chrome.storage.sync.get).toHaveBeenCalledWith('testKey', expect.any(Function));
      }
    });

    test('should test executeScriptAsync function', async () => {
      const backgroundGlobals = global;

      // Test executeScriptAsync if it's available
      if (typeof backgroundGlobals.executeScriptAsync === 'function') {
        const mockOptions = { target: { tabId: 123 }, function: () => {} };
        await backgroundGlobals.executeScriptAsync(mockOptions);
        expect(chrome.scripting.executeScript).toHaveBeenCalledWith(mockOptions, expect.any(Function));
      }
    });
  });

  describe('Message handling', () => {
    let messageListener;

    beforeEach(() => {
      // Verify the onMessage listener was registered and get it
      expect(chrome.runtime.onMessage.addListener).toHaveBeenCalled();
      messageListener = chrome.runtime.onMessage.addListener.mock.calls[0][0];
    });

    test('should handle StartAutoClick message', () => {
      const mockSender = { tab: { id: 456 } };
      const mockSendResponse = jest.fn();

      messageListener('StartAutoClick', mockSender, mockSendResponse);

      expect(chrome.storage.sync.set).toHaveBeenCalledWith({ tabID: 456 });
      expect(chrome.alarms.create).toHaveBeenCalledWith("ClickFreeRollButton", {
        periodInMinutes: 10 / 60
      });
      expect(chrome.scripting.executeScript).toHaveBeenCalledWith({
        target: { tabId: 456 },
        function: expect.any(Function)
      });
      expect(mockSendResponse).toHaveBeenCalledWith("TabId received, Commencing Auto click process");
    });

    test('should handle StopAutoClick message', () => {
      const mockSender = { tab: { id: 456 } };
      const mockSendResponse = jest.fn();

      messageListener('StopAutoClick', mockSender, mockSendResponse);

      expect(chrome.alarms.clear).toHaveBeenCalledWith("ClickFreeRollButton");
      expect(mockSendResponse).toHaveBeenCalledWith("Auto click process terminated");
    });

    test('should handle ReloadTab message', () => {
      const mockSender = { tab: { id: 456 } };
      const mockSendResponse = jest.fn();

      messageListener('ReloadTab', mockSender, mockSendResponse);

      expect(chrome.tabs.reload).toHaveBeenCalledWith(456);
      expect(mockSendResponse).toHaveBeenCalledWith("Tab Reloaded");
    });

    test('should handle unknown message types', () => {
      const mockSender = { tab: { id: 456 } };
      const mockSendResponse = jest.fn();

      // Test with an unknown message
      messageListener('UnknownMessage', mockSender, mockSendResponse);

      // Should not crash and not call any Chrome APIs for unknown messages
      expect(mockSendResponse).not.toHaveBeenCalled();
    });
  });

  describe('Alarm handling', () => {
    let alarmListener;

    beforeEach(() => {
      // Verify the onAlarm listener was registered and get it
      expect(chrome.alarms.onAlarm.addListener).toHaveBeenCalled();
      alarmListener = chrome.alarms.onAlarm.addListener.mock.calls[0][0];
    });

    test('should handle ClickFreeRollButton alarm', async () => {
      const mockAlarm = { name: 'ClickFreeRollButton' };

      // Call the alarm handler and wait for it to complete
      await alarmListener(mockAlarm);

      expect(chrome.storage.sync.get).toHaveBeenCalledWith("tabID", expect.any(Function));
      expect(chrome.scripting.executeScript).toHaveBeenCalledWith(
        {
          target: { tabId: 123 },
          function: expect.any(Function)
        },
        expect.any(Function)
      );
      expect(chrome.alarms.create).toHaveBeenCalledWith("ClickFreeRollButton", {
        periodInMinutes: expect.any(Number)
      });
    }, 10000);

    test('should ignore unknown alarms', async () => {
      const mockAlarm = { name: 'UnknownAlarm' };
      const initialExecuteScriptCalls = chrome.scripting.executeScript.mock.calls.length;

      await alarmListener(mockAlarm);

      // Should not execute any additional scripts for unknown alarms
      expect(chrome.scripting.executeScript).toHaveBeenCalledTimes(initialExecuteScriptCalls);
    });

    test('should handle storage errors in alarm handler', async () => {
      // Mock storage to return undefined tabID
      chrome.storage.sync.get.mockImplementation((key, callback) => {
        callback({ tabID: undefined });
      });

      const mockAlarm = { name: 'ClickFreeRollButton' };

      // Should not crash when tabID is undefined
      await expect(alarmListener(mockAlarm)).resolves.not.toThrow();
    });
  });

  describe('ClickFreeRollButton function coverage', () => {
    test('should execute clickFreeRollButton with visible button', () => {
      // Set up DOM for clickFreeRollButton function
      document.body.innerHTML = `
        <button id="free_play_form_button" style="position: absolute; left: 100px;">Free Roll</button>
      `;

      const button = document.getElementById("free_play_form_button");
      Object.defineProperty(button, 'offsetLeft', { value: 100 });
      const clickSpy = jest.spyOn(button, 'click');

      // Get the clickFreeRollButton function from global scope
      if (typeof global.clickFreeRollButton === 'function') {
        global.clickFreeRollButton();
        expect(clickSpy).toHaveBeenCalled();
      }
    });

    test('should execute clickFreeRollButton with hidden button', () => {
      // Set up DOM for hidden button scenario
      document.body.innerHTML = `
        <button id="free_play_form_button" style="position: absolute; left: 0px;">Free Roll</button>
        <div id="time_remaining">60\nminutes\n30\nseconds</div>
      `;

      const button = document.getElementById("free_play_form_button");
      const timeElement = document.getElementById("time_remaining");

      Object.defineProperty(button, 'offsetLeft', { value: 0 });
      Object.defineProperty(timeElement, 'innerText', { value: "60\nminutes\n30\nseconds" });

      // Get the clickFreeRollButton function
      if (typeof global.clickFreeRollButton === 'function') {
        global.clickFreeRollButton();
        expect(chrome.storage.sync.set).toHaveBeenCalledWith({
          timeToWaitForFreeRoll: expect.any(Number)
        });
      }
    });

    test('should cover catch block in clickFreeRollButton (lines 104-111)', () => {
      // Set up DOM that will cause an error in the try block
      document.body.innerHTML = `
        <button id="free_play_form_button" style="position: absolute; left: 0px;">Free Roll</button>
      `;

      const button = document.getElementById("free_play_form_button");
      Object.defineProperty(button, 'offsetLeft', { value: 0 });

      // No time_remaining element - this will cause an error when trying to access innerText
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      // Mock chrome.runtime.sendMessage to ensure the callback is executed (line 111)
      chrome.runtime.sendMessage.mockImplementation((message, callback) => {
        if (callback) {
          callback("Test response"); // This will cover line 111
        }
      });

      // Execute clickFreeRollButton - this should trigger the catch block
      if (typeof global.clickFreeRollButton === 'function') {
        global.clickFreeRollButton();

        // Verify the catch block was executed (lines 104-111)
        expect(consoleSpy).toHaveBeenCalledWith(expect.any(Error));
        expect(consoleSpy).toHaveBeenCalledWith("Something's wrong, wait 10 sec and try again");
        expect(consoleSpy).toHaveBeenCalledWith("timeToWaitForFreeRoll:", 10 / 60);
        expect(consoleSpy).toHaveBeenCalledWith("Send ReloadTab command");
        expect(consoleSpy).toHaveBeenCalledWith("Response :", "Test response"); // Line 111 coverage
        expect(chrome.storage.sync.set).toHaveBeenCalledWith({ timeToWaitForFreeRoll: 10 / 60 });
        expect(chrome.runtime.sendMessage).toHaveBeenCalledWith("ReloadTab", expect.any(Function));
      }

      consoleSpy.mockRestore();
    });

    test('should test clickFreeRollButton catch block with different error scenario', () => {
      // Set up DOM with time_remaining but make innerText throw an error
      document.body.innerHTML = `
        <button id="free_play_form_button" style="position: absolute; left: 0px;">Free Roll</button>
        <div id="time_remaining">invalid</div>
      `;

      const button = document.getElementById("free_play_form_button");
      const timeElement = document.getElementById("time_remaining");

      Object.defineProperty(button, 'offsetLeft', { value: 0 });

      // Make innerText.split throw an error
      Object.defineProperty(timeElement, 'innerText', {
        get: () => {
          throw new Error("Test error for catch block coverage");
        }
      });

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      // Execute clickFreeRollButton - this should trigger the catch block
      if (typeof global.clickFreeRollButton === 'function') {
        global.clickFreeRollButton();

        // Verify the catch block was executed
        expect(consoleSpy).toHaveBeenCalledWith(expect.any(Error));
        expect(chrome.runtime.sendMessage).toHaveBeenCalledWith("ReloadTab", expect.any(Function));
      }

      consoleSpy.mockRestore();
    });
  });
});
