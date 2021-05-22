// Initialize button with user's preferred color
let changeColor = document.getElementById("changeColor");
let sendMessage = document.getElementById("sendMessage");

chrome.storage.sync.get("color", ({color}) => {
  changeColor.style.backgroundColor = color;
});

// When the button is clicked, inject setPageBackgroundColor into current page
changeColor.addEventListener("click", async () => {
  let [tab] = await chrome.tabs.query({active: true, currentWindow: true});

  chrome.scripting.executeScript({
    target: {tabId: tab.id},
    function: setPageBackgroundColor,
  });
});

function setPageBackgroundColor() {
  console.log("Change Color");
  chrome.storage.sync.get("color", ({color}) => {
    document.body.style.backgroundColor = color;
  });
  chrome.runtime.sendMessage("messageNaja", (response => {
    console.log("Got ", response, " as a response")
  }))
}

sendMessage.addEventListener("click", async () => {
  let [tab] = await chrome.tabs.query({active: true, currentWindow: true});
  chrome.scripting.executeScript({
    target: {tabId: tab.id},
    function: sendTabID,
  });
});

function sendTabID() {
  chrome.runtime.sendMessage("tabID", (response => {
    console.log("Got ", response, " as a response")
  }))
}

