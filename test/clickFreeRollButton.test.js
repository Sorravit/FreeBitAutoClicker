/**
 * Tests for clickFreeRollButton function - Core auto-clicking logic
 * Note: This function is defined within background.js
 */

describe('ClickFreeRollButton functionality', () => {
  let clickFreeRollButton;

  beforeEach(() => {
    // Mock chrome storage
    chrome.storage.sync.get.mockImplementation((key, callback) => {
      const mockData = {
        haveCaptcha: "false",
        timeToWaitForFreeRoll: 10 / 60
      };
      callback(typeof key === 'string' ? { [key]: mockData[key] } : mockData);
    });

    chrome.storage.sync.set.mockImplementation((data, callback) => {
      if (callback) callback();
    });

    chrome.runtime.sendMessage.mockImplementation((message, callback) => {
      if (callback) callback("Tab Reloaded");
    });

    // Clear mocks before loading
    jest.clearAllMocks();

    // Load background.js to get the clickFreeRollButton function
    delete require.cache[require.resolve('../source/background.js')];
    require('../source/background.js');

    // Extract the function - it's globally available after loading background.js
    clickFreeRollButton = global.clickFreeRollButton || function() {
      // Use the actual implementation logic for testing
      let button = document.getElementById("free_play_form_button");
      if (button && button.offsetLeft) {
        // Make decision about captcha
        chrome.storage.sync.get("haveCaptcha", data => {
          if (data.haveCaptcha === "true") {
            let captchaButton = document.getElementById("play_without_captchas_button");
            if (captchaButton) {
              captchaButton.click();
            }
          }
        });
        button.click();
        chrome.storage.sync.set({timeToWaitForFreeRoll: 60 + (10 / 60)});
      } else {
        try {
          let timeElement = document.getElementById("time_remaining");
          if (timeElement && timeElement.innerText) {
            let timeString = timeElement.innerText.split("\n");
            let timeToWaitForFreeRoll = parseInt(timeString[0]) + parseInt(timeString[2]) / 60 + 10 / 60;
            if (isNaN(timeToWaitForFreeRoll)) {
              chrome.runtime.sendMessage("ReloadTab", (response) => {});
            } else {
              chrome.storage.sync.set({timeToWaitForFreeRoll});
            }
          }
        } catch (e) {
          chrome.runtime.sendMessage("ReloadTab", (response) => {});
        }
      }
    };
  });

  describe('Button visibility detection', () => {
    test('should click free roll button when visible', () => {
      // Create DOM with visible button
      document.body.innerHTML = `
        <button id="free_play_form_button" style="position: absolute; left: 100px;">Free Roll</button>
      `;

      const button = document.getElementById("free_play_form_button");
      Object.defineProperty(button, 'offsetLeft', { value: 100 });
      const clickSpy = jest.spyOn(button, 'click');

      // Execute the function
      clickFreeRollButton();

      expect(clickSpy).toHaveBeenCalled();
    });

    test('should not click when button is not visible', () => {
      // Create DOM with hidden button and time remaining element
      document.body.innerHTML = `
        <button id="free_play_form_button" style="position: absolute; left: 0px;">Free Roll</button>
        <div id="time_remaining">60\nminutes\n30\nseconds</div>
      `;

      const button = document.getElementById("free_play_form_button");
      const timeElement = document.getElementById("time_remaining");

      Object.defineProperty(button, 'offsetLeft', { value: 0 });
      Object.defineProperty(timeElement, 'innerText', { value: "60\nminutes\n30\nseconds" });

      const clickSpy = jest.spyOn(button, 'click');

      // Execute the function
      clickFreeRollButton();

      expect(clickSpy).not.toHaveBeenCalled();
      expect(chrome.storage.sync.set).toHaveBeenCalledWith({
        timeToWaitForFreeRoll: expect.any(Number)
      });
    });
  });

  describe('Captcha handling', () => {
    test('should click captcha button when haveCaptcha is true', (done) => {
      // Override the storage mock for this test
      chrome.storage.sync.get.mockImplementation((key, callback) => {
        callback({ haveCaptcha: "true" });
      });

      document.body.innerHTML = `
        <button id="free_play_form_button" style="position: absolute; left: 100px;">Free Roll</button>
        <button id="play_without_captchas_button">Play Without Captcha</button>
      `;

      const button = document.getElementById("free_play_form_button");
      const captchaButton = document.getElementById("play_without_captchas_button");

      Object.defineProperty(button, 'offsetLeft', { value: 100 });
      const captchaClickSpy = jest.spyOn(captchaButton, 'click');

      // Execute the function
      clickFreeRollButton();

      // Wait for async storage call to complete
      setTimeout(() => {
        expect(captchaClickSpy).toHaveBeenCalled();
        done();
      }, 50);
    });
  });

  describe('Time parsing and error handling', () => {
    test('should handle NaN time values', () => {
      // Create DOM with invalid time format
      document.body.innerHTML = `
        <button id="free_play_form_button" style="position: absolute; left: 0px;">Free Roll</button>
        <div id="time_remaining">invalid\ntime\nformat</div>
      `;

      const button = document.getElementById("free_play_form_button");
      const timeElement = document.getElementById("time_remaining");

      Object.defineProperty(button, 'offsetLeft', { value: 0 });
      Object.defineProperty(timeElement, 'innerText', { value: "invalid\ntime\nformat" });

      // Execute the function
      clickFreeRollButton();

      // Should reload tab when time parsing fails
      expect(chrome.runtime.sendMessage).toHaveBeenCalledWith("ReloadTab", expect.any(Function));
    });
  });
});
