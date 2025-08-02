/**
 * Tests for backgroundWrapper.js - Service worker entry point
 */

const { simulateBackgroundWrapper } = require('./testFixture');

describe('Background Wrapper', () => {
  let originalImportScripts;
  let originalConsoleError;

  beforeEach(() => {
    // Store original functions
    originalImportScripts = global.importScripts;
    originalConsoleError = console.error;
  });

  afterEach(() => {
    // Restore original functions
    if (originalImportScripts !== undefined) {
      global.importScripts = originalImportScripts;
    } else {
      delete global.importScripts;
    }
    console.error = originalConsoleError;
  });

  test('should import background.js successfully', () => {
    // Mock successful import and console
    const importScriptsMock = jest.fn();
    const consoleErrorMock = jest.fn();

    // Use the test fixture to simulate the wrapper execution
    simulateBackgroundWrapper(importScriptsMock, consoleErrorMock);

    expect(importScriptsMock).toHaveBeenCalledWith("/source/background.js");
    expect(consoleErrorMock).not.toHaveBeenCalled();
  });

  test('should handle import errors gracefully', () => {
    const mockError = new Error('Failed to import script');
    const importScriptsMock = jest.fn(() => {
      throw mockError;
    });
    const consoleErrorMock = jest.fn();

    // Use the test fixture to simulate the wrapper execution
    simulateBackgroundWrapper(importScriptsMock, consoleErrorMock);

    expect(importScriptsMock).toHaveBeenCalledWith("/source/background.js");
    expect(consoleErrorMock).toHaveBeenCalledWith(mockError);
  });

  test('should handle missing importScripts function', () => {
    // Pass undefined to simulate missing importScripts
    const consoleErrorMock = jest.fn();

    // Use the test fixture to simulate the wrapper execution
    simulateBackgroundWrapper(undefined, consoleErrorMock);

    // Should have logged a ReferenceError
    expect(consoleErrorMock).toHaveBeenCalledWith(
      expect.any(ReferenceError)
    );
  });
});
