// irctc-login-automation.js
const { chromium } = require('playwright');
const fs = require('fs');
const readline = require('readline');

function askQuestion(query) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise(resolve => rl.question(query, ans => {
    rl.close();
    resolve(ans.trim());
  }));
}

async function humanType(page, selector, text) {
  for (const char of text) {
    await page.type(selector, char);
    await page.waitForTimeout(100 + Math.random() * 100);
  }
}

(async () => {
  const username = await askQuestion('Username: ');
  const password = await askQuestion('Password: ');

  const browser = await chromium.launch({ headless: false, slowMo: 50 });
  const context = await browser.newContext({
    viewport: { width: 1366, height: 768 },
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119 Safari/537.36',
  });

  await context.addInitScript(() => {
    Object.defineProperty(navigator, 'webdriver', { get: () => false });
    Object.defineProperty(navigator, 'languages', { get: () => ['en-US', 'en'] });
    Object.defineProperty(navigator, 'plugins', { get: () => [1, 2, 3] });
  });

  const page = await context.newPage();

  try {
    console.log('🔹 Opening IRCTC site...');
    await page.goto('https://www.irctc.co.in/nget/train-search', { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.locator('button:has-text("OK")').click().catch(() => {});

    console.log('🔹 Opening login dialog...');
    await page.locator('a[aria-label="Click here to Login in application"]').click();
    await page.locator('input[placeholder="User Name"]').waitFor({ state: 'visible', timeout: 15000 });

    console.log('🔐 Typing username and password...');
    await humanType(page, 'input[placeholder="User Name"]', username);
    await humanType(page, 'input[placeholder="Password"]', password);

    console.log('📸 Capturing CAPTCHA...');
    const captchaPath = 'captcha.png';
    if (fs.existsSync(captchaPath)) fs.unlinkSync(captchaPath);

    let captchaElement;
    try {
      captchaElement = await page.locator('canvas').first().waitFor({ timeout: 7000 });
    } catch {
      captchaElement = await page.locator('form:has(input[placeholder="Enter Captcha"]) img').first().waitFor({ timeout: 7000 });
    }

    if (captchaElement) {
      await captchaElement.screenshot({ path: captchaPath });
    } else {
      console.warn('⚠️ CAPTCHA element not found, taking broader screenshot.');
      await page.screenshot({ path: captchaPath, fullPage: false });
    }

    console.log('🔑 Please open "captcha.png" and enter CAPTCHA:');
    const captchaInput = await askQuestion('CAPTCHA: ');
    await page.locator('input[placeholder="Enter Captcha"]').fill(captchaInput);

    console.log('🔁 Submitting login...');
    const loginBtn = page.locator('button.search_btn').filter({ hasText: 'LOGIN' });
    // Ensure button is visible and enabled
    await loginBtn.waitFor({ state: 'visible', timeout: 15000 });
    await loginBtn.scrollIntoViewIfNeeded();
    // Click normally, as per locator pattern in your example
    await loginBtn.click();

    await Promise.race([
      page.waitForNavigation({ waitUntil: 'networkidle' }),
      page.locator('text=Logout').waitFor({ timeout: 20000 })
    ]);

    console.log('✅ Login successful!');

    console.log('📖 Navigating to Book Ticket page...');
    await page.goto('https://www.irctc.co.in/nget/train-search', { waitUntil: 'domcontentloaded' });
    await page.locator('input[formcontrolname="fromStation"]').waitFor({ state: 'visible', timeout: 7000 });
    console.log('🎯 Booking form loaded.');

    console.log('🕒 Keeping session active for 2 minutes...');
    const interval = setInterval(async () => {
      console.log('🔄 Refreshing session...');
      await page.reload({ waitUntil: 'domcontentloaded' });
    }, 20000);

    setTimeout(async () => {
      clearInterval(interval);
      console.log('⏳ 2 minutes elapsed. Closing browser.');
      await browser.close();
    }, 120000);

  } catch (err) {
    console.error('❗ Error encountered:', err);
    await page.screenshot({ path: 'error.png', fullPage: true });
    await browser.close();
  }
})();