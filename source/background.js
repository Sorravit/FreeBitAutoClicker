console.log("Starting Service Worker")

chrome.runtime.onInstalled.addListener(() => {
  let timeToWait = 10 / 60
  chrome.storage.sync.set({timeToWait});
});
chrome.alarms.onAlarm.addListener(function (alarm) {
  console.log(alarm.name)
  if (alarm.name === "ClickButton") {
    chrome.storage.sync.get("tabID", ({tabID}) => {
      console.log("Auto click on tab ", tabID)
      chrome.scripting.executeScript({
        target: {tabId: tabID},
        function: clickButton,
      });
    });
    chrome.storage.sync.get("timeToWait", ({timeToWait}) => {
      let now = new Date();
      console.log("Reset Alarm at:", now.toUTCString())
      console.log("TiMe To WaIt:",timeToWait)
      chrome.alarms.create("ClickButton", {periodInMinutes: timeToWait})
    })
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
    button.click()
    let now = new Date();
    console.log("Clicked Free roll at:", now.toUTCString())
    let timeToWait = 60 + (10 / 60)
    chrome.storage.sync.set({timeToWait});
  } else {
    //Check remaining time and wait for it
    let timeString = document.getElementById("time_remaining").innerText.split("\n");
    let timeToWait = parseInt(timeString[0]) + parseInt(timeString[2]) / 60 + 10 / 60
    let now = new Date();
    console.log("Unable to Click free roll at:", now.toUTCString())
    console.log("timeToWait:", timeToWait)
    chrome.storage.sync.set({timeToWait});
  }
}