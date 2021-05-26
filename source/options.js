let needToSolveCaptcha = document.getElementsByName("haveCaptcha")
needToSolveCaptcha.forEach(element => {
  element.addEventListener("click", saveCaptchaSetting)
})
chrome.storage.onChanged.addListener(() => {
  chrome.storage.sync.get("haveCaptcha", displayCaptchaSetting);
})
chrome.storage.sync.get("haveCaptcha", displayCaptchaSetting);

function displayCaptchaSetting(data) {
  console.log("Have Captcha Value:", data.haveCaptcha)
  needToSolveCaptcha.forEach((choice) => {
    if (choice.value === data.haveCaptcha) {
      choice.checked = true
    }
  })
}

function saveCaptchaSetting(event) {
  let haveCaptcha = event.target.value
  chrome.storage.sync.set({haveCaptcha})
}