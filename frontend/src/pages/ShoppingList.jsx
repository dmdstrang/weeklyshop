import { useEffect, useState } from 'react';
import { fetchShoppingList, generateShoppingList, toggleShoppingItem } from '../lib/api';
import { getNextMonday, toDateString } from '../lib/weeks';

const AISLE_ORDER = ['produce', 'meat', 'fish', 'dairy', 'dry goods', 'frozen', 'condiments', 'bakery', 'alcohol', 'spices'];

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
  const [sendStatus, setSendStatus] = useState(null); // null | 'sending' | { added, failed }
  const [progress, setProgress] = useState([]);
  const [creds, setCreds] = useState(() => {
    try { return JSON.parse(localStorage.getItem('sainsburys_creds') || '{}'); } catch { return {}; }
  });
  const [showCreds, setShowCreds] = useState(false);

  useEffect(() => {
    fetchShoppingList(weekStr).then(data => { setList(data); setLoading(false); });
  }, [weekStr]);

  async function handleGenerate() {
    setGenerating(true);
    const data = await generateShoppingList(weekStr);
    setList(data);
    setGenerating(false);
  }

  async function handleToggle(item) {
    const updated = await toggleShoppingItem(weekStr, item.name, !item.checked);
    setList(updated);
  }

  async function handleSendToSainsburys() {
    if (!creds.email || !creds.password) { setShowCreds(true); return; }

    setSendStatus('sending');
    setProgress([]);

    const res = await fetch('/api/sainsburys/add-to-basket', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ week: weekStr, email: creds.email, password: creds.password }),
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
            if (evt.success) added.push(evt.item);
            else failed.push(evt);
          }
          if (evt.type === 'done') { added = evt.added; failed = evt.failed; }
          if (evt.type === 'error') { setSendStatus({ error: evt.message }); return; }
        } catch {}
      }
    }

    setSendStatus({ added, failed });
  }

  function saveCreds(e) {
    e.preventDefault();
    localStorage.setItem('sainsburys_creds', JSON.stringify(creds));
    setShowCreds(false);
    handleSendToSainsburys();
  }

  if (loading) return <div className="page"><div className="loading">Loading…</div></div>;

  const items = list?.items || [];
  const groups = groupByAisle(items);
  const aisles = [...new Set([...AISLE_ORDER, ...Object.keys(groups)])].filter(a => groups[a]);

  return (
    <div className="page">
      <h2 className="page-title">Shopping List</h2>
      <p className="page-subtitle">Generated from this week&apos;s meal plan</p>

      <button className="secondary-btn" onClick={handleGenerate} disabled={generating}>
        {generating ? 'Regenerating…' : 'Regenerate from meal plan'}
      </button>

      {items.length === 0 ? (
        <p className="empty-msg">No items yet — generate the list from your meal plan first.</p>
      ) : (
        <>
          {aisles.map(aisle => (
            <div key={aisle} className="aisle-group">
              <h3 className="aisle-title">{aisle.charAt(0).toUpperCase() + aisle.slice(1)}</h3>
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

          <button className="sainsburys-btn" onClick={handleSendToSainsburys}
                  disabled={sendStatus === 'sending'}>
            {sendStatus === 'sending' ? 'Adding to basket…' : "Add to Sainsbury's basket"}
          </button>

          {sendStatus === 'sending' && progress.length > 0 && (
            <div className="progress-log">
              {progress.map((p, i) => (
                <div key={i} className={`progress-item ${p.success ? 'success' : 'fail'}`}>
                  {p.success ? '✅' : '❌'} {p.item}
                </div>
              ))}
            </div>
          )}

          {sendStatus?.added && (
            <div className="send-result">
              <p>✅ Added {sendStatus.added.length} items</p>
              {sendStatus.failed?.length > 0 && (
                <p>❌ Couldn't find: {sendStatus.failed.map(f => f.item).join(', ')}</p>
              )}
            </div>
          )}

          {sendStatus?.error && <p className="error-msg">❌ {sendStatus.error}</p>}
        </>
      )}

      {/* Credentials modal */}
      {showCreds && (
        <div className="swapper-overlay" onClick={() => setShowCreds(false)}>
          <div className="swapper-sheet" onClick={e => e.stopPropagation()}>
            <div className="swapper-handle" />
            <h3 className="swapper-title">Sainsbury's login</h3>
            <p className="creds-note">Stored locally on this device only</p>
            <form onSubmit={saveCreds} className="creds-form">
              <input type="email" placeholder="Email" value={creds.email || ''}
                     onChange={e => setCreds(c => ({ ...c, email: e.target.value }))} required />
              <input type="password" placeholder="Password" value={creds.password || ''}
                     onChange={e => setCreds(c => ({ ...c, password: e.target.value }))} required />
              <button type="submit" className="suggest-btn">Save & continue</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
