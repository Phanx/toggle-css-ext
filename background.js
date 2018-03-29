//	Toggle CSS
// Browser extension to quickly enable or disable CSS in the current tab.
// Author: Phanx <phanx@protonmail.com> (https://phanx.net)
// Last updated: 2018-03-29
// This is free and unencumbered software released into the public domain.

const toPromise = (func) => {
	return function () {
		const args = Array.prototype.slice.call(arguments)
		return new Promise(resolve => {
			args.push(resolve)
			func.apply(this, args)
		})
	}
}

const executeScript = toPromise(chrome.tabs.executeScript)
const getTab = toPromise(chrome.tabs.get)
const sendMessage = toPromise(chrome.tabs.sendMessage)

const tabDisabled = {}
const tabInjected = {}
const tabURL = {}

const injectContentScript = async (tabId, url) => {
	console.log("injectContentScript", tabId, url)

	const t = Date.now()

	console.log("checking for content script...")
	const res = await sendMessage(tabId, { action: "ping" })
	if (res && res.message === "ack") {
		console.log("ok", Date.now() - t)
		tabInjected[tabId] = url
		return true
	}

	console.log("injecting content script...")
	const script = { file: "content.js", runAt: "document_end", allFrames: true }
	const result = await executeScript(tabId, script)
	console.log("ok:", Date.now() - t, result)

	tabInjected[tabId] = url
	return true
}

// content script sent a message
const onMessage = (message) => {
	console.log("onMessage:", message)
	if (!message) return

	const { state, tabId } = message
	const disabled = state == "disabled"
	const title = disabled ? "Enable CSS" : "Disable CSS"
	const path = {
		"19": "icons/action19" + (disabled ? "-off" : "") + ".png",
		"38": "icons/action38" + (disabled ? "-off" : "") + ".png",
	}
	chrome.browserAction.setIcon({ path, tabId })
	chrome.browserAction.setTitle({ title, tabId })
	tabDisabled[tabId] = disabled
}

// user activated the browser action
const onClicked = async (tab) => {
	const tabId = tab.id
	const url = tab.url
	console.log("onClicked:", tabId, url)

	console.log("tabInjected[tabId] =", tabInjected[tabId])

	if (!url || tabInjected[tabId] !== url) {
		console.log("need to inject content script")
		const injected = await injectContentScript(tabId, url)
		console.log("injected:", injected)
	}

	const message = { action: "toggle", tabId }
	console.log("sendMessage:", message)

	chrome.tabs.sendMessage(tabId, message, onMessage)
	tabURL[tabId] = url
}

// tab removed
const onRemoved = (tabId) => {
	delete tabInjected[tabId]
}

// tab updated
const onUpdated = async (tabId, changeInfo) => {
	console.log(" ")
	console.log("-----")
	console.log(" ")
	console.log("onUpdated", tabId, changeInfo)

	if (changeInfo.url) {
		tabURL[tabId] = changeInfo.url
	}

	if (changeInfo.status || changeInfo.url) {
		console.log("content script is probably gone")
		delete tabInjected[tabId]
	}

	if (changeInfo.status === "complete" && tabDisabled[tabId]) {
		console.log("reapplying...")
		setTimeout(() => {
			onClicked({ id: tabId, url: changeInfo.url || tabURL[tabId] })
		}, 10)
	}
}

const init = () => {
	chrome.browserAction.onClicked.addListener(onClicked)
	chrome.tabs.onRemoved.addListener(onRemoved)
	chrome.tabs.onUpdated.addListener(onUpdated)
}

init()
