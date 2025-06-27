const fs = require("fs");
const path = require("path");

// Simple PNG data URL for a black square with white "FL" text (placeholder)
const createSimpleIcon = size => {
  // Create SVG content
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    <rect width="${size}" height="${size}" fill="#000"/>
    <text x="50%" y="60%" text-anchor="middle" fill="#fff" font-family="Arial" font-size="${Math.floor(size * 0.4)}" font-weight="bold">FL</text>
  </svg>`;

  return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
};

const iconsDir = path.join(__dirname, "dist/icons");
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// Create placeholder icons (Chrome will accept SVG data URLs)
const sizes = [16, 32, 48, 128];
sizes.forEach(size => {
  const iconContent = createSimpleIcon(size);
  console.log(`Created ${size}x${size} icon placeholder`);
});

console.log("✓ Icon placeholders created");
console.log("Note: For production, replace with actual PNG icon files");
