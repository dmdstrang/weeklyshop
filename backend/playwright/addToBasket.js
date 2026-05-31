import { chromium } from 'playwright';

export async function addToBasket({ email, password, items, onProgress }) {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
  });
  const page = await context.newPage();

  const added = [];
  const failed = [];

  try {
    // Login
    onProgress({ type: 'progress', step: 'Logging in to Sainsbury\'s...' });
    await page.goto('https://www.sainsburys.co.uk/webapp/wcs/stores/servlet/LogonView?catalogId=10241&langId=44&storeId=10151');
    await page.waitForLoadState('networkidle');

    // Handle cookie consent if present
    try {
      await page.click('#onetrust-accept-btn-handler', { timeout: 3000 });
    } catch {}

    await page.fill('#logonId', email);
    await page.fill('#logonPassword', password);
    await page.click('[type="submit"]');
    await page.waitForLoadState('networkidle');

    // Check login success
    const url = page.url();
    if (url.includes('LogonView') || url.includes('login')) {
      throw new Error('Login failed — please check your Sainsbury\'s email and password in Settings.');
    }

    onProgress({ type: 'progress', step: 'Logged in! Adding items...' });

    // Add each item
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      onProgress({ type: 'item_start', item: item.name, index: i, total: items.length });

      try {
        await page.goto(`https://www.sainsburys.co.uk/shop/SearchResultsCmd?langId=44&storeId=10151&catalogId=10241&sortBy=RELEVANCE&searchTerm=${encodeURIComponent(item.name)}&beginIndex=0`);
        await page.waitForLoadState('networkidle');

        // Click "Add to trolley" on first result
        const addBtn = page.locator('[data-test-id="add-to-trolley"]').first();
        if (await addBtn.isVisible({ timeout: 3000 })) {
          await addBtn.click();
          await page.waitForTimeout(500);
          added.push(item.name);
          onProgress({ type: 'item_done', item: item.name, success: true });
        } else {
          failed.push({ item: item.name, reason: 'Not found on Sainsbury\'s' });
          onProgress({ type: 'item_done', item: item.name, success: false, reason: 'Not found' });
        }
      } catch (err) {
        failed.push({ item: item.name, reason: err.message });
        onProgress({ type: 'item_done', item: item.name, success: false, reason: err.message });
      }
    }
  } finally {
    await browser.close();
  }

  return { added, failed };
}
