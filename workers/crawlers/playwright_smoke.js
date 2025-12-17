#!/usr/bin/env node
// Simple Playwright smoke test (no DB access)
const playwright = require('playwright');

async function run() {
  const browser = await playwright.chromium.launch({ headless: true });
  try {
    const page = await browser.newPage();
    const q = process.argv.slice(2).join(' ') || 'barber shop San Francisco instagram';
    const url = `https://duckduckgo.com/?q=${encodeURIComponent(q)}`;
    console.log('Navigating to', url);
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
    const anchors = await page.$$eval('a', as => as.map(a => ({ href: a.href, text: (a.innerText||a.textContent||'').trim() })).filter(a=>a.href));
    console.log('Found anchors (first 20):');
    anchors.slice(0,20).forEach((a,i)=> console.log(String(i+1).padStart(2,' '), a.href, ' — ', a.text.substring(0,80)));
    await page.close();
    return 0;
  } catch (e) {
    console.error('Smoke test failed:', e && e.message ? e.message : e);
    return 2;
  } finally {
    try { await browser.close(); } catch (e) {}
  }
}

if (require.main === module) {
  run().then(code => process.exit(code)).catch(() => process.exit(1));
}
