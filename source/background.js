console.log("Starting Service Worker")

chrome.runtime.onInstalled.addListener(() => {
  let timeToWaitForFreeRoll = 10 / 60
  let timeToWaitForRewardMultiplier = 10 / 60
  chrome.storage.sync.set({timeToWaitForFreeRoll});
  chrome.storage.sync.set({timeToWaitForRewardMultiplier});
});

function storageSyncGetAsync(key) {
  return new Promise((resolve, reject) => {
    chrome.storage.sync.get(key, (items) => {
      return resolve(items)
    })
  })
}

function executeScriptAsync(options) {
  return new Promise((resolve, reject) => {
    chrome.scripting.executeScript(options, (res) => {
      return resolve()
    })
  })
}

chrome.alarms.onAlarm.addListener(async (alarm) => {
  const {tabID} = await storageSyncGetAsync('tabID')
  if (alarm.name === 'ClickFreeRollButton') {
    await executeScriptAsync({
      target: {tabId: tabID},
      function: clickFreeRollButton,
    })
    const {timeToWaitForFreeRoll} = await storageSyncGetAsync('timeToWaitForFreeRoll')
    let now = new Date();
    console.log('Reset free roll Alarm at:', now.toUTCString())
    console.log('TiMe To WaIt FoR fReE rOlL:', timeToWaitForFreeRoll)
    await chrome.alarms.create('ClickFreeRollButton', {periodInMinutes: timeToWaitForFreeRoll})
  } else if (alarm.name === 'ActivateRewardMultiplier') {
    await executeScriptAsync({
      target: {tabId: tabID},
      function: activateRewardPointMultiplier,
    })
    const {timeToWaitForRewardMultiplier} = await storageSyncGetAsync('timeToWaitForRewardMultiplier')
    let now = new Date();
    console.log('Reset reward multiplier at:', now.toUTCString())
    console.log('TiMe To WaIt FoR rEwArD mUlTiPlIeR:', timeToWaitForRewardMultiplier)
    await chrome.alarms.create('ActivateRewardMultiplier', {periodInMinutes: timeToWaitForRewardMultiplier})

  }
})


chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log("Get message '", message, "' from tab id ", sender.tab.id);
  if (message === 'StartAutoClick') {
    const tabID = sender.tab.id
    chrome.storage.sync.set({tabID});
    chrome.alarms.create("ClickFreeRollButton", {periodInMinutes: 10 / 60})
    chrome.scripting.executeScript({
      target: {tabId: tabID},
      function: clickFreeRollButton,
    });
    sendResponse("TabId received, Commencing Auto click process")
  } else if (message === 'StopAutoClick') {
    chrome.alarms.clear("ClickFreeRollButton");
    sendResponse("Auto click process terminated")
  } else if (message === 'StartAutoReward') {
    const tabID = sender.tab.id
    chrome.storage.sync.set({tabID});
    chrome.alarms.create("ActivateRewardMultiplier", {periodInMinutes: 10 / 60})
    chrome.scripting.executeScript({
      target: {tabId: tabID},
      function: activateRewardPointMultiplier,
    });
    sendResponse("Commencing Auto Reward multiplier process")
  } else if (message === 'StopAutoReward') {
    chrome.alarms.clear("ActivateRewardMultiplier");
    sendResponse("Auto Reward multiplier process terminated")
  }
});

function clickFreeRollButton() {
  //checkButtonVisibility
  let button = document.getElementById("free_play_form_button");
  if (button.offsetLeft) {
    //Button is visible
    //Make decision about captcha
    chrome.storage.sync.get("haveCaptcha", data => {
      if (data.haveCaptcha === "true") {
        console.log("Clicking on play without Captcha")
        let captchaButton = document.getElementById("play_without_captchas_button")
        if (captchaButton) {
          captchaButton.click()
          console.log("Clicked on play without Captcha")
        }
      } else {
        console.log("You have no captcha to worry about")
      }
    });
    //Click the roll button
    button.click()
    let now = new Date();
    console.log("Clicked Free roll at:", now.toUTCString())
    let timeToWaitForFreeRoll = 60 + (10 / 60)
    chrome.storage.sync.set({timeToWaitForFreeRoll});
  } else {
    try {
      //Check remaining time and wait for it
      let timeString = document.getElementById("time_remaining").innerText.split("\n");
      let timeToWaitForFreeRoll = parseInt(timeString[0]) + parseInt(timeString[2]) / 60 + 10 / 60
      let now = new Date();
      if (isNaN(timeToWaitForFreeRoll)) {
        console.log("timeToWaitForFreeRoll:", timeToWaitForFreeRoll)
        console.log("Fixing NaN issue")
        timeToWaitForFreeRoll = 10 / 60
      }
      console.log("Unable to Click free roll at:", now.toUTCString());
      console.log("timeToWaitForFreeRoll:", timeToWaitForFreeRoll)
      chrome.storage.sync.set({timeToWaitForFreeRoll});
    } catch (e) {
      console.log(e)
      console.log("Something's wrong, wait 10 sec and try again")
      let timeToWaitForFreeRoll = 10 / 60
      console.log("timeToWaitForFreeRoll:", timeToWaitForFreeRoll)
      chrome.storage.sync.set({timeToWaitForFreeRoll});
    }
  }
}

function activateRewardPointMultiplier() {
  //check for reward point count down
  let rewardPointsCountdown = document.getElementById("bonus_span_free_points")
  if (rewardPointsCountdown) {
    let rewardPointsCountdownTime = rewardPointsCountdown.innerText.split(":");
    let timeToWaitForRewardMultiplier = 0;
    timeToWaitForRewardMultiplier += parseInt(rewardPointsCountdownTime[0].replace(/\D/g, '')) * 60
    timeToWaitForRewardMultiplier += parseInt(rewardPointsCountdownTime[1].replace(/\D/g, ''))
    timeToWaitForRewardMultiplier += parseInt(rewardPointsCountdownTime[2].replace(/\D/g, '')) / 60
    timeToWaitForRewardMultiplier += (10 / 60)
    let now = new Date();
    console.log("Reward Multiplier is already activated at:", now.toUTCString())
    console.log("Time to wait for nex reward activation = " + timeToWaitForRewardMultiplier)
    chrome.storage.sync.set({timeToWaitForRewardMultiplier});
  } else {
    async function delay(callback, timer) {
      return new Promise(function (resolve, reject) {
        setTimeout(function () {
          return resolve(callback())
        }, timer)
      })
    }

    async function wait(callback, timer) {
      return new Promise(function (resolve, reject) {
        let interval = setInterval(function () {
          if (callback()) {
            clearInterval(interval)
            return resolve()
          }
        }, timer)
      })
    }

    function getElem(className, index) {
      return document.getElementsByClassName(className)[index]
    }

    function isButtonLoad() {
      return Boolean(getElem('reward_link_redeem_button_style', 75))
    }

    async function run() {
      console.log("Going to reward page")
      await delay(function () {
        getElem('rewards_link', 0).click()
      }, 1000)
      console.log("Get reward multiplier drop down")
      await delay(function () {
        getElem("reward_category_name", 5).click()
      }, 1000)
      console.log("Wait for the * 100 multiplier to apper and click it")
      await wait(isButtonLoad, 1000)
      if (getElem("reward_link_redeem_button_style", 75).attributes.onclick.value.includes("RedeemRPProduct('free_points_100')")) {
        console.log("Clicking on the reward multiplier ")
        await delay(function () {
          getElem("reward_link_redeem_button_style", 75).click()
        }, 1000)
      }
      console.log("Going back to free roll page")
      await delay(function () {
        getElem("free_play_link", 0).click()
      }, 1000)
    }

    run().then()
    let now = new Date();
    console.log("Redeem Reward Multiplier at : ", now.toUTCString())
    let timeToWaitForRewardMultiplier = 24 * 60 + (10 / 60)
    chrome.storage.sync.set({timeToWaitForRewardMultiplier});
  }
}