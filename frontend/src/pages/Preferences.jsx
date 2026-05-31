import { useState, useEffect, useRef } from 'react';
import { fetchMealLibrary, rateMeal, saveMealToLibrary, generateMeal } from '../lib/api';
import { supabase } from '../lib/supabase';
import BottomSheet from '../components/BottomSheet';

export default function Preferences() {
  const [meals, setMeals] = useState([]);
  const [notes, setNotes] = useState(() => localStorage.getItem('meal_notes') || '');
  const [saved, setSaved] = useState(false);
  const [showFavPicker, setShowFavPicker] = useState(false);
  const [showAddMeal, setShowAddMeal] = useState(false);

  useEffect(() => { fetchMealLibrary().then(setMeals); }, []);

  const favourites = meals.filter(m => m.user_rating === 'liked');
  const disliked = meals.filter(m => m.user_rating === 'disliked');

  async function handleRate(id, rating) {
    const updated = await rateMeal(id, rating);
    setMeals(prev => prev.map(m => m.id === id ? updated : m));
  }

  function saveNotes() {
    localStorage.setItem('meal_notes', notes);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="page">
      <h2 className="page-title">Preferences</h2>
      <p className="page-subtitle">Manage your favourites and meal notes</p>

      {/* Favourites */}
      <div className="prefs-section">
        <p className="prefs-section-title">Favourite meals</p>
        <p className="prefs-hint">Favourites are suggested more often when planning your week.</p>

        {favourites.length > 0 ? (
          <ul className="pref-meal-list">
            {favourites.map(m => (
              <li key={m.id} className="pref-meal-item">
                <div className="pref-meal-info">
                  <span className="pref-meal-name">{m.name}</span>
                  <span className="pref-meal-cat">{m.category}</span>
                </div>
                <button className="pref-meal-remove" onClick={() => handleRate(m.id, null)}>
                  Remove
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="prefs-hint" style={{marginBottom:10}}>No favourites yet.</p>
        )}

        <button className="secondary-btn" style={{marginTop:10}} onClick={() => setShowFavPicker(true)}>
          + Add favourite
        </button>
      </div>

      <div className="divider" />

      {/* Disliked */}
      {disliked.length > 0 && (
        <>
          <div className="prefs-section">
            <p className="prefs-section-title">Hidden meals</p>
            <p className="prefs-hint">These meals won't be suggested. Tap to restore.</p>
            <ul className="pref-meal-list">
              {disliked.map(m => (
                <li key={m.id} className="pref-meal-item pref-meal-item--disliked">
                  <div className="pref-meal-info">
                    <span className="pref-meal-name">{m.name}</span>
                    <span className="pref-meal-cat">{m.category}</span>
                  </div>
                  <button className="pref-meal-remove" onClick={() => handleRate(m.id, null)}>
                    Restore
                  </button>
                </li>
              ))}
            </ul>
          </div>
          <div className="divider" />
        </>
      )}

      {/* Notes */}
      <div className="prefs-section">
        <p className="prefs-section-title">Meal notes</p>
        <textarea
          className="prefs-textarea"
          placeholder="e.g. We prefer salmon twice a week. No beef. Like spicy food. Avoid aubergine…"
          value={notes}
          onChange={e => setNotes(e.target.value)}
        />
        <p className="prefs-hint">Used to improve AI suggestions.</p>
        <button className="primary-btn" style={{marginTop:10}} onClick={saveNotes}>
          {saved ? 'Saved' : 'Save notes'}
        </button>
      </div>

      <div className="divider" />

      {/* Add custom meal */}
      <div className="prefs-section">
        <p className="prefs-section-title">Add a meal</p>
        <p className="prefs-hint">Add your own meal to the library manually or generate one with AI.</p>
        <button className="secondary-btn" style={{marginTop:10}} onClick={() => setShowAddMeal(true)}>
          + Add a meal
        </button>
      </div>

      {showFavPicker && (
        <FavPicker
          meals={meals}
          onRate={handleRate}
          onClose={() => setShowFavPicker(false)}
        />
      )}

      {showAddMeal && (
        <AddMealSheet
          onSaved={meal => { setMeals(prev => [...prev, meal]); setShowAddMeal(false); }}
          onClose={() => setShowAddMeal(false)}
        />
      )}
    </div>
  );
}

/* ── Favourite picker sheet ── */
function FavPicker({ meals, onRate, onClose }) {
  const [query, setQuery] = useState('');
  const inputRef = useRef(null);
  useEffect(() => setTimeout(() => inputRef.current?.focus(), 300), []);

  const nonFav = meals.filter(m => m.user_rating !== 'liked');
  const filtered = query.trim()
    ? nonFav.filter(m => m.name.toLowerCase().includes(query.toLowerCase()) || m.category.toLowerCase().includes(query.toLowerCase()))
    : nonFav;

  return (
    <BottomSheet onClose={onClose}>
      <div className="swapper-inner">
        <p className="swapper-title">Add favourite</p>
        <div className="swapper-search-wrap">
          <input ref={inputRef} className="swapper-search" type="text"
            placeholder="Search meals…" value={query} onChange={e => setQuery(e.target.value)} />
        </div>
        <div className="swapper-scroll">
          <ul className="swapper-list">
            {filtered.map(m => (
              <li key={m.id} className="swapper-item" onClick={() => { onRate(m.id, 'liked'); onClose(); }}>
                <span className="swapper-cat-tag">{m.category}</span>
                <div className="swapper-info">
                  <span className="swapper-name">{m.name}</span>
                  {m.description && <span className="swapper-desc">{m.description}</span>}
                </div>
              </li>
            ))}
            {filtered.length === 0 && <li className="swapper-empty">No meals match</li>}
          </ul>
        </div>
        <button className="swapper-close" onClick={onClose}>Cancel</button>
      </div>
    </BottomSheet>
  );
}

/* ── Add meal sheet ── */
function AddMealSheet({ onSaved, onClose }) {
  const [mode, setMode] = useState('choose'); // 'choose' | 'manual' | 'ai'
  const [name, setName] = useState('');
  const [category, setCategory] = useState('pasta');
  const [ingredients, setIngredients] = useState('');
  const [method, setMethod] = useState('');
  const [aiQuery, setAiQuery] = useState('');
  const [aiResult, setAiResult] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [generateError, setGenerateError] = useState(null);
  const [saving, setSaving] = useState(false);

  async function handleGenerate() {
    setGenerating(true);
    setGenerateError(null);
    try {
      const res = await generateMeal(aiQuery, category);
      if (res.meal) setAiResult(res.meal);
      else setGenerateError(res.error?.includes('ANTHROPIC_API_KEY')
        ? 'Add your Anthropic API key to backend/.env'
        : res.error || 'Generation failed');
    } catch { setGenerateError('Could not reach backend'); }
    finally { setGenerating(false); }
  }

  async function handleSaveAi() {
    setSaving(true);
    try {
      const saved = await saveMealToLibrary(aiResult);
      onSaved(saved);
    } finally { setSaving(false); }
  }

  async function handleSaveManual(e) {
    e.preventDefault();
    setSaving(true);
    try {
      const parsedIngredients = ingredients.split('\n').filter(Boolean).map(line => {
        const [n, q] = line.split(' — ');
        return { name: n?.trim(), qty: q?.trim() || '', aisle: 'other' };
      });
      const parsedMethod = method.split('\n').filter(Boolean).map(s => s.replace(/^\d+\.\s*/, '').trim());
      const { data, error } = await supabase.from('meal_library').insert({
        name, category, ingredients: parsedIngredients, method: parsedMethod,
        description: '', serves: 3, prep_time: '', cook_time: '',
      }).select().single();
      if (!error) onSaved(data);
    } finally { setSaving(false); }
  }

  return (
    <BottomSheet onClose={onClose}>
      <div className="swapper-inner">
        <p className="swapper-title">Add a meal</p>

        {mode === 'choose' && (
          <div style={{padding:'8px 16px 16px', display:'flex', flexDirection:'column', gap:10}}>
            <button className="add-mode-btn" onClick={() => setMode('ai')}>
              <span className="add-mode-title">Generate with AI</span>
              <span className="add-mode-desc">Describe a meal and Claude will write the full recipe</span>
            </button>
            <button className="add-mode-btn" onClick={() => setMode('manual')}>
              <span className="add-mode-title">Add manually</span>
              <span className="add-mode-desc">Type in the name, ingredients and method yourself</span>
            </button>
            <button className="swapper-close" style={{margin:0, width:'100%'}} onClick={onClose}>Cancel</button>
          </div>
        )}

        {mode === 'ai' && (
          <div style={{padding:'8px 16px 16px', display:'flex', flexDirection:'column', gap:12}}>
            {!aiResult ? (
              <>
                <input
                  style={{padding:'11px 14px', borderRadius:10, border:'1px solid var(--border)', fontSize:14, fontFamily:'inherit', outline:'none'}}
                  placeholder="e.g. sausages and chips, beef tacos, chicken pie…"
                  value={aiQuery}
                  onChange={e => setAiQuery(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleGenerate()}
                  autoFocus
                />
                <select
                  style={{padding:'11px 14px', borderRadius:10, border:'1px solid var(--border)', fontSize:14, fontFamily:'inherit', background:'var(--card)', outline:'none'}}
                  value={category} onChange={e => setCategory(e.target.value)}
                >
                  <option value="salmon">Salmon</option>
                  <option value="rice">Rice</option>
                  <option value="pasta">Pasta</option>
                  <option value="easy">Easy</option>
                  <option value="other">Other</option>
                </select>
                <button className="primary-btn" style={{marginBottom:0}} onClick={handleGenerate} disabled={generating || !aiQuery.trim()}>
                  {generating ? <><span className="generate-spinner" style={{borderColor:'rgba(255,255,255,0.3)', borderTopColor:'white'}} /> Generating…</> : 'Generate recipe'}
                </button>
                {generateError && <p style={{fontSize:13, color:'#dc2626'}}>{generateError}</p>}
                <button className="swapper-close" style={{margin:0, width:'100%'}} onClick={() => setMode('choose')}>Back</button>
              </>
            ) : (
              <>
                <div className="generated-card" style={{margin:0}}>
                  <div className="generated-card__header">
                    <span className="generated-badge">Generated</span>
                    <span className="generated-card__category">{aiResult.category}</span>
                  </div>
                  <p className="generated-card__name">{aiResult.name}</p>
                  {aiResult.description && <p className="generated-card__desc">{aiResult.description}</p>}
                  <div className="generated-card__meta">
                    {aiResult.prep_time && <span>Prep {aiResult.prep_time}</span>}
                    {aiResult.cook_time && <span>Cook {aiResult.cook_time}</span>}
                    <span>{aiResult.ingredients?.length || 0} ingredients</span>
                    <span>{aiResult.method?.length || 0} steps</span>
                  </div>
                </div>
                <button className="primary-btn" style={{marginBottom:0}} onClick={handleSaveAi} disabled={saving}>
                  {saving ? 'Saving…' : 'Save to library'}
                </button>
                <button className="swapper-close" style={{margin:0, width:'100%'}} onClick={() => setAiResult(null)}>Try again</button>
              </>
            )}
          </div>
        )}

        {mode === 'manual' && (
          <form onSubmit={handleSaveManual} style={{padding:'8px 16px 16px', display:'flex', flexDirection:'column', gap:10}}>
            <input
              style={{padding:'11px 14px', borderRadius:10, border:'1px solid var(--border)', fontSize:14, fontFamily:'inherit', outline:'none'}}
              placeholder="Meal name"
              value={name} onChange={e => setName(e.target.value)} required autoFocus
            />
            <select
              style={{padding:'11px 14px', borderRadius:10, border:'1px solid var(--border)', fontSize:14, fontFamily:'inherit', background:'var(--card)', outline:'none'}}
              value={category} onChange={e => setCategory(e.target.value)}
            >
              <option value="salmon">Salmon</option>
              <option value="rice">Rice</option>
              <option value="pasta">Pasta</option>
              <option value="easy">Easy</option>
              <option value="other">Other</option>
            </select>
            <textarea className="prefs-textarea" style={{minHeight:80}}
              placeholder={"Ingredients, one per line:\nSalmon fillets — 2\nNew potatoes — 500g"}
              value={ingredients} onChange={e => setIngredients(e.target.value)} />
            <textarea className="prefs-textarea" style={{minHeight:100}}
              placeholder={"Method, one step per line:\n1. Preheat oven to 200C\n2. Season the salmon…"}
              value={method} onChange={e => setMethod(e.target.value)} />
            <button className="primary-btn" type="submit" disabled={saving} style={{marginBottom:0}}>
              {saving ? 'Saving…' : 'Save meal'}
            </button>
            <button type="button" className="swapper-close" style={{margin:0, width:'100%'}} onClick={() => setMode('choose')}>Back</button>
          </form>
        )}
      </div>
    </BottomSheet>
  );
}

