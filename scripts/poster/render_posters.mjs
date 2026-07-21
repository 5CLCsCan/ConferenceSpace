import fs from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

import { chromium } from "../../frontend/node_modules/playwright/index.mjs";


const root = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/(.:)/, "$1")), "../..");
const svgDir = path.join(root, "output", "poster");
const pdfDir = path.join(root, "output", "pdf");

const posters = [
  {
    stem: "conferencespace-poster-a-product-journey",
    svg: path.join(svgDir, "conferencespace-poster-a-product-journey.svg"),
  },
  {
    stem: "conferencespace-poster-b-evidence-dashboard",
    svg: path.join(svgDir, "conferencespace-poster-b-evidence-dashboard.svg"),
  },
];

await fs.mkdir(svgDir, { recursive: true });
await fs.mkdir(pdfDir, { recursive: true });

const browser = await chromium.launch({ headless: true });

try {
  for (const poster of posters) {
    const svg = await fs.readFile(poster.svg, "utf8");
    const page = await browser.newPage({ viewport: { width: 1403, height: 993 } });
    await page.setContent(`<!doctype html>
      <html><head><meta charset="utf-8"><style>
        @page { size: 1189mm 841mm; margin: 0; }
        html, body { margin: 0; padding: 0; width: 1189mm; height: 841mm; overflow: hidden; background: #F8FAFC; }
        svg { display: block; width: 1189mm; height: 841mm; }
      </style></head><body>${svg}</body></html>`, { waitUntil: "load" });
    await page.evaluate(() => document.fonts.ready);
    await page.pdf({
      path: path.join(pdfDir, `${poster.stem}.pdf`),
      width: "1189mm",
      height: "841mm",
      margin: { top: "0", right: "0", bottom: "0", left: "0" },
      printBackground: true,
      preferCSSPageSize: true,
    });
    await page.close();

    const pngPage = await browser.newPage({ viewport: { width: 9362, height: 6622 } });
    await pngPage.setContent(`<!doctype html>
      <html><head><meta charset="utf-8"><style>
        html, body { margin: 0; padding: 0; width: 9362px; height: 6622px; overflow: hidden; background: #F8FAFC; }
        svg { display: block; width: 9362px; height: 6622px; }
      </style></head><body>${svg}</body></html>`, { waitUntil: "load" });
    await pngPage.evaluate(() => document.fonts.ready);
    await pngPage.locator("svg").screenshot({
      path: path.join(svgDir, `${poster.stem}.png`),
      animations: "disabled",
    });
    await pngPage.close();
  }
} finally {
  await browser.close();
}

console.log(pathToFileURL(pdfDir).href);
