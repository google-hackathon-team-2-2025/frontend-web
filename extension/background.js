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

// Function to crop image using OffscreenCanvas API (works in service workers)
async function cropImage(imageDataUrl, selection) {
  try {
    // Convert data URL to blob
    const response = await fetch(imageDataUrl);
    const blob = await response.blob();

    // Create ImageBitmap from blob
    const imageBitmap = await createImageBitmap(blob);

    console.log(
      "Image dimensions:",
      imageBitmap.width,
      "x",
      imageBitmap.height
    );
    console.log("Selection:", selection);

    // Validate and clamp coordinates to image bounds
    const x = Math.max(0, Math.min(selection.x, imageBitmap.width - 1));
    const y = Math.max(0, Math.min(selection.y, imageBitmap.height - 1));
    const width = Math.max(1, Math.min(selection.width, imageBitmap.width - x));
    const height = Math.max(
      1,
      Math.min(selection.height, imageBitmap.height - y)
    );

    console.log("Clamped coordinates:", { x, y, width, height });

    // Create OffscreenCanvas for cropping
    const canvas = new OffscreenCanvas(width, height);
    const ctx = canvas.getContext("2d");

    // Draw the cropped portion
    ctx.drawImage(
      imageBitmap,
      x,
      y,
      width,
      height, // Source rectangle
      0,
      0,
      width,
      height // Destination rectangle
    );

    // Convert to blob and then to data URL
    const croppedBlob = await canvas.convertToBlob({
      type: "image/png",
      quality: 0.9,
    });

    // Convert blob to data URL
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(croppedBlob);
    });
  } catch (error) {
    console.error("Error cropping image:", error);
    throw new Error("Failed to crop image: " + error.message);
  }
}

async function handleAreaCapture(request, sender) {
  try {
    if (!sender.tab) {
      throw new Error("No tab information available");
    }

    // Capture the full page first
    const fullScreenshot = await chrome.tabs.captureVisibleTab(
      sender.tab.windowId,
      {
        format: "png",
        quality: 90,
      }
    );

    console.log(
      "Screenshot captured, selection coordinates:",
      request.selection
    );

    // Crop the image to the selected area
    const croppedImageData = await cropImage(fullScreenshot, request.selection);

    // Send only the cropped image to the API
    const response = await fetch(`${FACTLENS_API_URL}/api/fact-check`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        images: [croppedImageData],
        url: request.url,
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
