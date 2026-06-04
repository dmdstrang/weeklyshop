// One-time Sainsbury's session capture.
// Run locally on a machine with a display:  node scripts/captureSession.js
// Opens a real Chrome window — log in to Sainsbury's, and once you're back on
// the groceries site the script saves your session cookies to Supabase.

import 'dotenv/config';
import { chromium } from 'playwright';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

const LOGIN_URL = 'https://www.sainsburys.co.uk/gol-ui/groceries';

function isLoggedIn(cookies, url) {
  // Back on the groceries site (not the identity/login flow)…
  const onShop = /sainsburys\.co\.uk\/(gol-ui|shop)/.test(url)
    && !/login|identity|account\.sainsburys/.test(url);
  // …and holding an auth-ish cookie
  const hasAuth = cookies.some(c =>
    /auth|sso|token|wc_|gol_session|jsessionid/i.test(c.name) && c.value && c.value.length > 8
  );
  return onShop && hasAuth;
}

async function main() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 1200, height: 900 },
  });
  const page = await context.newPage();

  console.log('\n→ Opening Sainsbury\'s. Please LOG IN in the browser window.');
  console.log('  Once you land back on the groceries homepage, I\'ll save your session automatically.\n');

  await page.goto(LOGIN_URL, { waitUntil: 'domcontentloaded' });

  // Accept cookies
  try { await page.click('#onetrust-accept-btn-handler', { timeout: 4000 }); } catch {}

  // Poll for login (up to 6 minutes)
  const deadline = Date.now() + 6 * 60 * 1000;
  let captured = false;

  while (Date.now() < deadline) {
    await page.waitForTimeout(3000);
    let url, cookies;
    try {
      url = page.url();
      cookies = await context.cookies();
    } catch { continue; }

    if (isLoggedIn(cookies, url)) {
      // Confirm it's stable across two polls
      await page.waitForTimeout(2000);
      const storageState = await context.storageState();

      const { error } = await supabase.from('preferences').upsert(
        { key: 'sainsburys_session', value: storageState, updated_at: new Date().toISOString() },
        { onConflict: 'key' }
      );

      if (error) {
        console.error('Failed to save session:', error.message);
      } else {
        console.log('\n✓ Session captured and saved to Supabase.');
        console.log(`  ${storageState.cookies.length} cookies stored. You can now close this window.\n`);
      }
      captured = true;
      break;
    }
  }

  if (!captured) console.log('\nTimed out — did not detect a logged-in session. Try running again.\n');

  await browser.close();
  process.exit(captured ? 0 : 1);
}

main().catch(err => { console.error(err); process.exit(1); });
