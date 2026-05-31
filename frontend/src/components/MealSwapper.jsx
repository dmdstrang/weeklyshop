import { useEffect, useState, useRef } from 'react';
import { fetchAlternatives, searchMeals, generateMeal, saveMealToLibrary } from '../lib/api';

export default function MealSwapper({ day, currentMeal, onSelect, onClose }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [generated, setGenerated] = useState(null);
  const [generateError, setGenerateError] = useState(null);
  const [saving, setSaving] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    async function loadDefaults() {
      setLoading(true);
      try {
        if (currentMeal?.id && currentMeal?.category) {
          const alts = await fetchAlternatives(currentMeal.id, currentMeal.category);
          setResults(alts);
        } else {
          const alts = await searchMeals('', '');
          setResults(alts);
        }
      } finally {
        setLoading(false);
      }
    }
    loadDefaults();
    setTimeout(() => inputRef.current?.focus(), 300);
  }, [currentMeal]);

  useEffect(() => {
    if (!query.trim()) {
      setGenerated(null);
      if (currentMeal?.id && currentMeal?.category) {
        fetchAlternatives(currentMeal.id, currentMeal.category).then(setResults);
      }
      return;
    }
    const timer = setTimeout(async () => {
      setSearching(true);
      setGenerated(null);
      try {
        const found = await searchMeals(query, currentMeal?.id || '');
        setResults(found);
      } finally {
        setSearching(false);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [query, currentMeal]);

  async function handleGenerate() {
    setGenerating(true);
    setGenerateError(null);
    try {
      const res = await generateMeal(query, currentMeal?.category || '');
      if (res.meal) {
        setGenerated(res.meal);
      } else if (res.error) {
        setGenerateError(res.error.includes('ANTHROPIC_API_KEY')
          ? 'Add your Anthropic API key to backend/.env to enable AI generation'
          : res.error);
      }
    } catch (e) {
      setGenerateError('Could not generate recipe — check the backend is running');
    } finally {
      setGenerating(false);
    }
  }

  async function handleUseGenerated() {
    // Use as a one-off without saving
    onSelect(day, { ...generated, id: `generated-${Date.now()}` });
  }

  async function handleSaveAndUse() {
    setSaving(true);
    try {
      const saved = await saveMealToLibrary(generated);
      onSelect(day, saved);
    } finally {
      setSaving(false);
    }
  }

  const showGenerateBtn = query.trim().length > 2 && !loading && !searching;

  return (
    <div className="swapper-overlay" onClick={onClose}>
      <div className="swapper-sheet" onClick={e => e.stopPropagation()}>
        <div className="swapper-handle" />
        <p className="swapper-title">
          {day ? `${day.charAt(0).toUpperCase() + day.slice(1)} — swap meal` : 'Swap meal'}
        </p>

        <div className="swapper-search-wrap">
          <input
            ref={inputRef}
            className="swapper-search"
            type="text"
            placeholder="Search or describe what you fancy…"
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
          {searching && <span className="swapper-search-spinner" />}
        </div>

        {/* Generated recipe card */}
        {generated && (
          <div className="generated-card">
            <div className="generated-card__header">
              <span className="generated-badge">Generated</span>
              <span className="generated-card__category">{generated.category}</span>
            </div>
            <p className="generated-card__name">{generated.name}</p>
            {generated.description && <p className="generated-card__desc">{generated.description}</p>}
            <div className="generated-card__meta">
              {generated.prep_time && <span>Prep {generated.prep_time}</span>}
              {generated.cook_time && <span>Cook {generated.cook_time}</span>}
            </div>
            <div className="generated-card__actions">
              <button className="gen-use-btn" onClick={handleUseGenerated}>
                Use once
              </button>
              <button className="gen-save-btn" onClick={handleSaveAndUse} disabled={saving}>
                {saving ? 'Saving…' : 'Save to library & use'}
              </button>
            </div>
          </div>
        )}

        {/* Generate button */}
        {showGenerateBtn && !generated && (
          <div className="generate-wrap">
            <p className="generate-label">Not finding what you want?</p>
            <button className="generate-btn" onClick={handleGenerate} disabled={generating}>
              {generating
                ? <><span className="generate-spinner" /> Creating recipe…</>
                : `Generate "${query}" with AI`}
            </button>
            {generateError && <p className="generate-error">{generateError}</p>}
          </div>
        )}

        {/* Existing results */}
        {!loading && results.length > 0 && (
          <>
            {query.trim()
              ? <p className="swapper-results-label">From your library</p>
              : currentMeal && <p className="swapper-results-label">Other {currentMeal.category} meals</p>}
            <ul className="swapper-list">
              {results.map(meal => (
                <li key={meal.id} className="swapper-item" onClick={() => onSelect(day, meal)}>
                  <span className="swapper-cat-tag">{meal.category}</span>
                  <div className="swapper-info">
                    <span className="swapper-name">{meal.name}</span>
                    {meal.description && <span className="swapper-desc">{meal.description}</span>}
                  </div>
                  {meal.user_rating === 'liked' && <span className="swapper-liked">♥</span>}
                </li>
              ))}
            </ul>
          </>
        )}

        {loading && <p className="swapper-loading">Loading…</p>}

        <button className="swapper-close" onClick={onClose}>Cancel</button>
      </div>
    </div>
  );
}
