let startAutoClick = document.getElementById("startAutoClick");
let stopAutoClick = document.getElementById("stopAutoClick");
let countdownDisplay = document.getElementById("countdownDisplay");

async function onStartClick() {
  let [tab] = await chrome.tabs.query({active: true, currentWindow: true});
  await chrome.scripting.executeScript({
    target: {tabId: tab.id},
    function: sendStartAutoClickCommand,
  });
}

async function onStopClick() {
  let [tab] = await chrome.tabs.query({active: true, currentWindow: true});
  await chrome.scripting.executeScript({
    target: {tabId: tab.id},
    function: sendDeleteAlarmCommand,
  });
}

if (startAutoClick) startAutoClick.addEventListener("click", onStartClick);

if (stopAutoClick) stopAutoClick.addEventListener("click", onStopClick);

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
  if (!countdownDisplay) {
    // Lazily resolve in case DOM was not ready at module load (useful for tests and robustness)
    countdownDisplay = document.getElementById("countdownDisplay");
    if (!countdownDisplay) return;
  }
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
function handleInitialCountdownResponse(response) {
  console.log("Response :", response)
  if (response && typeof response.timeLeft === "number") {
    updateCountdownDisplay(response.timeLeft);
  }
}
chrome.runtime.sendMessage("GetCountdown", handleInitialCountdownResponse);

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
  // Expose UI helpers for deterministic testing
  global.updateCountdownDisplay = updateCountdownDisplay;
  global.formatTime = formatTime;
  // Expose click handlers for deterministic testing
  global.onStartClick = onStartClick;
  global.onStopClick = onStopClick;
  // Expose initial countdown response handler for testing
  global.handleInitialCountdownResponse = handleInitialCountdownResponse;
}
