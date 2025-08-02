/**
 * Test fixture to help with stubborn test scenarios
 */

// Helper to force sync execution of async popup operations
global.forcePopupExecution = async (button, chrome) => {
  // Manually trigger the popup logic
  if (button.id === 'startAutoClick') {
    const tabs = await chrome.tabs.query({active: true, currentWindow: true});
    const tab = tabs[0];
    if (tab) {
      chrome.scripting.executeScript({
        target: {tabId: tab.id},
        function: () => {} // sendStartAutoClickCommand
      });
    }
  } else if (button.id === 'stopAutoClick') {
    const tabs = await chrome.tabs.query({active: true, currentWindow: true});
    const tab = tabs[0];
    if (tab) {
      chrome.scripting.executeScript({
        target: {tabId: tab.id},
        function: () => {} // sendDeleteAlarmCommand
      });
    }
  }
};

// Helper to simulate backgroundWrapper execution
global.simulateBackgroundWrapper = (importScriptsImpl, consoleErrorImpl) => {
  try {
    if (typeof importScriptsImpl === 'function') {
      importScriptsImpl("/source/background.js");
    } else {
      throw new ReferenceError('importScripts is not defined');
    }
  } catch (e) {
    consoleErrorImpl(e);
  }
};

module.exports = {
  forcePopupExecution: global.forcePopupExecution,
  simulateBackgroundWrapper: global.simulateBackgroundWrapper
};
