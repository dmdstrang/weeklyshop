import { Router } from 'express';
import { supabase } from '../lib/supabase.js';

const router = Router();

// GET /api/mealplan?week=2026-06-01
router.get('/', async (req, res) => {
  const { week } = req.query;
  if (!week) return res.status(400).json({ error: 'week param required (YYYY-MM-DD Monday)' });

  const { data, error } = await supabase
    .from('meal_plan')
    .select('*, meal:meal_library(*)')
    .eq('week_start', week);

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// PUT /api/mealplan  — upsert a single day
router.put('/', async (req, res) => {
  const { week_start, day, meal_id, custom_meal, notes, is_out } = req.body;
  if (!week_start || !day) return res.status(400).json({ error: 'week_start and day required' });

  const { data, error } = await supabase
    .from('meal_plan')
    .upsert({ week_start, day, meal_id, custom_meal, notes, is_out, updated_at: new Date().toISOString() },
             { onConflict: 'week_start,day' })
    .select('*, meal:meal_library(*)');

  if (error) return res.status(500).json({ error: error.message });
  res.json(data[0]);
});

// GET /api/mealplan/library
router.get('/library', async (_req, res) => {
  const { data, error } = await supabase
    .from('meal_library')
    .select('*')
    .order('category');

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// PATCH /api/mealplan/library/:id/rate  — body: { rating: 'liked' | 'disliked' | null }
router.patch('/library/:id/rate', async (req, res) => {
  const { id } = req.params;
  const { rating } = req.body; // 'liked', 'disliked', or null to clear

  const { data, error } = await supabase
    .from('meal_library')
    .update({ user_rating: rating ?? null })
    .eq('id', id)
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// POST /api/mealplan/library  — save a generated meal to the library
router.post('/library', async (req, res) => {
  const meal = req.body;
  const { data, error } = await supabase
    .from('meal_library')
    .insert(meal)
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

export default router;
