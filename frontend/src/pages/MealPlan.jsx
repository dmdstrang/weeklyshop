import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import {
  fetchMealPlan, fetchSuggestions, upsertMealPlanDay,
  fetchMealLibrary, addShoppingExtra, fetchShoppingList, removeShoppingExtra
} from '../lib/api';
import { getNextMonday, toDateString, DAYS } from '../lib/weeks';
import WeekNav from '../components/WeekNav';
import DayCard from '../components/DayCard';
import MealSwapper from '../components/MealSwapper';
import RecipeModal from '../components/RecipeModal';

export default function MealPlan() {
  const [monday, setMonday] = useState(() => getNextMonday());
  // plan stores { day: meal_plan_row } — we keep meal data ourselves via mealCache
  const [plan, setPlan] = useState({});
  // mealCache: { uuid: meal_library_row } — so realtime updates don't lose meal data
  const [mealCache, setMealCache] = useState({});
  const [loading, setLoading] = useState(true);
  const [suggesting, setSuggesting] = useState(false);
  const [swapper, setSwapper] = useState(null);   // { day }
  const [recipe, setRecipe] = useState(null);      // { meal, day }
  const [extraInput, setExtraInput] = useState('');
  const [extras, setExtras] = useState([]);
  const [addingExtra, setAddingExtra] = useState(false);

  const weekStr = toDateString(monday);

  // Load meal library into cache once
  useEffect(() => {
    fetchMealLibrary().then(meals => {
      const cache = {};
      for (const m of meals) cache[m.id] = m;
      setMealCache(cache);
    });
  }, []);

  // Helper: enrich a plan entry with meal data from cache
  function enrichEntry(entry, cache) {
    if (!entry) return entry;
    const meal = entry.meal_id ? (cache[entry.meal_id] || entry.meal || null) : null;
    return { ...entry, meal };
  }

  const loadPlan = useCallback(async () => {
    setLoading(true);
    try {
      const [entries, shoppingList] = await Promise.all([
        fetchMealPlan(weekStr),
        fetchShoppingList(weekStr),
      ]);
      const map = {};
      for (const e of entries) map[e.day] = e; // meal is already joined from API
      // Seed mealCache from any joined data
      setMealCache(prev => {
        const next = { ...prev };
        for (const e of entries) if (e.meal?.id) next[e.meal.id] = e.meal;
        return next;
      });
      setPlan(map);
      setExtras((shoppingList?.items || []).filter(i => i.isExtra));
    } finally {
      setLoading(false);
    }
  }, [weekStr]);

  useEffect(() => { loadPlan(); }, [loadPlan]);

  // Realtime — enrich with cached meal data so recipe still works
  useEffect(() => {
    const channel = supabase
      .channel(`meal_plan_${weekStr}`)
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'meal_plan',
        filter: `week_start=eq.${weekStr}`
      }, (payload) => {
        const raw = payload.new;
        if (!raw?.day) return;
        setMealCache(cache => {
          const enriched = enrichEntry(raw, cache);
          setPlan(prev => ({ ...prev, [raw.day]: enriched }));
          return cache;
        });
      })
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [weekStr]);

  async function handleSuggestWeek() {
    setSuggesting(true);
    try {
      const busyDays = DAYS.filter(d => plan[d]?.is_out);
      const suggestions = await fetchSuggestions(weekStr, busyDays);
      const updates = await Promise.all(
        DAYS.map(day => {
          const s = suggestions[day];
          if (!s) return null;
          return upsertMealPlanDay({ week_start: weekStr, day, meal_id: s.is_out ? null : s.id, is_out: !!s.is_out });
        })
      );
      const map = { ...plan };
      for (const u of updates) {
        if (u?.day) map[u.day] = enrichEntry(u, mealCache);
      }
      setPlan(map);
    } finally {
      setSuggesting(false);
    }
  }

  async function handleToggleOut(day, isOut) {
    if (!isOut) {
      // Going back to Home — open swapper to pick a meal
      setSwapper({ day });
      return;
    }
    // Going Out — clear meal
    const updated = await upsertMealPlanDay({ week_start: weekStr, day, is_out: true, meal_id: null });
    if (updated?.day) setPlan(prev => ({ ...prev, [day]: enrichEntry(updated, mealCache) }));
  }

  async function handleSwapSelect(day, meal) {
    const updated = await upsertMealPlanDay({ week_start: weekStr, day, meal_id: meal.id, is_out: false });
    if (updated?.day) {
      setMealCache(prev => ({ ...prev, [meal.id]: meal }));
      setPlan(prev => ({ ...prev, [day]: { ...updated, meal } }));
    }
    setSwapper(null);
  }

  async function handleAddExtra(e) {
    e.preventDefault();
    const name = extraInput.trim();
    if (!name) return;
    setAddingExtra(true);
    try {
      const updated = await addShoppingExtra(weekStr, name);
      setExtras((updated?.items || []).filter(i => i.isExtra));
      setExtraInput('');
    } finally {
      setAddingExtra(false);
    }
  }

  async function handleRemoveExtra(name) {
    const updated = await removeShoppingExtra(weekStr, name);
    setExtras((updated?.items || []).filter(i => i.isExtra));
  }

  function prevWeek() { setMonday(m => { const d = new Date(m); d.setDate(d.getDate() - 7); return d; }); }
  function nextWeek() { setMonday(m => { const d = new Date(m); d.setDate(d.getDate() + 7); return d; }); }

  return (
    <div className="page">
      <WeekNav monday={monday} onPrev={prevWeek} onNext={nextWeek} />

      <button className="primary-btn" onClick={handleSuggestWeek} disabled={suggesting}>
        {suggesting ? 'Suggesting…' : 'Suggest meals for this week'}
      </button>

      {loading ? (
        <div className="loading">Loading plan…</div>
      ) : (
        <>
          <div className="day-list">
            {DAYS.map(day => (
              <DayCard
                key={day}
                day={day}
                entry={plan[day]}
                onSwap={d => setSwapper({ day: d })}
                onToggleOut={handleToggleOut}
                onViewRecipe={meal => setRecipe({ meal, day })}
                onImageReady={(mealId, imageUrl) => {
                  setMealCache(prev => prev[mealId] ? { ...prev, [mealId]: { ...prev[mealId], image_url: imageUrl } } : prev);
                  setPlan(prev => {
                    const next = { ...prev };
                    for (const d of DAYS) {
                      if (next[d]?.meal?.id === mealId) next[d] = { ...next[d], meal: { ...next[d].meal, image_url: imageUrl } };
                    }
                    return next;
                  });
                }}
              />
            ))}
          </div>

          {/* Extras section */}
          <div className="extras-section">
            <p className="extras-title">Extras for this week</p>
            <p className="extras-hint">Add anything you need that isn't in the meal plan — milk, yogurt, snacks…</p>

            <form className="extras-form" onSubmit={handleAddExtra}>
              <input
                className="extras-input"
                type="text"
                placeholder="e.g. Oat milk, Greek yogurt…"
                value={extraInput}
                onChange={e => setExtraInput(e.target.value)}
              />
              <button className="extras-add-btn" type="submit" disabled={addingExtra}>
                Add
              </button>
            </form>

            {extras.length > 0 && (
              <ul className="extras-list">
                {extras.map(item => (
                  <li key={item.name} className="extras-item">
                    <span className="extras-item-name">{item.name}</span>
                    <button className="extras-remove" onClick={() => handleRemoveExtra(item.name)}>
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}

      {swapper && (
        <MealSwapper
          day={swapper.day}
          currentMeal={swapper.day ? plan[swapper.day]?.meal : null}
          onSelect={handleSwapSelect}
          onClose={() => setSwapper(null)}
        />
      )}

      {recipe && (
        <RecipeModal
          meal={recipe.meal}
          day={recipe.day}
          onSelect={handleSwapSelect}
          onClose={() => setRecipe(null)}
          onRatingChange={updatedMeal => {
            // Update cache and any day showing this meal
            setMealCache(prev => ({ ...prev, [updatedMeal.id]: updatedMeal }));
            setPlan(prev => {
              const next = { ...prev };
              for (const d of DAYS) {
                if (next[d]?.meal?.id === updatedMeal.id) {
                  next[d] = { ...next[d], meal: updatedMeal };
                }
              }
              return next;
            });
            setRecipe(r => r ? { ...r, meal: updatedMeal } : r);
          }}
        />
      )}
    </div>
  );
}
