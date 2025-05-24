# IRCTC Login Automation - Playwright (JavaScript)

## Overview

This project demonstrates automation of the IRCTC login process using Playwright with JavaScript. The goal was to:

- Log into the IRCTC website
- Handle captcha with manual input (due to image-based security)
- Land on the "Book Ticket" page after login
- Keep the session alive for 2 minutes

## Stack Used

- **Node.js**
- **Playwright**
- **JavaScript**

## Why Playwright?

Playwright offers modern automation capabilities, built-in Chromium support, and better stealth compared to older tools like Selenium. It also handles dynamic SPA-based websites like IRCTC effectively.

## Features

- Manual captcha input for quick MVP turnaround
- Page reload to simulate user activity and keep session alive
- Cookie and session management via Playwright context

## Setup Instructions

1. Clone or download this repo.
2. Install dependencies:
   ```bash
   npm install playwright


3. Replace `'your_username'` and `'your_password'` in `index.js` with your IRCTC credentials.

## Usage

Run the script: