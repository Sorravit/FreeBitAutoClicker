// Jest setup for Chrome extension testing
const chrome = require('jest-chrome');

// Make chrome available globally
global.chrome = chrome;

// Initialize Chrome API mocks explicitly
global.chrome.runtime = {
  sendMessage: jest.fn(),
  onInstalled: {
    addListener: jest.fn()
  },
  onMessage: {
    addListener: jest.fn()
  }
};

global.chrome.storage = {
  sync: {
    get: jest.fn(),
    set: jest.fn()
  },
  onChanged: {
    addListener: jest.fn()
  }
};

global.chrome.tabs = {
  query: jest.fn(),
  reload: jest.fn()
};

global.chrome.scripting = {
  executeScript: jest.fn()
};

global.chrome.alarms = {
  create: jest.fn(),
  clear: jest.fn(),
  onAlarm: {
    addListener: jest.fn()
  }
};

// Setup DOM environment
document.body.innerHTML = '';

// Mock console methods to avoid noise in tests
global.console = {
  ...console,
  log: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Helper function to create DOM elements for testing
global.createMockDOM = (htmlString) => {
  document.body.innerHTML = htmlString;
};

// Helper to reset Chrome API mocks between tests
beforeEach(() => {
  // Only clear the specific mocks we care about, don't clear addListener calls
  if (chrome.storage?.sync?.get?.mockClear) {
    chrome.storage.sync.get.mockClear();
  }
  if (chrome.storage?.sync?.set?.mockClear) {
    chrome.storage.sync.set.mockClear();
  }
  if (chrome.tabs?.query?.mockClear) {
    chrome.tabs.query.mockClear();
  }
  if (chrome.scripting?.executeScript?.mockClear) {
    chrome.scripting.executeScript.mockClear();
  }
  if (chrome.alarms?.create?.mockClear) {
    chrome.alarms.create.mockClear();
  }
  if (chrome.alarms?.clear?.mockClear) {
    chrome.alarms.clear.mockClear();
  }
  if (chrome.tabs?.reload?.mockClear) {
    chrome.tabs.reload.mockClear();
  }
  if (chrome.runtime?.sendMessage?.mockClear) {
    chrome.runtime.sendMessage.mockClear();
  }

  // DO NOT clear the addListener calls as they track event registrations
});
