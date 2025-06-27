// Popup script for FactLens extension

const FACTLENS_API_URL = "http://localhost:3000"; // Change to your production URL

document.addEventListener("DOMContentLoaded", async () => {
  const selectAreaBtn = document.getElementById("select-area-btn");
  const fullPageBtn = document.getElementById("full-page-btn");

  selectAreaBtn.addEventListener("click", () => handleAreaSelection());
  fullPageBtn.addEventListener("click", () => handleFullPageScreenshot());
});

async function handleAreaSelection() {
  try {
    showLoading("Activating selection tool...");

    // Get current tab
    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });

    if (!tab) {
      throw new Error("Could not access current tab");
    }

    // Check if we can access this URL
    if (
      tab.url.startsWith("chrome://") ||
      tab.url.startsWith("chrome-extension://") ||
      tab.url.startsWith("edge://") ||
      tab.url.startsWith("about:")
    ) {
      throw new Error(
        "Cannot access browser internal pages. Please try on a regular website."
      );
    }

    // Inject selection overlay script
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      function: createSelectionOverlay,
    });

    // Close popup after injecting selection tool
    window.close();
  } catch (error) {
    console.error("Area selection error:", error);
    showStatus("Error: " + error.message, false);
  }
}

async function handleFullPageScreenshot() {
  try {
    showLoading("Taking full page screenshot...");

    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });

    if (!tab) {
      throw new Error("Could not access current tab");
    }

    // Check if we can access this URL
    if (
      tab.url.startsWith("chrome://") ||
      tab.url.startsWith("chrome-extension://") ||
      tab.url.startsWith("edge://") ||
      tab.url.startsWith("about:")
    ) {
      throw new Error(
        "Cannot access browser internal pages. Please try on a regular website."
      );
    }

    // Capture full page screenshot
    const dataUrl = await chrome.tabs.captureVisibleTab(tab.windowId, {
      format: "png",
      quality: 90,
    });

    await processScreenshot(dataUrl, tab.url);
  } catch (error) {
    console.error("Full page screenshot error:", error);
    showStatus("Error: " + error.message, false);
  }
}

async function processScreenshot(imageData, pageUrl) {
  try {
    showLoading("Analyzing content...");

    // Send to fact-check API
    const response = await fetch(`${FACTLENS_API_URL}/api/fact-check`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        images: [imageData],
        url: pageUrl,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        errorData.error || `HTTP error! status: ${response.status}`
      );
    }

    const result = await response.json();

    // Store results and open new tab with results
    await chrome.storage.local.set({ factCheckResults: result });

    // Also encode results in URL as backup
    const encodedResults = encodeURIComponent(JSON.stringify(result));

    // Open FactLens results page in new tab with results in URL
    await chrome.tabs.create({
      url: `${FACTLENS_API_URL}/results?extensionData=${encodedResults}`,
    });

    showStatus("✓ Analysis complete! Opening results...", true);

    // Close popup after a moment
    setTimeout(() => {
      window.close();
    }, 1000);
  } catch (error) {
    console.error("Screenshot analysis error:", error);
    showStatus("Error: " + error.message, false);
  }
}

function showLoading(message) {
  const mainContent = document.getElementById("main-content");
  const loading = document.getElementById("loading");
  const status = document.getElementById("status");

  mainContent.style.display = "none";
  loading.style.display = "block";
  status.style.display = "none";
  loading.innerHTML = `<div>${message}</div>`;
}

function showStatus(message, isSuccess) {
  const mainContent = document.getElementById("main-content");
  const loading = document.getElementById("loading");
  const status = document.getElementById("status");

  loading.style.display = "none";
  status.style.display = "block";
  status.textContent = message;
  status.className = `status ${isSuccess ? "success" : "error"}`;
}

// Function to be injected into the page for area selection
function createSelectionOverlay() {
  // Remove existing overlay if present
  const existingOverlay = document.getElementById("factlens-selection-overlay");
  if (existingOverlay) {
    existingOverlay.remove();
  }

  // Create overlay
  const overlay = document.createElement("div");
  overlay.id = "factlens-selection-overlay";
  overlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.3);
    z-index: 999999;
    cursor: crosshair;
    user-select: none;
  `;

  // Create selection box
  const selectionBox = document.createElement("div");
  selectionBox.style.cssText = `
    position: absolute;
    border: 2px solid #60a5fa;
    background: rgba(96, 165, 250, 0.1);
    display: none;
    pointer-events: none;
  `;
  overlay.appendChild(selectionBox);

  // Create instruction text
  const instruction = document.createElement("div");
  instruction.style.cssText = `
    position: fixed;
    top: 20px;
    left: 50%;
    transform: translateX(-50%);
    background: #1a1a1a;
    color: #e5e5e5;
    padding: 12px 20px;
    border-radius: 8px;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    font-size: 14px;
    font-weight: 500;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    z-index: 1000000;
  `;
  instruction.textContent =
    "Click and drag to select an area to fact-check • Press ESC to cancel";

  document.body.appendChild(overlay);
  document.body.appendChild(instruction);

  let isSelecting = false;
  let startX, startY;

  overlay.addEventListener("mousedown", e => {
    isSelecting = true;
    startX = e.clientX;
    startY = e.clientY;

    selectionBox.style.left = startX + "px";
    selectionBox.style.top = startY + "px";
    selectionBox.style.width = "0px";
    selectionBox.style.height = "0px";
    selectionBox.style.display = "block";
  });

  overlay.addEventListener("mousemove", e => {
    if (!isSelecting) return;

    const currentX = e.clientX;
    const currentY = e.clientY;

    const width = Math.abs(currentX - startX);
    const height = Math.abs(currentY - startY);
    const left = Math.min(currentX, startX);
    const top = Math.min(currentY, startY);

    selectionBox.style.left = left + "px";
    selectionBox.style.top = top + "px";
    selectionBox.style.width = width + "px";
    selectionBox.style.height = height + "px";
  });

  overlay.addEventListener("mouseup", async e => {
    if (!isSelecting) return;

    isSelecting = false;

    const rect = selectionBox.getBoundingClientRect();

    // Minimum selection size
    if (rect.width < 50 || rect.height < 50) {
      alert("Please select a larger area");
      return;
    }

    // Clean up overlay
    overlay.remove();
    instruction.remove();

    // Capture the selected area
    try {
      // Calculate coordinates accounting for device pixel ratio and zoom
      // getBoundingClientRect() gives CSS pixels, but screenshots are in device pixels
      const devicePixelRatio = window.devicePixelRatio || 1;
      const zoomLevel = window.outerWidth / window.innerWidth;

      const selection = {
        x: Math.round(rect.left * devicePixelRatio),
        y: Math.round(rect.top * devicePixelRatio),
        width: Math.round(rect.width * devicePixelRatio),
        height: Math.round(rect.height * devicePixelRatio),
      };

      console.log("Original rect:", {
        left: rect.left,
        top: rect.top,
        width: rect.width,
        height: rect.height,
      });
      console.log("Device pixel ratio:", devicePixelRatio);
      console.log("Zoom level:", zoomLevel);
      console.log("Final selection coordinates:", selection);

      // Send message to background script
      chrome.runtime.sendMessage({
        action: "captureSelectedArea",
        selection: selection,
        url: window.location.href,
      });
    } catch (error) {
      console.error("Selection capture error:", error);
      alert("Error capturing selection: " + error.message);
    }
  });

  // ESC key to cancel
  const handleKeydown = e => {
    if (e.key === "Escape") {
      overlay.remove();
      instruction.remove();
      document.removeEventListener("keydown", handleKeydown);
    }
  };

  document.addEventListener("keydown", handleKeydown);
}
