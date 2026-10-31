console.log("Pinterest Keyboard Navigator v1.8 loaded");

let feedObserver = null;
let autoScrollInterval = null;
let maxAutoScrolls = 8; // how many times to scroll before stopping (8 × ~1 screen)
let scrollCount = 0;

// ---------- Utility ----------
function isFeedPage() {
  return location.pathname === "/" || location.pathname.startsWith("/?");
}
function isPinPage() {
  return location.pathname.startsWith("/pin/");
}
function getVisiblePins() {
  const pins = Array.from(document.querySelectorAll('a[href^="/pin/"]'));
  return [...new Set(pins.map((p) => p.href))];
}

function safeSendMessage(msg) {
  try {
    chrome.runtime.sendMessage(msg, () => {
      if (chrome.runtime.lastError &&
          !chrome.runtime.lastError.message.includes("context invalidated")) {
        console.warn("Message error:", chrome.runtime.lastError.message);
      }
    });
  } catch (err) {
    if (!String(err).includes("Extension context invalidated")) {
      console.warn("Safe message error:", err);
    }
  }
}

function savePins() {
  const pins = getVisiblePins();
  if (pins.length > 0) safeSendMessage({ type: "savePins", pins });
}

function getPins() {
  return new Promise((resolve) => {
    try {
      chrome.runtime.sendMessage({ type: "getPins" }, (response) => {
        if (chrome.runtime.lastError || !response) resolve([]);
        else resolve(response.pins || []);
      });
    } catch (err) {
      console.warn("Failed to get pins:", err);
      resolve([]);
    }
  });
}

// ---------- Overlay ----------
function showOverlay(text) {
  let overlay = document.getElementById("pin-nav-overlay");
  if (!overlay) {
    overlay = document.createElement("div");
    overlay.id = "pin-nav-overlay";
    Object.assign(overlay.style, {
      position: "fixed",
      top: "50%",
      left: "50%",
      transform: "translate(-50%, -50%)",
      background: "rgba(0, 0, 0, 0.7)",
      color: "#fff",
      padding: "12px 20px",
      borderRadius: "12px",
      fontSize: "18px",
      fontFamily: "Arial, sans-serif",
      zIndex: 999999,
      opacity: 0,
      transition: "opacity 0.3s ease",
      pointerEvents: "none",
    });
    document.body.appendChild(overlay);
  }
  overlay.textContent = text;
  overlay.style.opacity = 1;
  clearTimeout(overlay.fadeTimeout);
  overlay.fadeTimeout = setTimeout(() => (overlay.style.opacity = 0), 1000);
}

// ---------- Auto-Scroll (new) ----------
function startAutoScroll() {
  if (autoScrollInterval) return;
  scrollCount = 0;
  console.log("Auto-scroll started");

  autoScrollInterval = setInterval(() => {
    window.scrollBy({ top: window.innerHeight * 0.8, behavior: "smooth" });
    savePins();

    scrollCount++;
    if (scrollCount >= maxAutoScrolls) {
      clearInterval(autoScrollInterval);
      autoScrollInterval = null;
      console.log("Auto-scroll complete");
      showOverlay("Pins loaded & saved ✅");
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, 2500);
}

function stopAutoScroll() {
  if (autoScrollInterval) {
    clearInterval(autoScrollInterval);
    autoScrollInterval = null;
  }
}

// ---------- Feed tracking ----------
function startFeedTracking() {
  console.log("Feed detected — tracking pins...");
  savePins();
  if (feedObserver) feedObserver.disconnect();
  feedObserver = new MutationObserver(() => savePins());
  feedObserver.observe(document.body, { childList: true, subtree: true });
  startAutoScroll(); // auto-load pins
}
function stopFeedTracking() {
  if (feedObserver) {
    feedObserver.disconnect();
    feedObserver = null;
  }
  stopAutoScroll();
}

// ---------- Prefetch ----------
function prefetchPins(pins, currentIndex, range = 12) {
  const start = Math.max(0, currentIndex - range);
  const end = Math.min(pins.length, currentIndex + range + 1);
  const slice = pins.slice(start, end).filter((_, i) => i !== currentIndex);

  document.querySelectorAll('link[data-pin-prefetch]').forEach((el) => el.remove());

  for (const url of slice) {
    const link = document.createElement("link");
    link.rel = "prefetch";
    link.href = url;
    link.as = "document";
    link.dataset.pinPrefetch = "true";
    document.head.appendChild(link);
  }

  console.log(`Prefetching ${slice.length} nearby pins`);
}

// ---------- Pin navigation ----------
async function enableNavigation() {
  console.log("Enabling pin navigation...");
  const pins = await getPins();
  const currentURL = location.href;
  const currentIndex = pins.findIndex((p) => p === currentURL);
  if (currentIndex === -1) return;
  prefetchPins(pins, currentIndex, 12);

  const listener = (e) => {
    if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
      let targetIndex =
        e.key === "ArrowLeft" ? currentIndex - 1 : currentIndex + 1;
      if (targetIndex < 0 || targetIndex >= pins.length) return;
      const nextPin = pins[targetIndex];
      showOverlay(`Pin ${targetIndex + 1} of ${pins.length}`);
      window.open(nextPin, "_self");
    }
  };

  document.removeEventListener("keydown", listener);
  document.addEventListener("keydown", listener);
}

// ---------- SPA detection ----------
function setupNavigationHandler() {
  let lastTitle = document.title;

  const handlePageChange = () => {
    console.log("Detected navigation:", location.href);
    if (isFeedPage()) {
      startFeedTracking();
    } else if (isPinPage()) {
      stopFeedTracking();
      enableNavigation();
    } else {
      stopFeedTracking();
    }
  };

  handlePageChange();

  const origPushState = history.pushState;
  const origReplaceState = history.replaceState;
  history.pushState = function (...args) {
    origPushState.apply(this, args);
    window.dispatchEvent(new Event("locationchange"));
  };
  history.replaceState = function (...args) {
    origReplaceState.apply(this, args);
    window.dispatchEvent(new Event("locationchange"));
  };

  window.addEventListener("popstate", () =>
    window.dispatchEvent(new Event("locationchange"))
  );
  window.addEventListener("locationchange", handlePageChange);

  // Fallback title watcher
  const titleObserver = new MutationObserver(() => {
    if (document.title !== lastTitle) {
      lastTitle = document.title;
      handlePageChange();
    }
  });
  titleObserver.observe(document.querySelector("title"), {
    childList: true,
    subtree: true,
  });
}

setupNavigationHandler();
