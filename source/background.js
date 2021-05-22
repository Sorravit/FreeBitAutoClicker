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
  // 2. A page requested user data, respond with a copy of `user`
  console.log(message)
  console.log(sender)
  if (message === 'messageNaja') {
    sendResponse("Hello");
  }
});