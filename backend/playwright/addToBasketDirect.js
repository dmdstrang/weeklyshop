import { chromium } from 'playwright';

/**
 * Logs into Sainsbury's and adds products directly by their product page URLs.
 * Much more reliable than searching — Pepesto gives us exact product URLs.
 */
export async function addToBasketDirect({ email, password, products, onProgress }) {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
    viewport: { width: 390, height: 844 },
  });
  const page = await context.newPage();

  const added = [];
  const failed = [];

  try {
    // ── Login ──────────────────────────────────────────────────────
    onProgress({ type: 'progress', step: 'Logging in to Sainsbury\'s…' });

    await page.goto('https://www.sainsburys.co.uk/webapp/wcs/stores/servlet/LogonView?catalogId=10241&langId=44&storeId=10151', {
      waitUntil: 'domcontentloaded', timeout: 30000
    });

    // Accept cookies if present
    try {
      await page.click('#onetrust-accept-btn-handler', { timeout: 4000 });
      await page.waitForTimeout(500);
    } catch {}

    // Fill login form
    await page.fill('#logonId', email);
    await page.fill('#logonPassword', password);
    await page.click('[type="submit"]');

    try {
      await page.waitForURL(url => !url.includes('LogonView'), { timeout: 15000 });
    } catch {
      throw new Error('Login failed — check your Sainsbury\'s email and password in Settings');
    }

    onProgress({ type: 'progress', step: 'Logged in! Adding items…' });

    // ── Add each product by direct URL ─────────────────────────────
    for (let i = 0; i < products.length; i++) {
      const { name, url, itemName } = products[i];
      onProgress({ type: 'item_start', item: itemName || name, index: i, total: products.length });

      try {
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 20000 });

        // Try multiple possible "Add to trolley" selectors
        const selectors = [
          'button[data-test-id="add-button"]',
          'button[aria-label*="Add"]',
          '[data-test-id="add-to-trolley"]',
          'button.addButton',
          'button:has-text("Add to trolley")',
          'button:has-text("Add")',
        ];

        let added_ok = false;
        for (const sel of selectors) {
          try {
            const btn = page.locator(sel).first();
            if (await btn.isVisible({ timeout: 3000 })) {
              await btn.click();
              await page.waitForTimeout(800);
              added_ok = true;
              break;
            }
          } catch {}
        }

        if (added_ok) {
          added.push(itemName || name);
          onProgress({ type: 'item_done', item: itemName || name, success: true, product: name });
        } else {
          failed.push({ item: itemName || name, reason: 'Add button not found' });
          onProgress({ type: 'item_done', item: itemName || name, success: false, reason: 'Add button not found' });
        }
      } catch (err) {
        failed.push({ item: itemName || name, reason: err.message });
        onProgress({ type: 'item_done', item: itemName || name, success: false, reason: err.message });
      }
    }

  } finally {
    await browser.close();
  }

  return { added, failed };
}
