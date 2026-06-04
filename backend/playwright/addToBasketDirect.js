import { chromium } from 'playwright';
import { supabase } from '../lib/supabase.js';

/**
 * Adds products directly by their Sainsbury's product page URLs, reusing a
 * stored authenticated session (captured once via scripts/captureSession.js).
 */
export async function addToBasketDirect({ products, onProgress }) {
  // Load the stored session
  const { data: row } = await supabase
    .from('preferences').select('value').eq('key', 'sainsburys_session').single();

  if (!row?.value) {
    throw new Error('No Sainsbury\'s session saved. Connect your account first (one-time setup).');
  }

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    storageState: row.value,
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    viewport: { width: 1280, height: 900 },
  });
  const page = await context.newPage();

  const added = [];
  const failed = [];

  try {
    // Verify the session is still valid
    onProgress({ type: 'progress', step: 'Checking your Sainsbury\'s session…' });
    await page.goto('https://www.sainsburys.co.uk/gol-ui/groceries', {
      waitUntil: 'domcontentloaded', timeout: 30000,
    });

    const bodyText = (await page.locator('body').innerText().catch(() => '')) || '';
    if (/log in|sign in/i.test(bodyText) && !/log ?out|account/i.test(bodyText)) {
      throw new Error('Your Sainsbury\'s session has expired. Please reconnect your account.');
    }

    onProgress({ type: 'progress', step: 'Session OK. Adding items…' });

    for (let i = 0; i < products.length; i++) {
      const { name, url, itemName } = products[i];
      onProgress({ type: 'item_start', item: itemName || name, index: i, total: products.length });

      try {
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 20000 });

        const selectors = [
          'button[data-test-id="add-button"]',
          'button[data-testid="add-button"]',
          'button[aria-label*="Add" i]',
          '[data-test-id="add-to-trolley"]',
          'button:has-text("Add")',
        ];

        let ok = false;
        for (const sel of selectors) {
          try {
            const btn = page.locator(sel).first();
            if (await btn.isVisible({ timeout: 2500 })) {
              await btn.click();
              await page.waitForTimeout(700);
              ok = true;
              break;
            }
          } catch {}
        }

        if (ok) {
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
