console.log("Starting Service Worker")

chrome.runtime.onInstalled.addListener(() => {
  let timeToWait = 10 / 60
  chrome.storage.sync.set({timeToWait});
});

function storageSyncGetAsync(key) {
  return new Promise((resolve, reject) => {
    chrome.storage.sync.get(key, (items) => {
      return resolve(items)
    })
  })
}

function executeScriptAsync(options) {
  return new Promise((resolve, reject) => {
    chrome.scripting.executeScript(options, (res) => {
      return resolve()
    })
  })
}

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === 'ClickButton') {
    const {tabID} = await storageSyncGetAsync('tabID')
    await executeScriptAsync({
      target: {tabId: tabID},
      function: clickButton,
    })
    const {timeToWait} = await storageSyncGetAsync('timeToWait')
    let now = new Date();
    console.log('Reset Alarm at:', now.toUTCString())
    console.log('TiMe To WaIt:', timeToWait)
    await chrome.alarms.create('ClickButton', {periodInMinutes: timeToWait})
  }
})


chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log("Get message '", message, "' from tab id ", sender.tab.id);
  if (message === 'StartAutoClick') {
    const tabID = sender.tab.id
    chrome.storage.sync.set({tabID});
    chrome.alarms.create("ClickButton", {periodInMinutes: 10 / 60})
    chrome.scripting.executeScript({
      target: {tabId: tabID},
      function: clickButton,
    });
    sendResponse("TabId received, Commencing Auto click process")
  } else if (message === 'StopAutoClick') {
    chrome.alarms.clear("ClickButton");
    sendResponse("Auto click process terminated")
  }
});

function clickButton() {
  //checkButtonVisibility
  let button = document.getElementById("free_play_form_button");
  if (button.offsetLeft) {
    //Button is visible
    //Make decision about captcha
    chrome.storage.sync.get("haveCaptcha", data => {
      if (data.haveCaptcha === "true") {
        console.log("Clicking on play without Captcha")
        let captchaButton = document.getElementById("play_without_captchas_button")
        if (captchaButton) {
          captchaButton.click()
          console.log("Clicked on play without Captcha")
        }
      } else {
        console.log("You have no captcha to worry about")
      }
    });
    //Click the roll button
    button.click()
    let now = new Date();
    console.log("Clicked Free roll at:", now.toUTCString())
    let timeToWait = 60 + (10 / 60)
    chrome.storage.sync.set({timeToWait});
  } else {
    try {
      //Check remaining time and wait for it
      let timeString = document.getElementById("time_remaining").innerText.split("\n");
      let timeToWait = parseInt(timeString[0]) + parseInt(timeString[2]) / 60 + 10 / 60
      let now = new Date();
      console.log("Unable to Click free roll at:", now.toUTCString())
      console.log("timeToWait:", timeToWait)
      chrome.storage.sync.set({timeToWait});
    } catch (e) {
      console.log(e)
      console.log("Something's wrong, wait 10 sec and try again")
      let timeToWait = 10 / 60
      console.log("timeToWait:", timeToWait)
      chrome.storage.sync.set({timeToWait});
    }
  }
}
