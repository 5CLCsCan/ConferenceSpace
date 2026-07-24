const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

(async () => {
  console.log('🚀 Đang khởi tạo trình duyệt Chromium xuất song song tệp PDF và PNG chất lượng cao (Single Page A0)...');

  const htmlPath = path.join(__dirname, 'ConferenceSpace_Poster.html');
  const pdfPath = path.join(__dirname, 'ConferenceSpace_Poster.pdf');
  const pngPath = path.join(__dirname, 'ConferenceSpace_Poster.png');
  const fileUrl = 'file:///' + htmlPath.replace(/\\/g, '/');

  const browser = await chromium.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--force-color-profile=srgb',
    ]
  });

  const context = await browser.newContext({
    viewport: { width: 2000, height: 1414 },
    deviceScaleFactor: 2, // Scale 2x (4000x2828px cho ảnh PNG siêu nét)
  });

  const page = await context.newPage();

  console.log(`📖 Đang nạp poster HTML: ${fileUrl}`);
  await page.goto(fileUrl, { waitUntil: 'networkidle' });

  // Đảm bảo fonts và hình ảnh nạp hoàn toàn 100%
  await page.evaluate(async () => {
    if (document.fonts) {
      await document.fonts.ready;
    }
    const images = Array.from(document.querySelectorAll('img'));
    await Promise.all(
      images.map((img) => {
        if (img.complete) return Promise.resolve();
        return new Promise((resolve) => {
          img.onload = resolve;
          img.onerror = resolve;
        });
      })
    );
  });

  await page.waitForTimeout(1000);

  console.log('🖨️ Đang tiến hành xuất song song tệp PDF & PNG...');
  
  await Promise.all([
    page.pdf({
      path: pdfPath,
      width: '2000px',
      height: '1414px',
      printBackground: true,
      margin: { top: '0px', right: '0px', bottom: '0px', left: '0px' },
      preferCSSPageSize: true,
    }),
    page.screenshot({
      path: pngPath,
      fullPage: true,
      type: 'png',
    }),
  ]);

  await browser.close();

  const pdfStats = fs.statSync(pdfPath);
  const pngStats = fs.statSync(pngPath);

  console.log(`✅ Xuất thành công đồng thời 2 tệp:`);
  console.log(` 📄 PDF: ${pdfPath}`);
  console.log(`    Kích thước: ${(pdfStats.size / (1024 * 1024)).toFixed(2)} MB`);
  console.log(` 🖼️ PNG: ${pngPath}`);
  console.log(`    Kích thước: ${(pngStats.size / (1024 * 1024)).toFixed(2)} MB`);
})();
