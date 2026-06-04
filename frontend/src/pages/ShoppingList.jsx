import { useEffect, useState } from 'react';
import { fetchShoppingList, generateShoppingList, toggleShoppingItem } from '../lib/api';
import { getNextMonday, toDateString } from '../lib/weeks';
import BottomSheet from '../components/BottomSheet';

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
  const [checkoutState, setCheckoutState] = useState(null); // null | 'creds' | 'running' | { done } | { error }
  const [progress, setProgress] = useState([]);
  const [creds, setCreds] = useState(() => {
    try { return JSON.parse(localStorage.getItem('sainsburys_creds') || '{}'); } catch { return {}; }
  });

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

  async function handleMatch() {
    setMatching(true);
    setMatchedProducts(null);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 35000);
    try {
      const res = await fetch(`${BASE}/pepesto/match?week=${weekStr}`, {
        method: 'POST', signal: controller.signal
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setMatchedProducts(data);
    } catch (err) {
      setCheckoutState({ error: err.name === 'AbortError' ? 'Timed out — try again' : err.message });
    } finally {
      clearTimeout(timeout);
      setMatching(false);
    }
  }

  function handleSendClick() {
    if (!creds.email || !creds.password) {
      setCheckoutState('creds');
    } else {
      runCheckout(creds.email, creds.password);
    }
  }

  function handleSaveCreds(e) {
    e.preventDefault();
    localStorage.setItem('sainsburys_creds', JSON.stringify(creds));
    setCheckoutState(null);
    runCheckout(creds.email, creds.password);
  }

  async function runCheckout(email, password) {
    setCheckoutState('running');
    setProgress([]);

    try {
      const res = await fetch(`${BASE}/pepesto/checkout?week=${weekStr}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let added = [], failed = [];

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        for (const line of chunk.split('\n')) {
          if (!line.startsWith('data: ')) continue;
          try {
            const evt = JSON.parse(line.slice(6));
            if (evt.type === 'item_done') {
              setProgress(p => [...p, evt]);
            }
            if (evt.type === 'progress') {
              setProgress(p => [...p, { type: 'progress', step: evt.step }]);
            }
            if (evt.type === 'done') {
              added = evt.added; failed = evt.failed;
              setCheckoutState({ added, failed });
            }
            if (evt.type === 'error') {
              setCheckoutState({ error: evt.message });
            }
          } catch {}
        }
      }
    } catch (err) {
      setCheckoutState({ error: err.message });
    }
  }

  if (loading) return <div className="page"><div className="loading">Loading…</div></div>;

  const items = list?.items || [];
  const groups = groupByAisle(items);
  const aisles = [...new Set([...AISLE_ORDER, ...Object.keys(groups)])].filter(a => groups[a]);
  const uncheckedCount = items.filter(i => !i.checked).length;
  const isRunning = checkoutState === 'running';

  return (
    <div className="page">
      <h2 className="page-title">Shopping List</h2>
      <p className="page-subtitle">{items.length > 0 ? `${uncheckedCount} items remaining` : 'Generated from your meal plan'}</p>

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

          {/* Matched products preview */}
          {matchedProducts && (
            <div className="matched-products">
              <p className="matched-title">Matched on Sainsbury's</p>
              <ul className="matched-list">
                {(matchedProducts.items || []).map((item, i) => {
                  const best = item.products?.[0]?.product;
                  if (!best) return null;
                  const pricePence = best.price?.price;
                  const promo = best.price?.promotion?.promo;
                  return (
                    <li key={i} className="matched-item">
                      <div className="matched-item-info">
                        <span className="matched-ingredient">{item.item_name}</span>
                        <span className="matched-name">{best.product_name}</span>
                      </div>
                      <div className="matched-right">
                        {pricePence && (
                          <span className={`matched-price ${promo ? 'matched-price--promo' : ''}`}>
                            £{(pricePence / 100).toFixed(2)}
                          </span>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
              {matchedProducts.items?.length > 0 && (
                <p className="matched-total">
                  Est. total: £{(matchedProducts.items.reduce((sum, item) => {
                    return sum + (item.products?.[0]?.product?.price?.price || 0);
                  }, 0) / 100).toFixed(2)}
                </p>
              )}
            </div>
          )}

          {/* Progress log while running */}
          {isRunning && (
            <div className="progress-log">
              {progress.map((p, i) => (
                <div key={i} className={`progress-item ${p.type === 'item_done' ? (p.success ? 'success' : 'fail') : ''}`}>
                  {p.type === 'progress' && <span>{p.step}</span>}
                  {p.type === 'item_done' && <span>{p.success ? '✓' : '✗'} {p.item}{p.success && p.product ? ` → ${p.product}` : ''}</span>}
                </div>
              ))}
              <div className="progress-item">Adding items…</div>
            </div>
          )}

          {/* Result */}
          {checkoutState?.added && (
            <div className="send-result">
              <p>Added {checkoutState.added.length} items to your Sainsbury's basket.</p>
              {checkoutState.failed?.length > 0 && (
                <p style={{marginTop:6, color:'#dc2626'}}>
                  Couldn't add: {checkoutState.failed.map(f => f.item).join(', ')}
                </p>
              )}
              <a href="https://www.sainsburys.co.uk/shop/gb/groceries/get-ideas/your-groceries"
                 target="_blank" rel="noreferrer" className="checkout-link">
                View basket on Sainsbury's →
              </a>
            </div>
          )}

          {checkoutState?.error && <p className="error-msg">{checkoutState.error}</p>}

          {/* Action buttons */}
          <div className="checkout-section">
            {!matchedProducts && (
              <button className="sainsburys-btn sainsburys-btn--preview" onClick={handleMatch} disabled={matching}>
                {matching ? 'Finding products…' : 'Preview on Sainsbury\'s'}
              </button>
            )}
            <button className="sainsburys-btn" onClick={handleSendClick} disabled={isRunning}>
              {isRunning ? 'Adding to basket…' : 'Send to Sainsbury\'s basket'}
            </button>
          </div>
        </>
      )}

      {/* Credentials sheet */}
      {checkoutState === 'creds' && (
        <BottomSheet onClose={() => setCheckoutState(null)}>
          <div className="swapper-inner">
            <p className="swapper-title">Sainsbury's login</p>
            <p className="creds-note" style={{padding:'0 16px 12px'}}>Stored on this device only — never sent to any server except Sainsbury's</p>
            <form onSubmit={handleSaveCreds} className="creds-form" style={{padding:'0 16px'}}>
              <input type="email" placeholder="Email" value={creds.email || ''}
                onChange={e => setCreds(c => ({ ...c, email: e.target.value }))} required />
              <input type="password" placeholder="Password" value={creds.password || ''}
                onChange={e => setCreds(c => ({ ...c, password: e.target.value }))} required />
              <button type="submit" className="primary-btn" style={{marginBottom:0}}>Save & add to basket</button>
            </form>
            <button className="swapper-close" onClick={() => setCheckoutState(null)}>Cancel</button>
          </div>
        </BottomSheet>
      )}
    </div>
  );
}
