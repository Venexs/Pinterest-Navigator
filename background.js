chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === "savePins") {
    chrome.storage.session.set({ pinterest_pins: msg.pins }).then(() => {
      sendResponse({ status: "ok" });
    });
    return true;
  } else if (msg.type === "getPins") {
    chrome.storage.session.get("pinterest_pins").then((data) => {
      sendResponse({ pins: data.pinterest_pins || [] });
    });
    return true;
  }
});
