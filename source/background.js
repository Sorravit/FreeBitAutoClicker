let color = '#3aa757';

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.sync.set({color});
  console.log('Default background color set to %cgreen', `color: ${color}`);
});
console.log("HELLO")
chrome.alarms.create("SimpleLog", {periodInMinutes: 10 / 60})
chrome.alarms.onAlarm.addListener(function (alarm) {
  console.log(alarm.name)
  if (alarm.name === "SimpleLog") {
    console.log("Logging because it's a simple log alarm")
    const now = new Date();
    console.log(now.toUTCString());
  } else if (alarm.name === "ClickButton") {
    chrome.storage.sync.get("tabID", ({tabID}) => {
      chrome.scripting.executeScript({
        target: {tabId: tabID},
        function: clickButton,
      });
    });

  }
})


chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log("Get message '", message, "' from tab id ", sender.tab.id);
  if (message === 'tabID') {
    console.log("Getting tabID from tab")
    const tabID = sender.tab.id
    chrome.storage.sync.set({tabID});
    chrome.alarms.create("ClickButton", {periodInMinutes: 10 / 60})
    chrome.scripting.executeScript({
      target: {tabId: tabID},
      function: clickButton,
    });
    sendResponse("TabId received")
  }
});

function callFromBackground() {
  console.log("This function was called from the background serviceWorker and is written in background")
}

function clickButton() {
  const button = document.getElementById("clickMe");
  button.click();

}