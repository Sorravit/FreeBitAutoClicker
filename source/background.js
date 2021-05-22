console.log("Starting Service Worker")

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
  }
})

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log("Get message '", message, "' from tab id ", sender.tab.id);
  if (message === 'StartAutoClick') {
    const tabID = sender.tab.id
    chrome.storage.sync.set({startAutoClickAlarm: tabID});
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
    chrome.alarms.create("ClickButton", {periodInMinutes: 60+(10/60)})
  }else{
    //Check remaining time and wait for it
    let timeString = document.getElementById("time_remaining").innerText.split("\n");
    let timeToWait = parseInt(timeString[0])+parseInt(timeString[2])/60 + 10/60
    chrome.alarms.create("ClickButton", {periodInMinutes: 60+(10/60)})
  }
}