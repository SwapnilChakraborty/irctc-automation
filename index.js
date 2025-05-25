const { chromium } = require('playwright');
const fs = require('fs');
const readline = require('readline');

function askQuestion(prompt) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise(res => rl.question(prompt, ans => { rl.close(); res(ans); }));
}

async function humanType(page, selector, text) {
  for (const char of text) {
    await page.type(selector, char);
    await page.waitForTimeout(100 + Math.random() * 100);
  }
}

(async () => {
  const browser = await chromium.launch({ headless: false, slowMo: 50 });
  const context = await browser.newContext({
    viewport: { width: 1366, height: 768 },
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119 Safari/537.36',
  });

  // Stealth
  await context.addInitScript(() => {
    Object.defineProperty(navigator, 'webdriver', { get: () => false });
    Object.defineProperty(navigator, 'languages', { get: () => ['en-US', 'en'] });
    Object.defineProperty(navigator, 'plugins', { get: () => [1, 2, 3, 4, 5] });
  });

  const page = await context.newPage();

  try {
    console.log('🔹 Opening IRCTC…');
    await page.goto('https://www.irctc.co.in/nget/train-search', { waitUntil: 'domcontentloaded', timeout: 60000 });

    // Dismiss popup
    try { await page.click('text=OK', { timeout: 5000 }); } catch {}

    console.log('🔹 Opening login modal…');
    await page.evaluate(() => document.querySelector('a[aria-label="Click here to Login in application"]')?.click());
    await page.waitForSelector('input[placeholder="User Name"]', { timeout: 15000 });

    console.log('🔹 Typing credentials…');
    await humanType(page, 'input[placeholder="User Name"]', 'Akshatraj07');
    await humanType(page, 'input[placeholder="Password"]', '@Somu123');

      // Capture CAPTCHA
    console.log('🔹 Capturing CAPTCHA…');
    const capPath = 'captcha.png';
    if (fs.existsSync(capPath)) fs.unlinkSync(capPath);
    let gotCaptcha = false;
    try {
      const canvas = await page.waitForSelector('canvas', { timeout: 5000 });
      await canvas.screenshot({ path: capPath });
      gotCaptcha = true;
    } catch {
      // Fallback: screenshot specific form containing captcha input
      const form = await page.waitForSelector('form:has(input[placeholder="Enter Captcha"])', { timeout: 5000 });
      await form.screenshot({ path: capPath });
      gotCaptcha = true;
    }
    if (!gotCaptcha) throw new Error('Unable to capture CAPTCHA');

    console.log('🔹 Open captcha.png and type it below');
    const captcha = await askQuestion('🔑 CAPTCHA: ');
    await page.fill('input[placeholder="Enter Captcha"]', captcha.trim());

    // Submit

   console.log('🔹 Submitting login…');
   const captchaInput = await page.waitForSelector('input[placeholder="Enter Captcha"]', { timeout: 10000 });
   const loginForm = await captchaInput.evaluateHandle(el => el.closest('form'));
   const submitButton = await loginForm.$('button[type="submit"]');

  try { 
  await Promise.all([
    submitButton.click(),
    page.waitForSelector('xpath=/html/body/app-root/app-home/div[1]/app-header/div[2]/div[2]/div[1]/a[1]', { timeout: 15000 }),
  ]);
  console.log('✅ Login successful!');
  } catch {
  console.error('❌ Login failed — credentials/captcha or bot-detection.');
  await page.screenshot({ path: 'login-failed.png' });
  await browser.close();
  return;
}



    // Accept cookies

    // console.log('🔹 Accepting cookies…');
    // await page.waitForSelector('button[aria-label="Accept Cookies"]', { timeout: 10000 });
    // await page.click('button[aria-label="Accept Cookies"]');


    // Go to booking page directly
    console.log('📖 Navigating to Book Ticket page…');
    await page.goto('https://www.irctc.co.in/nget/train-search', {
      waitUntil: 'domcontentloaded', timeout: 30000
    });

    console.log('🔍 Waiting for booking form…');
   try {
   await page.waitForSelector('input[formcontrolname="stationFrom"], input[placeholder*="From"]', { timeout: 10000 });
   console.log('🎯 Booking form found!');
   } catch {
   console.log('⚠️ Booking form inputs not found, waiting for container as fallback...');
   await page.waitForSelector('xpath=//*[@id="divMain"]/div/app-main-page/div/div/div[1]/div[1]/div[1]', { timeout: 15000 });
   console.log('🎯 Booking form container found!');
  }


    // Keep session alive for 2 mins
    console.log('🔄 Keeping session alive for 2 minutes…');
    const keepAlive = setInterval(async () => {
      console.log('🔁 Refreshing page to keep session alive…');
      await page.reload({ waitUntil: 'domcontentloaded' });
    }, 30000); // refresh every 30 sec

    setTimeout(async () => {
      clearInterval(keepAlive);
      console.log('⏱ 2 minutes complete. Closing browser.');
      await browser.close();
    }, 120000);

  } catch (e) {
    console.error('🚨 Error:', e.message);
    await page.screenshot({ path: 'error.png' });
    await browser.close();
  }
})();
