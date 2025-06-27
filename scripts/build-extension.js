const fs = require("fs");
const path = require("path");

// Build the browser extension
function buildExtension() {
  const extensionDir = path.join(__dirname, "../extension");
  const distDir = path.join(extensionDir, "dist");

  // Ensure dist directory exists
  if (!fs.existsSync(distDir)) {
    fs.mkdirSync(distDir, { recursive: true });
  }

  // Files to copy directly
  const filesToCopy = [
    "manifest.json",
    "popup.html",
    "popup.js",
    "background.js",
  ];

  filesToCopy.forEach(file => {
    const srcPath = path.join(extensionDir, file);
    const distPath = path.join(distDir, file);

    if (fs.existsSync(srcPath)) {
      fs.copyFileSync(srcPath, distPath);
      console.log(`✓ Copied ${file}`);
    } else {
      console.warn(`⚠ File not found: ${file}`);
    }
  });

  // Create icons directory with placeholder
  const iconsDir = path.join(distDir, "icons");
  if (!fs.existsSync(iconsDir)) {
    fs.mkdirSync(iconsDir, { recursive: true });
  }

  // Create a simple placeholder icon (you can replace with actual icons later)
  const placeholderIcon = `data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==`;

  // Note: For actual icons, you'll want to create proper PNG files
  console.log("📝 Note: Add actual icon files to extension/icons/ directory");
  console.log("   Required sizes: 16x16, 32x32, 48x48, 128x128 PNG files");

  console.log("\n🎉 Extension built successfully!");
  console.log(`📁 Extension files are in: ${distDir}`);
  console.log("\n📖 To install in Chrome:");
  console.log("   1. Go to chrome://extensions/");
  console.log('   2. Enable "Developer mode"');
  console.log('   3. Click "Load unpacked"');
  console.log(`   4. Select the folder: ${distDir}`);
}

// Run the build
buildExtension();
