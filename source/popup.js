let startAutoClick = document.getElementById("startAutoClick");
let stopAutoClick = document.getElementById("stopAutoClick");

startAutoClick.addEventListener("click", async () => {
  let [tab] = await chrome.tabs.query({active: true, currentWindow: true});
  chrome.scripting.executeScript({
    target: {tabId: tab.id},
    function: sendStartAutoClickCommand,
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
  chrome.runtime.sendMessage("StopAutoClick", (response => {
    console.log("Response :", response)
  }))
}

function sendStartAutoClickCommand() {
  console.log("Sending tabID to start Auto Click")
  chrome.runtime.sendMessage("StartAutoClick", (response => {
    console.log("Response :", response)
  }))
}

