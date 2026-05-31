import { Router } from 'express';
import Anthropic from '@anthropic-ai/sdk';
import { supabase } from '../lib/supabase.js';

const router = Router();
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const WEEK_ROTATION = ['salmon', 'rice', 'pasta', 'easy', 'salmon', 'rice', 'pasta'];
const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

// GET /api/suggestions?week=2026-06-01&busyDays=wednesday,friday
router.get('/', async (req, res) => {
  const { week, busyDays = '' } = req.query;
  const busy = busyDays ? busyDays.split(',') : [];

  const { data: meals, error } = await supabase.from('meal_library').select('*');
  if (error) return res.status(500).json({ error: error.message });

  // Never suggest disliked meals
  const available = meals.filter(m => m.user_rating !== 'disliked');

  const threeWeeksAgo = new Date(week);
  threeWeeksAgo.setDate(threeWeeksAgo.getDate() - 21);
  const { data: history } = await supabase
    .from('meal_plan').select('meal_id')
    .gte('week_start', threeWeeksAgo.toISOString().split('T')[0])
    .lt('week_start', week);

  const recentMealIds = new Set((history || []).map(h => h.meal_id).filter(Boolean));

  const byCategory = {};
  for (const meal of available) {
    if (!byCategory[meal.category]) byCategory[meal.category] = [];
    byCategory[meal.category].push(meal);
  }

  const suggestions = {};
  const usedIds = new Set();

  DAYS.forEach((day, i) => {
    if (busy.includes(day)) { suggestions[day] = { is_out: true }; return; }
    const category = WEEK_ROTATION[i];
    const pool = (byCategory[category] || []).filter(m => !usedIds.has(m.id));
    // Prefer liked meals, then fresh (not recent), then anything
    const liked = pool.filter(m => m.user_rating === 'liked' && !recentMealIds.has(m.id));
    const fresh = pool.filter(m => !recentMealIds.has(m.id));
    const candidates = liked.length > 0 ? liked : fresh.length > 0 ? fresh : pool;
    if (candidates.length === 0) { suggestions[day] = null; return; }
    const picked = candidates[Math.floor(Math.random() * candidates.length)];
    usedIds.add(picked.id);
    suggestions[day] = picked;
  });

  res.json(suggestions);
});

// GET /api/suggestions/alternatives?mealId=xxx&category=salmon
router.get('/alternatives', async (req, res) => {
  const { mealId, category } = req.query;
  const { data, error } = await supabase
    .from('meal_library').select('*')
    .eq('category', category).neq('id', mealId)
    .neq('user_rating', 'disliked').limit(6);

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// GET /api/suggestions/search?q=chicken+curry&excludeId=xxx
router.get('/search', async (req, res) => {
  const { q = '', excludeId } = req.query;
  const terms = q.toLowerCase().split(/\s+/).filter(Boolean);

  const { data: meals, error } = await supabase.from('meal_library').select('*');
  if (error) return res.status(500).json({ error: error.message });

  const scored = meals
    .filter(m => m.id !== excludeId && m.user_rating !== 'disliked')
    .map(m => {
      const haystack = [m.name, m.category, m.description || '', ...(m.tags || [])].join(' ').toLowerCase();
      const score = terms.reduce((acc, term) => haystack.includes(term) ? acc + 1 : acc, 0);
      return { ...m, _score: score };
    })
    .filter(m => m._score > 0)
    .sort((a, b) => b._score - a._score)
    .slice(0, 6);

  if (scored.length === 0) {
    const fallback = meals.filter(m => m.id !== excludeId && m.user_rating !== 'disliked').slice(0, 6);
    return res.json(fallback);
  }

  res.json(scored);
});

// POST /api/suggestions/generate  — generate a brand new recipe with Claude
// Body: { query: "thai chicken curry", category: "rice" }
router.post('/generate', async (req, res) => {
  const { query, category } = req.body;

  if (!process.env.ANTHROPIC_API_KEY) {
    return res.status(503).json({ error: 'ANTHROPIC_API_KEY not configured' });
  }

  try {
    const message = await anthropic.messages.create({
      model: 'claude-opus-4-5',
      max_tokens: 1024,
      messages: [{
        role: 'user',
        content: `Generate a recipe for: "${query}"
Category hint: ${category || 'any'}
This is for a family of 2 adults doing a weekly meal plan.

Respond ONLY with a valid JSON object in this exact shape (no markdown, no explanation):
{
  "name": "Recipe name",
  "category": "salmon|rice|pasta|easy",
  "description": "One sentence description",
  "prep_time": "X mins",
  "cook_time": "X mins",
  "serves": 2,
  "ingredients": [
    {"name": "Ingredient", "qty": "amount", "aisle": "produce|meat|fish|dairy|dry goods|frozen|condiments|bakery|spices"}
  ],
  "method": [
    "Step one.",
    "Step two."
  ],
  "tags": ["tag1", "tag2"]
}`
      }]
    });

    const text = message.content[0].text.trim();
    const meal = JSON.parse(text);

    // Basic validation
    if (!meal.name || !meal.ingredients || !meal.method) {
      return res.status(500).json({ error: 'Generated recipe was incomplete' });
    }

    res.json({ meal, generated: true });
  } catch (err) {
    console.error('Generate error:', err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
