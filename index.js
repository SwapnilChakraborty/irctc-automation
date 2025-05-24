const { chromium } = require('playwright');
const fs = require('fs');
const readline = require('readline');

// Helper function to prompt user input
function askQuestion(query) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  return new Promise(resolve => rl.question(query, ans => {
    rl.close();
    resolve(ans);
  }));
}

(async () => {
  const browser = await chromium.launch({ headless: false, slowMo: 100 });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    console.log("Navigating to IRCTC website...");
    await page.goto('https://www.irctc.co.in/nget/train-search', { waitUntil: 'domcontentloaded' });

    // Handle cookies popup (if any)
    try {
      await page.click('text=OK', { timeout: 3000 });
      console.log("Cookies popup accepted.");
    } catch {}

    // Click hamburger menu (three horizontal dots) to open the side menu
    console.log("Opening hamburger menu...");
    await page.click('button[aria-label="Menu"]');
    await page.waitForTimeout(1000);  // wait for menu animation

    // Now click the Login button inside the menu
    console.log("Clicking on LOGIN button inside menu...");
    await page.click('text=Login');
    await page.waitForSelector('input[placeholder="User Name"]', { timeout: 10000 });

    // Fill username and password (replace with your credentials)
    await page.fill('input[placeholder="User Name"]', 'your_username');
    await page.fill('input[placeholder="Password"]', 'your_password');

    // Remove old captcha.png if exists
    if (fs.existsSync('captcha.png')) {
      fs.unlinkSync('captcha.png');
    }

    // Capture captcha image screenshot
    await page.locator('#captchaImg').screenshot({ path: 'captcha.png' });
    console.log("Captcha image saved as captcha.png");

    // Prompt user to enter captcha
    console.log("Please open captcha.png and enter the captcha text below.");
    const captcha = await askQuestion('Enter captcha from captcha.png: ');

    // Fill captcha field
    await page.fill('input[placeholder="Enter Captcha"]', captcha.trim());

    // Click submit/login button
    await page.click('button[type="submit"]');

    // Wait a bit for login to process
    await page.waitForTimeout(5000);

    // Check if login successful by URL or element on Book Ticket page
    if (page.url().includes('train-search')) {
      console.log("Login successful!");

      // Keep session alive by reloading page every 20 seconds for 2 minutes
      console.log("Keeping session alive for 2 minutes...");
      const interval = setInterval(async () => {
        console.log("Refreshing session...");
        await page.reload();
      }, 20000);

      setTimeout(async () => {
        clearInterval(interval);
        console.log("2 minutes completed. Closing browser...");
        await browser.close();
        process.exit(0);
      }, 120000);

    } else {
      console.log("Login failed or captcha incorrect.");
      await browser.close();
      process.exit(1);
    }

  } catch (error) {
    console.error("Error occurred:", error);
    await browser.close();
    process.exit(1);
  }
})();
