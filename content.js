//	Toggle CSS
// Browser extension to quickly enable or disable CSS in the current tab.
// Author: Phanx <phanx@protonmail.com> (https://phanx.net)
// Last updated: 2018-03-29
// This is free and unencumbered software released into the public domain.

let cssDisabled = false
let observer = null

const t = (arg) => Array.prototype.slice.call(arg)
const $ = (sel) => t(document.querySelectorAll(sel))

const startObserver = () => {
	if (!observer) observer = new MutationObserver(observerCallback)
	observer.observe(document.body, { attributes: true, subtree: true })
}

const stopObserver = () => {
	if (!observer) return
	observer.disconnect()
}

const removeInlineCSS = (el) => {
	const css = el.getAttribute("style")
	const old = el.getAttribute("data-removed-css")
	if (old && old !== css) {
		const sep = old.trim().substr(-1) === ";" ? "" : ";"
		el.setAttribute("data-removed-css", old + sep + css)
	} else if (!old) {
		el.setAttribute("data-removed-css", css)
	}
	el.removeAttribute("style")
}

const restoreInlineCSS = (el) => {
	const css = el.getAttribute("data-removed-css")
	if (css) {
		el.setAttribute("style", css)
		el.removeAttribute("data-removed-css")
	}
}

const observerCallback = (mutations) => {
	stopObserver()
	mutations.forEach((mutation) => {
		if (mutation.type === "attributes" && mutation.attributeName === "style") {
			removeInlineCSS(mutation.target)
		}
	})
	startObserver()
}

const disableCSS = () => {
	if (cssDisabled) return // already disabled
	cssDisabled = true

	t(document.styleSheets).forEach(sheet => {
		sheet.disabled = true
	})

	$("[style]").forEach(el => removeInlineCSS)

	startObserver()
}

const enableCSS = () => {
	if (!cssDisabled) return // already enabled
	cssDisabled = false

	stopObserver()

	t(document.styleSheets).forEach(sheet => {
		sheet.disabled = false
	})

	$("[data-removed-css]").forEach(el => restoreInlineCSS)
}

const onMessage = (message, sender, callback) => {
	console.log("page received message:", message)
	const { action, tabId } = message

	if (action === "ping") {
		console.log("page sending message:", { message: "ack" })
		callback({ message: "ack" })
		return
	}

	if (action !== "toggle") return

	if (cssDisabled) {
		enableCSS()
	} else {
		disableCSS()
	}

	const state = cssDisabled ? "disabled" : "enabled"
	console.log("page sending message:", { state, tabId })
	callback({ state, tabId })
}

const init = (report) => {
	console.log("script injection complete")
	chrome.runtime.onMessage.addListener(onMessage)
	return report
}

init("loaded")
