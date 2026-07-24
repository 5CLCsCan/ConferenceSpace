const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

(async () => {
  console.log('🚀 Đang khởi tạo trình duyệt Chromium xuất tệp PDF sắc nét (Single Page A0)...');

  const htmlPath = path.join(__dirname, 'ConferenceSpace_Poster.html');
  const pdfPath = path.join(__dirname, 'ConferenceSpace_Poster.pdf');
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
    deviceScaleFactor: 2,
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

  console.log('🖨️ Đang ghi tệp PDF (2000px x 1414px, vector 100%, 0 margin)...');
  await page.pdf({
    path: pdfPath,
    width: '2000px',
    height: '1414px',
    printBackground: true,
    margin: { top: '0px', right: '0px', bottom: '0px', left: '0px' },
    preferCSSPageSize: true,
  });

  await browser.close();

  const stats = fs.statSync(pdfPath);
  console.log(`✅ Xuất tệp PDF thành công tại:`);
  console.log(`   ${pdfPath}`);
  console.log(`   Dung lượng file: ${(stats.size / (1024 * 1024)).toFixed(2)} MB`);
})();
