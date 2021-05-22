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
  console.log(message)
  console.log(sender)
  console.log("sent from tab.id=", sender.tab.id);
  if (message === 'messageNaja') {
    sendResponse("Hello");
  }
  if (message==='tabID'){
    console.log("Getting tabID from tab")
    console.log(sender.tab)
    console.log(sender.id)
    console.log(sender.url)
    chrome.scripting.executeScript({
      target: {tabId:sender.tab.id},
      function: callFromBackground,
    });
    sendResponse("Id received")
  }
});

function callFromBackground(){
  console.log("This function was called from the background serviceWorker and is written in background")
}