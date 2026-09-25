/* eslint-disable @typescript-eslint/no-require-imports */
const sharp = require("sharp");
const path = require("path");

// Emerald-based branded icon for RT 002 Mawar
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#10b981"/>
      <stop offset="1" stop-color="#047857"/>
    </linearGradient>
  </defs>
  <rect width="512" height="512" rx="112" fill="url(#g)"/>
  <g fill="#ffffff">
    <!-- House roof -->
    <path d="M256 96 L416 232 L384 232 L384 232 L384 200 L256 110 L128 200 L128 232 L96 232 Z" opacity="0.95"/>
    <!-- House body -->
    <rect x="160" y="232" width="192" height="160" rx="14" opacity="0.95"/>
    <!-- Door -->
    <rect x="232" y="296" width="48" height="96" rx="8" fill="#047857"/>
    <!-- "RT" text -->
    <text x="256" y="288" font-family="Arial, sans-serif" font-size="64" font-weight="bold" text-anchor="middle" fill="#047857">RT</text>
    <!-- 002 badge -->
    <circle cx="256" cy="420" r="40" fill="#fbbf24"/>
    <text x="256" y="436" font-family="Arial, sans-serif" font-size="36" font-weight="bold" text-anchor="middle" fill="#78350f">002</text>
  </g>
</svg>`;

(async () => {
  const pub = path.resolve(__dirname, "..", "public");
  await sharp(Buffer.from(svg)).resize(192, 192).png().toFile(path.join(pub, "icon-192.png"));
  await sharp(Buffer.from(svg)).resize(512, 512).png().toFile(path.join(pub, "icon-512.png"));
  await sharp(Buffer.from(svg)).resize(180, 180).png().toFile(path.join(pub, "icon-apple.png"));
  console.log("Icons generated");
})();
