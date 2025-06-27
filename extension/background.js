// Background service worker for FactLens extension

// This background script is minimal since most functionality is in the popup
// But it's required for the extension to work properly

const FACTLENS_API_URL = "http://localhost:3000";

chrome.runtime.onInstalled.addListener(() => {
  console.log("FactLens extension installed");
});

// Handle messages from content scripts and popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "captureSelectedArea") {
    handleAreaCapture(request, sender);
  }
  return false;
});

async function handleAreaCapture(request, sender) {
  try {
    if (!sender.tab) {
      throw new Error("No tab information available");
    }

    // Capture the full page first
    const dataUrl = await chrome.tabs.captureVisibleTab(sender.tab.windowId, {
      format: "png",
      quality: 90,
    });

    // For now, we'll send the full screenshot to the API
    // The API can handle the area selection logic if needed in the future
    const response = await fetch(`${FACTLENS_API_URL}/api/fact-check`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        images: [dataUrl],
        url: request.url,
        selection: request.selection, // Include selection coordinates for future use
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        errorData.error || `HTTP error! status: ${response.status}`
      );
    }

    const result = await response.json();

    // Store results for the results page
    await chrome.storage.local.set({ factCheckResults: result });

    // Also encode results in URL as backup
    const encodedResults = encodeURIComponent(JSON.stringify(result));

    // Open FactLens results page in new tab with results in URL
    await chrome.tabs.create({
      url: `${FACTLENS_API_URL}/results?extensionData=${encodedResults}`,
    });
  } catch (error) {
    console.error("Area capture error:", error);

    // Show error notification
    chrome.notifications?.create({
      type: "basic",
      iconUrl: "icons/icon-48.png",
      title: "FactLens Error",
      message: "Failed to analyze selected area: " + error.message,
    });
  }
}
