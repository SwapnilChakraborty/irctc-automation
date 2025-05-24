const { chromium } = require('playwright');
const fs = require('fs');
const readline = require('readline');

function askQuestion(prompt) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise(resolve => rl.question(prompt, ans => { rl.close(); resolve(ans); }));
}

(async () => {
  const browser = await chromium.launch({ headless: false, slowMo: 80 });
  const page = await (await browser.newContext({ viewport: { width:1280, height:800 } })).newPage();

  try {
    console.log("  Opening IRCTC…");
    await page.goto('https://www.irctc.co.in/nget/train-search', { waitUntil:'domcontentloaded', timeout:60000 });
    await page.waitForTimeout(2000);

    // Dismiss cookies
    try { await page.click('text=OK', { timeout:5000 }); } catch {}

    // Open login modal via JS click
    console.log(" Opening login modal…");
    await page.evaluate(() => {
      document.querySelector('a[aria-label="Click here to Login in application"]')?.click();
    });
    await page.waitForSelector('input[placeholder="User Name"]', { timeout:15000 });

    // Fill credentials
    console.log("  Filling credentials…");
    await page.fill('input[placeholder="User Name"]', 'your Username');
    await page.fill('input[placeholder="Password"]', 'Your Password');

     // Capture CAPTCHA
    const capPath = 'captcha.png';
    if (fs.existsSync(capPath)) fs.unlinkSync(capPath);

    console.log(" Capturing CAPTCHA…");
    try {
      const canvas = await page.waitForSelector('canvas', { timeout: 5000 });
      await canvas.screenshot({ path: capPath });
      console.log("   Saved canvas captcha.");
    } catch {
      const loginForm = await page.waitForSelector('form:has(input[placeholder=\"Enter Captcha\"])', { timeout: 10000 });
      await loginForm.screenshot({ path: capPath });
      console.log("   Saved login-form captcha fallback.");
    }

    // Manual CAPTCHA entry
    console.log(" Open captcha.png and enter the text below:");
    const code = await askQuestion(" Enter captcha: ");
    await page.fill('input[placeholder=\"Enter Captcha\"]', code.trim());

    // Submit
    console.log(" Submitting form…");
    await page.evaluate(() => document.querySelector('button[type="submit"]')?.click());
    await page.waitForTimeout(7000);

    // Verify login and keep session alive
    if (page.url().includes('train-search') || await page.$('app-train-list')) {
      console.log(" Logged in! Refreshing every 20 s for 2 min…");
      const id = setInterval(() => page.reload({ waitUntil:'domcontentloaded' }), 20000);
      setTimeout(async () => { clearInterval(id); console.log("⏲ Done."); await browser.close(); }, 120000);
    } else {
      console.log(" Login failed. Check credentials/captcha.");
      await browser.close();
    }

  } catch (e) {
    console.error(" Error:", e.message);
    await page.screenshot({ path:'error.png' });
    await browser.close();
  }
})();
