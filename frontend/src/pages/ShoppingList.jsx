import { useEffect, useState } from 'react';
import { fetchShoppingList, generateShoppingList, toggleShoppingItem } from '../lib/api';
import { getNextMonday, toDateString } from '../lib/weeks';

const BASE = import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api` : '/api';
const AISLE_ORDER = ['produce', 'meat', 'fish', 'dairy', 'dry goods', 'frozen', 'condiments', 'bakery', 'alcohol', 'spices', 'extras', 'other'];

function groupByAisle(items) {
  const groups = {};
  for (const item of items) {
    const aisle = item.aisle || 'other';
    if (!groups[aisle]) groups[aisle] = [];
    groups[aisle].push(item);
  }
  return groups;
}

export default function ShoppingList({ monday }) {
  const weekStr = toDateString(monday || getNextMonday());
  const [list, setList] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [matching, setMatching] = useState(false);
  const [matchedProducts, setMatchedProducts] = useState(null);
  const [matchError, setMatchError] = useState(null);
  // Track which products the user has tapped to add (persisted per week)
  const [addedUrls, setAddedUrls] = useState(() => {
    try { return new Set(JSON.parse(localStorage.getItem(`added_${weekStr}`) || '[]')); }
    catch { return new Set(); }
  });

  useEffect(() => {
    fetchShoppingList(weekStr).then(data => { setList(data); setLoading(false); });
  }, [weekStr]);

  function markAdded(url) {
    setAddedUrls(prev => {
      const next = new Set(prev);
      next.add(url);
      localStorage.setItem(`added_${weekStr}`, JSON.stringify([...next]));
      return next;
    });
  }

  async function handleGenerate() {
    setGenerating(true);
    const data = await generateShoppingList(weekStr);
    setList(data);
    setMatchedProducts(null);
    setGenerating(false);
  }

  async function handleToggle(item) {
    const updated = await toggleShoppingItem(weekStr, item.name, !item.checked);
    setList(updated);
  }

  async function handleMatch() {
    setMatching(true);
    setMatchError(null);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 35000);
    try {
      const res = await fetch(`${BASE}/pepesto/match?week=${weekStr}`, { method: 'POST', signal: controller.signal });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      if (!data.items || data.items.length === 0) throw new Error('empty');
      setMatchedProducts(data.items);
    } catch (err) {
      setMatchError(err.name === 'AbortError' || err.message === 'empty'
        ? 'Couldn\'t auto-match products (Sainsbury\'s data service may be busy). Use search links instead:'
        : err.message);
    } finally {
      clearTimeout(timeout);
      setMatching(false);
    }
  }

  // Fallback: build tap-to-add rows using Sainsbury's own search (no Pepesto needed)
  function useSearchFallback() {
    const searchRows = items
      .filter(i => !i.checked)
      .map(i => ({
        item_name: i.name,
        products: [{
          product: {
            product_name: `Search "${i.name}" on Sainsbury's`,
            product_id: `https://www.sainsburys.co.uk/gol-ui/SearchResults/${encodeURIComponent(i.name)}`,
          }
        }],
      }));
    setMatchedProducts(searchRows);
    setMatchError(null);
  }

  if (loading) return <div className="page"><div className="loading">Loading…</div></div>;

  const items = list?.items || [];
  const groups = groupByAisle(items);
  const aisles = [...new Set([...AISLE_ORDER, ...Object.keys(groups)])].filter(a => groups[a]);
  const uncheckedCount = items.filter(i => !i.checked).length;

  // Matched product helpers
  const matchedRows = (matchedProducts || [])
    .map(item => {
      const best = item.products?.[0]?.product;
      if (!best?.product_id) return null;
      return {
        ingredient: item.item_name,
        name: best.product_name,
        url: best.product_id,
        image: best.pepesto_hosted_image_url || best.image_url,
        pricePence: best.price?.price,
        promo: best.price?.promotion?.promo,
      };
    })
    .filter(Boolean);

  const addedCount = matchedRows.filter(r => addedUrls.has(r.url)).length;
  const total = matchedRows.reduce((s, r) => s + (r.pricePence || 0), 0);

  return (
    <div className="page">
      <h2 className="page-title">Shopping List</h2>
      <p className="page-subtitle">{items.length > 0 ? `${uncheckedCount} items remaining` : 'Generated from your meal plan'}</p>

      <button className="secondary-btn" onClick={handleGenerate} disabled={generating}>
        {generating ? 'Regenerating…' : 'Regenerate from meal plan'}
      </button>

      {items.length === 0 ? (
        <p className="empty-msg">No items yet — generate the list from your meal plan first.</p>
      ) : !matchedProducts ? (
        <>
          {aisles.map(aisle => (
            <div key={aisle} className="aisle-group">
              <h3 className="aisle-title">{aisle === 'extras' ? 'Extras' : aisle.charAt(0).toUpperCase() + aisle.slice(1)}</h3>
              <ul className="item-list">
                {groups[aisle].map(item => (
                  <li key={item.name} className={`item ${item.checked ? 'item--checked' : ''}`}
                      onClick={() => handleToggle(item)}>
                    <span className="item-check" />
                    <span className="item-name">{item.name}</span>
                    <span className="item-qty">{item.qty}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {matchError && (
            <div className="match-fallback">
              <p className="error-msg" style={{marginBottom: matchError.includes('search links') ? 10 : 0}}>{matchError}</p>
              {matchError.includes('search links') && (
                <button className="sainsburys-btn sainsburys-btn--preview" onClick={useSearchFallback}>
                  Use Sainsbury's search links
                </button>
              )}
            </div>
          )}

          <div className="checkout-section">
            <button className="sainsburys-btn" onClick={handleMatch} disabled={matching}>
              {matching ? 'Finding products on Sainsbury\'s…' : 'Find products on Sainsbury\'s'}
            </button>
          </div>
        </>
      ) : (
        // ── Matched products: tap-to-add checklist ──
        <>
          <div className="match-header">
            <button className="back-link" onClick={() => setMatchedProducts(null)}>‹ Back to list</button>
            <span className="match-progress">{addedCount} / {matchedRows.length} added</span>
          </div>
          <p className="match-instructions">
            Tap <strong>Add</strong> on each item — it opens the Sainsbury's product page where you're logged in. Tap "Add to trolley" there, then come back.
          </p>

          <ul className="product-list">
            {matchedRows.map((r, i) => {
              const isAdded = addedUrls.has(r.url);
              return (
                <li key={i} className={`product-row ${isAdded ? 'product-row--added' : ''}`}>
                  {r.image && <img src={r.image} alt="" className="product-img" />}
                  <div className="product-info">
                    <span className="product-ingredient">{r.ingredient}</span>
                    <span className="product-name">{r.name}</span>
                    {r.pricePence && (
                      <span className={`product-price ${r.promo ? 'product-price--promo' : ''}`}>
                        £{(r.pricePence / 100).toFixed(2)}{r.promo ? ' · offer' : ''}
                      </span>
                    )}
                  </div>
                  <a href={r.url} target="_blank" rel="noreferrer"
                     className={`product-add-btn ${isAdded ? 'product-add-btn--added' : ''}`}
                     onClick={() => markAdded(r.url)}>
                    {isAdded ? 'Added ✓' : 'Add'}
                  </a>
                </li>
              );
            })}
          </ul>

          <div className="match-total">Estimated total: £{(total / 100).toFixed(2)}</div>

          <a href="https://www.sainsburys.co.uk/shop/gb/groceries/get-ideas/your-groceries"
             target="_blank" rel="noreferrer" className="sainsburys-btn" style={{display:'block', textAlign:'center', textDecoration:'none', marginTop:8}}>
            Open my Sainsbury's basket →
          </a>
        </>
      )}
    </div>
  );
}
