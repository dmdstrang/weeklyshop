import { Router } from 'express';
import { supabase } from '../lib/supabase.js';
import { addToBasketDirect } from '../playwright/addToBasketDirect.js';

const router = Router();
const PEPESTO_BASE = 'https://s.pepesto.com';
const SAINSBURYS_DOMAIN = 'sainsburys.co.uk';
const PANTRY_AISLES = ['condiments', 'spices', 'alcohol'];

function pepestoHeaders() {
  return {
    'Authorization': `Bearer ${process.env.PEPESTO_API_KEY}`,
    'Content-Type': 'application/json',
  };
}

async function safeJson(response) {
  const text = await response.text();
  try {
    return { ok: response.ok, status: response.status, data: JSON.parse(text) };
  } catch {
    return { ok: false, status: response.status, data: null, error: text };
  }
}

function chunk(arr, size) {
  const chunks = [];
  for (let i = 0; i < arr.length; i += size) chunks.push(arr.slice(i, i + size));
  return chunks;
}

async function pepestoProducts(shoppingText) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20000);
  try {
    const response = await fetch(`${PEPESTO_BASE}/api/products`, {
      method: 'POST',
      headers: pepestoHeaders(),
      signal: controller.signal,
      body: JSON.stringify({ manual_shopping_list: shoppingText, supermarket_domain: SAINSBURYS_DOMAIN }),
    });
    return safeJson(response);
  } catch (err) {
    if (err.name === 'AbortError') return { ok: false, error: 'Request timed out' };
    throw err;
  } finally {
    clearTimeout(timeout);
  }
}

// POST /api/pepesto/match?week=2026-06-01
// Match shopping list items to Sainsbury's products — shows names and prices
router.post('/match', async (req, res) => {
  const { week } = req.query;
  if (!process.env.PEPESTO_API_KEY) return res.status(503).json({ error: 'PEPESTO_API_KEY not set' });

  const { data: list } = await supabase
    .from('shopping_list').select('items').eq('week_start', week).single();
  if (!list) return res.status(404).json({ error: 'Shopping list not found — generate it first' });

  const items = list.items.filter(i => !i.checked);
  const lines = items.map(i => `${i.qty ? i.qty + ' ' : ''}${i.name}`);

  try {
    const batches = chunk(lines, 12);
    const batchResults = await Promise.all(batches.map(b => pepestoProducts(b.join('\n'))));
    const results = [];
    for (const { data, error } of batchResults) {
      if (error) console.warn('Batch error:', error);
      if (data?.items) results.push(...data.items);
    }
    res.json({ items: results });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/pepesto/checkout?week=2026-06-01
// 1. Pepesto matches items → gets exact Sainsbury's product URLs
// 2. Playwright logs in and adds each product directly by URL
// Streams SSE progress
router.post('/checkout', async (req, res) => {
  const { week } = req.query;
  if (!process.env.PEPESTO_API_KEY) return res.status(503).json({ error: 'PEPESTO_API_KEY not set' });

  const { data: list } = await supabase
    .from('shopping_list').select('items').eq('week_start', week).single();
  if (!list) return res.status(404).json({ error: 'Shopping list not found — generate it first' });

  const items = list.items.filter(i => !i.checked && !PANTRY_AISLES.includes(i.aisle));

  // Set up SSE
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  const send = (data) => res.write(`data: ${JSON.stringify(data)}\n\n`);

  send({ type: 'progress', step: 'Finding products on Sainsbury\'s…' });

  try {
    // Step 1: Pepesto matches items to exact Sainsbury's product URLs
    const lines = items.map(i => `${i.qty ? i.qty + ' ' : ''}${i.name}`);
    const batches = chunk(lines, 12);
    const batchResults = await Promise.all(batches.map(b => pepestoProducts(b.join('\n'))));

    const products = [];
    for (const { data } of batchResults) {
      if (!data?.items) continue;
      for (const item of data.items) {
        const best = item.products?.[0]?.product;
        if (best?.product_id) {
          products.push({
            itemName: item.item_name,
            name: best.product_name,
            url: best.product_id,
          });
        }
      }
    }

    send({ type: 'progress', step: `Matched ${products.length} products. Opening Sainsbury's…` });

    // Step 2: Playwright adds each product directly by URL (reuses stored session)
    const result = await addToBasketDirect({ products, onProgress: send });

    await supabase.from('shopping_list')
      .update({ sent_to_sainsburys: true, sent_at: new Date().toISOString() })
      .eq('week_start', week);

    send({ type: 'done', added: result.added, failed: result.failed });
  } catch (err) {
    send({ type: 'error', message: err.message });
  }

  res.end();
});

// GET /api/pepesto/session-status — is a Sainsbury's session connected?
router.get('/session-status', async (_req, res) => {
  const { data } = await supabase
    .from('preferences').select('value, updated_at').eq('key', 'sainsburys_session').single();
  res.json({
    connected: !!data?.value,
    capturedAt: data?.updated_at || null,
  });
});

// GET /api/pepesto/credits
router.get('/credits', async (_req, res) => {
  if (!process.env.PEPESTO_API_KEY) return res.status(503).json({ error: 'PEPESTO_API_KEY not set' });
  try {
    const response = await fetch(`${PEPESTO_BASE}/api/credits`, {
      method: 'POST', headers: pepestoHeaders(), body: JSON.stringify({}),
    });
    const { data, error } = await safeJson(response);
    if (error) return res.status(500).json({ error });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
