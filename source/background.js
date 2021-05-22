let color = '#3aa757';

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.sync.set({color});
  console.log('Default background color set to %cgreen', `color: ${color}`);
});
console.log("HELLO")
chrome.alarms.create("SimpleLog", {periodInMinutes: 2})
chrome.alarms.onAlarm.addListener(function (alarm) {
  console.log(alarm.name);
  const now = new Date();
  console.log(now.toUTCString());
})

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log("Get message '", message, "' from tab id ", sender.tab.id);
  if (message === 'tabID') {
    console.log("Getting tabID from tab")
    chrome.scripting.executeScript({
      target: {tabId: sender.tab.id},
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