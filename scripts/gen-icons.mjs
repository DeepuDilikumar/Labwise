// Renders public/icons/icon.svg to the PNG sizes the manifest and iOS need.
import { chromium } from "@playwright/test";
import { readFile } from "node:fs/promises";
const svg = await readFile("public/icons/icon.svg", "utf8");
const b = await chromium.launch();
for (const [size, name, pad] of [[192, "icon-192.png", 0], [512, "icon-512.png", 0], [512, "maskable-512.png", 0.1], [180, "apple-touch-icon.png", 0]]) {
  const p = await b.newPage({ viewport: { width: size, height: size } });
  const inner = Math.round(size * (1 - pad * 2));
  await p.setContent(`<html><body style="margin:0;background:#0e7c66;display:grid;place-items:center;width:${size}px;height:${size}px">${svg.replace("<svg", `<svg width="${inner}" height="${inner}"`)}</body></html>`);
  await p.screenshot({ path: `public/icons/${name}`, omitBackground: false });
  await p.close();
}
await b.close();
console.log("icons done");
