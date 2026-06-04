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

// POST /api/pepesto/match?week=2026-06-01
// Matches shopping list items to Sainsbury's products with prices
router.post('/match', async (req, res) => {
  const { week } = req.query;
  if (!process.env.PEPESTO_API_KEY) {
    return res.status(503).json({ error: 'PEPESTO_API_KEY not set in environment' });
  }

  // Fetch shopping list
  const { data: list } = await supabase
    .from('shopping_list').select('items').eq('week_start', week).single();

  if (!list) return res.status(404).json({ error: 'Shopping list not found — generate it first' });

  const items = list.items.filter(i => !i.checked);
  const shoppingText = items.map(i => `${i.qty ? i.qty + ' ' : ''}${i.name}`).join('\n');

  try {
    const response = await fetch(`${PEPESTO_BASE}/api/products`, {
      method: 'POST',
      headers: pepestoHeaders(),
      body: JSON.stringify({
        manual_shopping_list: shoppingText,
        supermarket_domain: SAINSBURYS_DOMAIN,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      return res.status(response.status).json({ error: err });
    }

    const data = await response.json();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/pepesto/checkout?week=2026-06-01
// Uses oneshot to get a direct Sainsbury's checkout URL
router.post('/checkout', async (req, res) => {
  const { week } = req.query;
  if (!process.env.PEPESTO_API_KEY) {
    return res.status(503).json({ error: 'PEPESTO_API_KEY not set in environment' });
  }

  const { data: list } = await supabase
    .from('shopping_list').select('items').eq('week_start', week).single();

  if (!list) return res.status(404).json({ error: 'Shopping list not found — generate it first' });

  const items = list.items.filter(i => !i.checked);
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

    if (!response.ok) {
      const err = await response.text();
      return res.status(response.status).json({ error: err });
    }

    const data = await response.json();
    console.log('Pepesto oneshot response:', JSON.stringify(data, null, 2));

    // Mark list as sent
    await supabase.from('shopping_list')
      .update({ sent_to_sainsburys: true, sent_at: new Date().toISOString() })
      .eq('week_start', week);

    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/pepesto/credits — check remaining credits
router.get('/credits', async (_req, res) => {
  if (!process.env.PEPESTO_API_KEY) {
    return res.status(503).json({ error: 'PEPESTO_API_KEY not set' });
  }
  try {
    const response = await fetch(`${PEPESTO_BASE}/api/credits`, {
      method: 'POST',
      headers: pepestoHeaders(),
      body: JSON.stringify({}),
    });
    const data = await response.json();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
