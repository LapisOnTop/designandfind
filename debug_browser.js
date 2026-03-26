import puppeteer from 'puppeteer';

(async () => {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();

    page.on('console', msg => console.log('BROWSER_LOG:', msg.text()));
    page.on('pageerror', err => console.log('BROWSER_ERROR:', err.toString()));

    console.log("Navigating to http://localhost:8081/auth...");
    await page.goto('http://localhost:8081/auth', { waitUntil: 'networkidle0' });

    const url = page.url();
    console.log("Final URL:", url);

    const html = await page.evaluate(() => document.documentElement.outerHTML);
    console.log("HTML Start:", html.substring(0, 300));

    const rootHtml = await page.evaluate(() => document.getElementById('root')?.innerHTML);
    console.log("ROOT HTML:", rootHtml);

    await browser.close();
})();
