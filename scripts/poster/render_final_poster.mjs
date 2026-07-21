import fs from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

import { chromium } from "../../frontend/node_modules/playwright/index.mjs";


const root = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/(.:)/, "$1")), "../..");
const stem = "conferencespace-academic-poster";
const svgPath = path.join(root, "output", "poster", `${stem}.svg`);
const pngPath = path.join(root, "output", "poster", `${stem}.png`);
const pdfDir = path.join(root, "output", "pdf");
const pdfPath = path.join(pdfDir, `${stem}.pdf`);

await fs.mkdir(pdfDir, { recursive: true });
const svg = await fs.readFile(svgPath, "utf8");
const browser = await chromium.launch({ headless: true });

try {
  const pdfPage = await browser.newPage({ viewport: { width: 1403, height: 993 } });
  await pdfPage.setContent(`<!doctype html><html><head><meta charset="utf-8"><style>
    @page { size: 1189mm 841mm; margin: 0; }
    html, body { margin: 0; width: 1189mm; height: 841mm; overflow: hidden; background: #F7F4EC; }
    svg { display: block; width: 1189mm; height: 841mm; }
  </style></head><body>${svg}</body></html>`, { waitUntil: "load" });
  await pdfPage.evaluate(() => document.fonts.ready);
  await pdfPage.pdf({
    path: pdfPath,
    width: "1189mm",
    height: "841mm",
    margin: { top: "0", right: "0", bottom: "0", left: "0" },
    printBackground: true,
    preferCSSPageSize: true,
  });
  await pdfPage.close();

  const pngPage = await browser.newPage({ viewport: { width: 9362, height: 6622 } });
  await pngPage.setContent(`<!doctype html><html><head><meta charset="utf-8"><style>
    html, body { margin: 0; width: 9362px; height: 6622px; overflow: hidden; background: #F7F4EC; }
    svg { display: block; width: 9362px; height: 6622px; }
  </style></head><body>${svg}</body></html>`, { waitUntil: "load" });
  await pngPage.evaluate(() => document.fonts.ready);
  await pngPage.locator("svg").screenshot({ path: pngPath, animations: "disabled" });
  await pngPage.close();
} finally {
  await browser.close();
}

console.log(pathToFileURL(pdfPath).href);
console.log(pathToFileURL(pngPath).href);
