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
  const [checkoutStatus, setCheckoutStatus] = useState(null); // null | 'loading' | { url } | { error }
  const [matching, setMatching] = useState(false);
  const [matchedProducts, setMatchedProducts] = useState(null);

  useEffect(() => {
    fetchShoppingList(weekStr).then(data => { setList(data); setLoading(false); });
  }, [weekStr]);

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

  // Step 1: match items to Sainsbury's products + show prices
  async function handleMatch() {
    setMatching(true);
    setMatchedProducts(null);
    try {
      const res = await fetch(`${BASE}/pepesto/match?week=${weekStr}`, { method: 'POST' });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setMatchedProducts(data);
    } catch (err) {
      setCheckoutStatus({ error: err.message });
    } finally {
      setMatching(false);
    }
  }

  // Step 2: get checkout URL via Pepesto oneshot
  async function handleCheckout() {
    setCheckoutStatus('loading');
    try {
      const res = await fetch(`${BASE}/pepesto/checkout?week=${weekStr}`, { method: 'POST' });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      // Open the checkout URL
      const url = data.redirect_url || data.checkout_url || data.url;
      if (url) {
        setCheckoutStatus({ url });
        window.open(url, '_blank');
      } else {
        setCheckoutStatus({ error: `No checkout URL returned. Response: ${JSON.stringify(data)}` });
      }
    } catch (err) {
      setCheckoutStatus({ error: err.message });
    }
  }

  if (loading) return <div className="page"><div className="loading">Loading…</div></div>;

  const items = list?.items || [];
  const mealItems = items.filter(i => !i.isExtra);
  const extraItems = items.filter(i => i.isExtra);
  const groups = groupByAisle(items);
  const aisles = [...new Set([...AISLE_ORDER, ...Object.keys(groups)])].filter(a => groups[a]);
  const uncheckedCount = items.filter(i => !i.checked).length;

  return (
    <div className="page">
      <h2 className="page-title">Shopping List</h2>
      <p className="page-subtitle">
        {items.length > 0 ? `${uncheckedCount} items remaining` : 'Generated from your meal plan'}
      </p>

      <button className="secondary-btn" onClick={handleGenerate} disabled={generating}>
        {generating ? 'Regenerating…' : 'Regenerate from meal plan'}
      </button>

      {items.length === 0 ? (
        <p className="empty-msg">No items yet — generate the list from your meal plan first.</p>
      ) : (
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

          {/* Pepesto matched products preview */}
          {matchedProducts && (
            <div className="matched-products">
              <p className="matched-title">Matched on Sainsbury's</p>
              <ul className="matched-list">
                {(matchedProducts.items || matchedProducts.products || []).map((p, i) => (
                  <li key={i} className="matched-item">
                    <span className="matched-name">{p.name || p.product_name}</span>
                    {p.price && <span className="matched-price">£{Number(p.price).toFixed(2)}</span>}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Sainsbury's checkout buttons */}
          <div className="checkout-section">
            {!matchedProducts && (
              <button className="sainsburys-btn sainsburys-btn--preview"
                      onClick={handleMatch} disabled={matching}>
                {matching ? 'Finding products…' : 'Preview on Sainsbury\'s'}
              </button>
            )}
            <button className="sainsburys-btn" onClick={handleCheckout}
                    disabled={checkoutStatus === 'loading'}>
              {checkoutStatus === 'loading' ? 'Opening Sainsbury\'s…' : 'Send to Sainsbury\'s basket'}
            </button>
          </div>

          {checkoutStatus?.url && (
            <div className="send-result">
              <p>Your basket is ready. Tap below to open it — you'll land on the checkout page, then proceed to Sainsbury's.</p>
              <a href={checkoutStatus.url} target="_blank" rel="noreferrer" className="checkout-link">
                Open basket →
              </a>
            </div>
          )}

          {checkoutStatus?.error && (
            <p className="error-msg">{checkoutStatus.error}</p>
          )}
        </>
      )}
    </div>
  );
}
