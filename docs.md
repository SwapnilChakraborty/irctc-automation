# IRCTC Login Automation API Documentation

## Overview
This script automates logging into the IRCTC website using Playwright.

## Key Steps / APIs
- **page.goto(url)**: Navigates to IRCTC homepage.
- **page.setViewportSize()**: Sets screen size for consistent UI.
- **page.click(selector)**: Used to open the menu and click login.
- **page.fill(selector, value)**: Enters username, password, and captcha.
- **page.screenshot()**: Captures captcha image for manual input.
- **page.reload()**: Keeps session alive by refreshing the Book Ticket page every 20 seconds.

## Captcha Handling
Manual captcha input is required. The captcha image is saved as `captcha.png`.

## Limitations
- Captcha solving is manual due to complexity.
- The script assumes desktop viewport for correct UI elements.

