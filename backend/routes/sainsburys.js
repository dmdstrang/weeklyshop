import { Router } from 'express';
import { addToBasket } from '../playwright/addToBasket.js';
import { supabase } from '../lib/supabase.js';

const router = Router();

// POST /api/sainsburys/add-to-basket
// Body: { week, email, password }
// Streams SSE progress back to client
router.post('/add-to-basket', async (req, res) => {
  const { week, email, password } = req.body;
  if (!week || !email || !password) {
    return res.status(400).json({ error: 'week, email and password required' });
  }

  // Fetch shopping list
  const { data: list } = await supabase
    .from('shopping_list').select('items').eq('week_start', week).single();

  if (!list) return res.status(404).json({ error: 'Shopping list not found. Generate it first.' });

  const items = list.items.filter(i => !i.checked);

  // Set up SSE
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  const send = (data) => res.write(`data: ${JSON.stringify(data)}\n\n`);

  send({ type: 'start', total: items.length });

  try {
    const result = await addToBasket({ email, password, items, onProgress: send });

    // Mark as sent
    await supabase.from('shopping_list').update({
      sent_to_sainsburys: true,
      sent_at: new Date().toISOString()
    }).eq('week_start', week);

    send({ type: 'done', added: result.added, failed: result.failed });
  } catch (err) {
    send({ type: 'error', message: err.message });
  }

  res.end();
});

export default router;
