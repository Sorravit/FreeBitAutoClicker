let startAutoClick = document.getElementById("startAutoClick");
let stopAutoClick = document.getElementById("stopAutoClick");
let countdownDisplay = document.getElementById("countdownDisplay");

startAutoClick.addEventListener("click", async () => {
  let [tab] = await chrome.tabs.query({active: true, currentWindow: true});
  await chrome.scripting.executeScript({
    target: {tabId: tab.id},
    function: sendStartAutoClickCommand,
  });
});

stopAutoClick.addEventListener("click", async () => {
  let [tab] = await chrome.tabs.query({active: true, currentWindow: true});
  await chrome.scripting.executeScript({
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

function updateCountdownDisplay(timeLeft) {
  countdownDisplay.textContent = timeLeft > 0
    ? `Next click in: ${formatTime(timeLeft)}`
    : "No Auto Click Running";
}

function formatTime(seconds) {
  const min = Math.floor(seconds / 60);
  const sec = Math.floor(seconds % 60);
  return `${min}:${sec.toString().padStart(2, '0')}`;
}

// Request countdown when popup opens
chrome.runtime.sendMessage("GetCountdown", (response) => {
  console.log("Response :", response)
  if (response && typeof response.timeLeft === "number") {
    updateCountdownDisplay(response.timeLeft);
  }
});

// Listen for countdown updates
chrome.runtime.onMessage.addListener((message) => {
  if (message.type === "CountdownUpdate" && typeof message.timeLeft === "number") {
    updateCountdownDisplay(message.timeLeft);
  }
});

// Make functions globally accessible for testing
if (typeof global !== 'undefined') {
  global.sendStartAutoClickCommand = sendStartAutoClickCommand;
  global.sendDeleteAlarmCommand = sendDeleteAlarmCommand;
}
