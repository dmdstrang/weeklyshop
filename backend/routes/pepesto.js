import { Router } from 'express';
import { supabase } from '../lib/supabase.js';

const router = Router();
const PEPESTO_BASE = 'https://s.pepesto.com';
const SAINSBURYS_DOMAIN = 'sainsburys.co.uk';

function pepestoHeaders() {
  return {
    'Authorization': `Bearer ${process.env.PEPESTO_API_KEY}`,
    'Content-Type': 'application/json',
  };
}

// Safely parse response — Pepesto sometimes returns plain text errors even on 200
async function safeJson(response) {
  const text = await response.text();
  try {
    return { ok: response.ok, status: response.status, data: JSON.parse(text) };
  } catch {
    return { ok: false, status: response.status, data: null, error: text };
  }
}

// Split array into chunks
function chunk(arr, size) {
  const chunks = [];
  for (let i = 0; i < arr.length; i += size) chunks.push(arr.slice(i, i + size));
  return chunks;
}

async function pepestoProducts(shoppingText) {
  const response = await fetch(`${PEPESTO_BASE}/api/products`, {
    method: 'POST',
    headers: pepestoHeaders(),
    body: JSON.stringify({ manual_shopping_list: shoppingText, supermarket_domain: SAINSBURYS_DOMAIN }),
  });
  return safeJson(response);
}

// POST /api/pepesto/match?week=2026-06-01
router.post('/match', async (req, res) => {
  const { week } = req.query;
  if (!process.env.PEPESTO_API_KEY) {
    return res.status(503).json({ error: 'PEPESTO_API_KEY not set in environment' });
  }

  const { data: list } = await supabase
    .from('shopping_list').select('items').eq('week_start', week).single();
  if (!list) return res.status(404).json({ error: 'Shopping list not found — generate it first' });

  const items = list.items.filter(i => !i.checked);
  const lines = items.map(i => `${i.qty ? i.qty + ' ' : ''}${i.name}`);

  try {
    // Pepesto has a ~15 ingredient limit — batch requests
    const batches = chunk(lines, 12);
    const results = [];

    for (const batch of batches) {
      const { ok, data, error } = await pepestoProducts(batch.join('\n'));
      if (!ok || error) return res.status(500).json({ error: error || 'Pepesto error' });
      if (data?.items) results.push(...data.items);
    }

    res.json({ items: results });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Aisles unlikely to need buying (pantry staples people usually have)
const PANTRY_AISLES = ['condiments', 'spices', 'alcohol'];

// POST /api/pepesto/checkout?week=2026-06-01
router.post('/checkout', async (req, res) => {
  const { week } = req.query;
  if (!process.env.PEPESTO_API_KEY) {
    return res.status(503).json({ error: 'PEPESTO_API_KEY not set in environment' });
  }

  const { data: list } = await supabase
    .from('shopping_list').select('items').eq('week_start', week).single();
  if (!list) return res.status(404).json({ error: 'Shopping list not found — generate it first' });

  // Filter out pantry staples and already-checked items, limit to 12 for Pepesto
  const items = list.items
    .filter(i => !i.checked && !PANTRY_AISLES.includes(i.aisle))
    .slice(0, 12);
  const shoppingText = items.map(i => `${i.qty ? i.qty + ' ' : ''}${i.name}`).join('\n');

  try {
    const response = await fetch(`${PEPESTO_BASE}/api/oneshot`, {
      method: 'POST',
      headers: pepestoHeaders(),
      body: JSON.stringify({
        manual_shopping_list: shoppingText,
        supermarket_domain: SAINSBURYS_DOMAIN,
      }),
    });

    const { ok, data, error } = await safeJson(response);
    console.log('Pepesto oneshot response:', JSON.stringify(data, null, 2));
    if (!ok || error) return res.status(500).json({ error: error || 'Pepesto error' });

    await supabase.from('shopping_list')
      .update({ sent_to_sainsburys: true, sent_at: new Date().toISOString() })
      .eq('week_start', week);

    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
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
