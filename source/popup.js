// Initialize button with user's preferred color
let startAutoClick = document.getElementById("startAutoClick");
let stopAutoClick = document.getElementById("stopAutoClick");


startAutoClick.addEventListener("click", async () => {
  let [tab] = await chrome.tabs.query({active: true, currentWindow: true});
  chrome.scripting.executeScript({
    target: {tabId: tab.id},
    function: sendTabID,
  });
});

stopAutoClick.addEventListener("click", async () => {
  let [tab] = await chrome.tabs.query({active: true, currentWindow: true});
  chrome.scripting.executeScript({
    target: {tabId: tab.id},
    function: sendDeleteAlarmCommand,
  });
});
function sendDeleteAlarmCommand() {
  console.log("Sending Delete Alarm Command")
  chrome.runtime.sendMessage("DeleteAlarm", (response => {
    console.log("Response :", response)
  }))
}


function sendTabID() {
  console.log("Sending tabID")
  chrome.runtime.sendMessage("tabID", (response => {
    console.log("Response :", response)
  }))
}

