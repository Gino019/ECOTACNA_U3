const puppeteer = require('puppeteer');

(async () => {
  try {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();

    page.on('console', msg => console.log('BROWSER CONSOLE:', msg.type(), msg.text()));
    page.on('pageerror', error => console.log('BROWSER ERROR:', error.message));
    page.on('requestfailed', request => console.log('BROWSER REQUEST FAILED:', request.url(), request.failure().errorText));

    // The frontend is running on 8080
    await page.goto('http://localhost:8080/recolector/mapa-operativo', { waitUntil: 'networkidle0' });

    await browser.close();
  } catch (err) {
    console.error('SCRIPT ERROR:', err);
  }
})();
