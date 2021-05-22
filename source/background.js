try {
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

} catch (e) {
  console.error(e);
}