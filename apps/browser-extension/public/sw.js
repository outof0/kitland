/**
 * Kitland launcher: opens the local tool page in a full browser tab.
 * The service worker holds no state, reads nothing, and makes no requests;
 * it exists only because toolbar clicks need a listener when no popup is
 * set. `chrome.tabs.create` requires no permissions.
 */
chrome.action.onClicked.addListener(() => {
  chrome.tabs.create({ url: chrome.runtime.getURL("popup.html") });
});
