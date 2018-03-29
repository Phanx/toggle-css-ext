//	Toggle CSS
// Browser extension to quickly enable or disable CSS in the current tab.
// Author: Phanx <phanx@protonmail.com> (https://phanx.net)
// Last updated: 2018-03-29
// This is free and unencumbered software released into the public domain.

const onMessage = (message) => {
	// console.log("action received message:", message)
	const { state, tabId } = message
	const disabled = state == "disabled"
	const title = disabled ? "Enable CSS" : "Disable CSS"
	const path = {
		"19": "icons/action19" + (disabled ? "-off" : "") + ".png",
		"38": "icons/action38" + (disabled ? "-off" : "") + ".png",
	}
	chrome.browserAction.setIcon({ path, tabId })
	chrome.browserAction.setTitle({ title, tabId })
}

chrome.browserAction.onClicked.addListener((tab) => {
	// console.log("action clicked")
	chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
		// console.log("action sending message:", "toggle")
		const tabId = tabs[0].id
		chrome.tabs.sendMessage(tabId, { action: "toggle", tabId }, onMessage)
	})
})
