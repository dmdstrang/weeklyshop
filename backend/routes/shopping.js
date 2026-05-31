import { Router } from 'express';
import { supabase } from '../lib/supabase.js';

const router = Router();

// POST /api/shopping/generate?week=2026-06-01
router.post('/generate', async (req, res) => {
  const { week } = req.query;
  if (!week) return res.status(400).json({ error: 'week required' });

  // Fetch the plan with meal ingredients
  const { data: plan, error } = await supabase
    .from('meal_plan')
    .select('*, meal:meal_library(ingredients)')
    .eq('week_start', week)
    .eq('is_out', false);

  if (error) return res.status(500).json({ error: error.message });

  // Aggregate ingredients
  const ingredientMap = {};
  for (const entry of plan) {
    const ingredients = entry.meal?.ingredients || [];
    for (const ing of ingredients) {
      const key = ing.name.toLowerCase();
      if (!ingredientMap[key]) {
        ingredientMap[key] = { ...ing, checked: false };
      }
    }
  }

  const mealItems = Object.values(ingredientMap).sort((a, b) =>
    (a.aisle || '').localeCompare(b.aisle || '') || a.name.localeCompare(b.name)
  );

  // Preserve any existing extras
  const { data: existing } = await supabase
    .from('shopping_list').select('items').eq('week_start', week).single();
  const extras = (existing?.items || []).filter(i => i.isExtra);

  const items = [...mealItems, ...extras];

  // Upsert shopping list
  const { data: list, error: e2 } = await supabase
    .from('shopping_list')
    .upsert({ week_start: week, items, sent_to_sainsburys: false, sent_at: null },
             { onConflict: 'week_start' })
    .select();

  if (e2) return res.status(500).json({ error: e2.message });
  res.json(list[0]);
});

// GET /api/shopping?week=2026-06-01
router.get('/', async (req, res) => {
  const { week } = req.query;
  const { data, error } = await supabase
    .from('shopping_list')
    .select('*')
    .eq('week_start', week)
    .single();

  if (error && error.code !== 'PGRST116') return res.status(500).json({ error: error.message });
  res.json(data || null);
});

// PATCH /api/shopping/item — toggle checked state
router.patch('/item', async (req, res) => {
  const { week, itemName, checked } = req.body;
  const { data: list } = await supabase
    .from('shopping_list').select('items').eq('week_start', week).single();

  if (!list) return res.status(404).json({ error: 'list not found' });

  const items = list.items.map(i =>
    i.name.toLowerCase() === itemName.toLowerCase() ? { ...i, checked } : i
  );

  const { data, error } = await supabase
    .from('shopping_list')
    .update({ items })
    .eq('week_start', week)
    .select();

  if (error) return res.status(500).json({ error: error.message });
  res.json(data[0]);
});

// POST /api/shopping/extra — add a free-text extra item
router.post('/extra', async (req, res) => {
  const { week, name } = req.body;
  if (!week || !name) return res.status(400).json({ error: 'week and name required' });

  const { data: existing } = await supabase
    .from('shopping_list').select('items').eq('week_start', week).single();

  const items = existing?.items || [];
  const alreadyExists = items.some(i => i.name.toLowerCase() === name.toLowerCase());
  if (alreadyExists) return res.json(existing);

  const newItem = { name, qty: '', aisle: 'extras', checked: false, isExtra: true };

  const { data, error } = await supabase
    .from('shopping_list')
    .upsert({ week_start: week, items: [...items, newItem] }, { onConflict: 'week_start' })
    .select();

  if (error) return res.status(500).json({ error: error.message });
  res.json(data[0]);
});

// DELETE /api/shopping/extra — remove an extra item
router.delete('/extra', async (req, res) => {
  const { week, name } = req.body;
  const { data: existing } = await supabase
    .from('shopping_list').select('items').eq('week_start', week).single();

  if (!existing) return res.status(404).json({ error: 'list not found' });

  const items = existing.items.filter(i => i.name.toLowerCase() !== name.toLowerCase());
  const { data, error } = await supabase
    .from('shopping_list').update({ items }).eq('week_start', week).select();

  if (error) return res.status(500).json({ error: error.message });
  res.json(data[0]);
});

export default router;
