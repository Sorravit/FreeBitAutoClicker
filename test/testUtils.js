/**
 * Test utilities and helper functions for FreeBit Auto Clicker tests
 */

// Mock DOM elements for testing
export const createMockFreebitPage = (options = {}) => {
  const {
    buttonVisible = true,
    timeRemaining = "60\n\n10\n",
    hasCaptchaButton = false
  } = options;

  let html = `
    <button id="free_play_form_button" 
            style="position: absolute; left: ${buttonVisible ? '100px' : '0px'};">
      Free Roll
    </button>
    <div id="time_remaining">${timeRemaining}</div>
  `;

  if (hasCaptchaButton) {
    html += `<button id="play_without_captchas_button">Play Without Captcha</button>`;
  }

  document.body.innerHTML = html;

  // Mock offsetLeft property
  const button = document.getElementById("free_play_form_button");
  if (button) {
    Object.defineProperty(button, 'offsetLeft', {
      value: buttonVisible ? 100 : 0,
      configurable: true
    });
  }
};

// Mock Chrome extension environment
export const setupChromeExtensionMocks = () => {
  // Reset all chrome API mocks
  jest.clearAllMocks();

  // Setup default chrome.storage.sync.get behavior
  chrome.storage.sync.get.mockImplementation((key, callback) => {
    const defaultData = {
      timeToWaitForFreeRoll: 10 / 60,
      tabID: 123,
      haveCaptcha: "false"
    };

    if (typeof key === 'string') {
      callback({ [key]: defaultData[key] });
    } else if (Array.isArray(key)) {
      const result = {};
      key.forEach(k => {
        result[k] = defaultData[k];
      });
      callback(result);
    } else {
      callback(defaultData);
    }
  });

  // Setup default chrome.tabs.query behavior
  chrome.tabs.query.mockResolvedValue([{ id: 123, active: true, currentWindow: true }]);

  // Setup default chrome.scripting.executeScript behavior
  chrome.scripting.executeScript.mockResolvedValue([]);

  // Setup default storage set behavior
  chrome.storage.sync.set.mockImplementation((data, callback) => {
    if (callback) callback();
  });

  // Setup default alarm behaviors
  chrome.alarms.create.mockImplementation((name, options, callback) => {
    if (callback) callback();
  });

  chrome.alarms.clear.mockImplementation((name, callback) => {
    if (callback) callback(true);
  });

  // Setup default message handling
  chrome.runtime.sendMessage.mockImplementation((message, callback) => {
    if (callback) {
      callback("Mock response");
    }
  });
};

// Simulate time passage for testing alarms
export const simulateTimePassage = (minutes) => {
  const mockDate = new Date();
  mockDate.setMinutes(mockDate.getMinutes() + minutes);
  jest.spyOn(global, 'Date').mockImplementation(() => mockDate);
};

// Assert that an alarm was created with correct timing
export const expectAlarmCreated = (name, periodInMinutes) => {
  expect(chrome.alarms.create).toHaveBeenCalledWith(name, {
    periodInMinutes: periodInMinutes
  });
};

// Assert that storage was updated with correct values
export const expectStorageUpdated = (expectedData) => {
  expect(chrome.storage.sync.set).toHaveBeenCalledWith(expectedData);
};

// Create a mock event for testing
export const createMockEvent = (type, target = {}) => {
  return {
    type,
    target,
    preventDefault: jest.fn(),
    stopPropagation: jest.fn()
  };
};

// Wait for async operations to complete
export const waitForAsync = () => new Promise(resolve => setTimeout(resolve, 0));
