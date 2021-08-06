console.log("Starting Service Worker")

chrome.runtime.onInstalled.addListener(() => {
  let timeToWaitForFreeRoll = 10 / 60
  chrome.storage.sync.set({timeToWaitForFreeRoll});
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
  if (alarm.name === 'ClickFreeRollButton') {
    const {tabID} = await storageSyncGetAsync('tabID')
    await executeScriptAsync({
      target: {tabId: tabID},
      function: clickFreeRollButton,
    })
    const {timeToWaitForFreeRoll} = await storageSyncGetAsync('timeToWaitForFreeRoll')
    let now = new Date();
    console.log('Reset Alarm at:', now.toUTCString())
    console.log('TiMe To WaIt FoR fReE rOlL:', timeToWaitForFreeRoll)
    await chrome.alarms.create('ClickFreeRollButton', {periodInMinutes: timeToWaitForFreeRoll})
  }
})


chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log("Get message '", message, "' from tab id ", sender.tab.id);
  if (message === 'StartAutoClick') {
    const tabID = sender.tab.id
    chrome.storage.sync.set({tabID});
    chrome.alarms.create("ClickFreeRollButton", {periodInMinutes: 10 / 60})
    chrome.scripting.executeScript({
      target: {tabId: tabID},
      function: clickFreeRollButton,
    });
    sendResponse("TabId received, Commencing Auto click process")
  } else if (message === 'StopAutoClick') {
    chrome.alarms.clear("ClickFreeRollButton");
    sendResponse("Auto click process terminated")
  }
});

function clickFreeRollButton() {
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
    let timeToWaitForFreeRoll = 60 + (10 / 60)
    chrome.storage.sync.set({timeToWaitForFreeRoll});
  } else {
    try {
      //Check remaining time and wait for it
      let timeString = document.getElementById("time_remaining").innerText.split("\n");
      let timeToWaitForFreeRoll = parseInt(timeString[0]) + parseInt(timeString[2]) / 60 + 10 / 60
      let now = new Date();
      console.log("Unable to Click free roll at:", now.toUTCString())
      console.log("timeToWaitForFreeRoll:", timeToWaitForFreeRoll)
      chrome.storage.sync.set({timeToWaitForFreeRoll});
    } catch (e) {
      console.log(e)
      console.log("Something's wrong, wait 10 sec and try again")
      let timeToWaitForFreeRoll = 10 / 60
      console.log("timeToWaitForFreeRoll:", timeToWaitForFreeRoll)
      chrome.storage.sync.set({timeToWaitForFreeRoll});
    }
  }
}
