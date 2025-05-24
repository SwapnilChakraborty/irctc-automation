# IRCTC Login Automation - API Documentation

This document describes the key APIs and Playwright methods used in the IRCTC login automation script.

## Overview

The script automates the following flow:

1. Navigate to IRCTC Next Generation E-Ticketing site
2. Open the login modal programmatically (via JavaScript click)
3. Fill in user credentials (username & password)
4. Capture the CAPTCHA image and prompt for manual entry
5. Submit the login form
6. Detect successful login and land on the Book Ticket page
7. Keep the session alive by refreshing the page every 20 seconds for 2 minutes

## Prerequisites

* Node.js v14+ installed
* Playwright installed (`npm install playwright`)
* Browsers installed (`npx playwright install`)

## Key Playwright APIs Used

* **`page.goto(url, options)`**: Navigate to the IRCTC homepage with options such as `waitUntil` and `timeout`.
* **`page.setViewportSize({ width, height })`**: Enforce a desktop-like viewport for consistent UI rendering.
* **`page.click(selector, options)`**: Interact with buttons and links (e.g., open menu, click login) using options like `force` or custom timeouts.
* **`page.fill(selector, value)`**: Enter text into input fields (username, password, captcha).
* **`elementHandle.screenshot({ path })`**: Capture screenshots of specific elements (canvas or form) for manual captcha solving.
* **`page.reload({ waitUntil })`**: Refresh the Book Ticket page every 20 seconds to keep the session active.
* **`page.evaluate(fn, ...args)`**: Execute custom JavaScript in the page context (used for programmatic clicks to bypass visibility checks).
* **`page.waitForSelector(selector, options)`**: Wait for elements to appear or become visible before interacting.
* **`page.waitForTimeout(ms)`**: Insert manual delays to accommodate animations or dynamic rendering.

## Captcha Handling

* The script attempts to capture the `<canvas>` element (common for IRCTC captcha) via:

  ```js
  const canvas = await page.waitForSelector('canvas', { timeout: 5000 });
  await canvas.screenshot({ path: 'captcha.png' });
  ```
* If the canvas is not found, it falls back to capturing the login `<form>` containing the captcha input:

  ```js
  const form = await page.waitForSelector('form:has(input[placeholder="Enter Captcha"])', { timeout: 10000 });
  await form.screenshot({ path: 'captcha.png' });
  ```
* The user is then prompted in the terminal to open `captcha.png`, read the text, and enter it manually.

## Session Keep-Alive

* After successful login detection (via URL or presence of booking-specific element), the script keeps the session alive for 2 minutes by periodically reloading:

  ```js
  const interval = setInterval(() => {
    await page.reload({ waitUntil: 'domcontentloaded' });
  }, 20000);

  setTimeout(() => {
    clearInterval(interval);
    await browser.close();
  }, 120000);
  ```

## Error Handling & Debugging

* Errors are caught in a `try/catch` block, with a screenshot saved to `error.png`:

  ```js
  try { ... } catch (err) {
    console.error(err.message);
    await page.screenshot({ path: 'error.png' });
  }
  ```
* Logging statements (`console.log`) are added at each major step for clarity.

---


