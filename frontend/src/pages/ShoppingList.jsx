import { useEffect, useState } from 'react';
import { fetchShoppingList, generateShoppingList, toggleShoppingItem } from '../lib/api';
import { getNextMonday, toDateString } from '../lib/weeks';

const AISLE_ORDER = ['produce', 'meat', 'fish', 'dairy', 'dry goods', 'frozen', 'condiments', 'bakery', 'alcohol', 'spices', 'extras', 'other'];

function searchUrl(name) {
  return `https://www.sainsburys.co.uk/gol-ui/SearchResults/${encodeURIComponent(name)}`;
}

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

  useEffect(() => {
    fetchShoppingList(weekStr).then(data => { setList(data); setLoading(false); });
  }, [weekStr]);

  async function handleGenerate() {
    setGenerating(true);
    const data = await generateShoppingList(weekStr);
    setList(data);
    setGenerating(false);
  }

  async function setChecked(item, checked) {
    const updated = await toggleShoppingItem(weekStr, item.name, checked);
    setList(updated);
  }

  // Open Sainsbury's search and tick the item off
  function handleAddToSainsburys(item) {
    window.open(searchUrl(item.name), '_blank');
    if (!item.checked) setChecked(item, true);
  }

  if (loading) return <div className="page"><div className="loading">Loading…</div></div>;

  const items = list?.items || [];
  const groups = groupByAisle(items);
  const aisles = [...new Set([...AISLE_ORDER, ...Object.keys(groups)])].filter(a => groups[a]);
  const remaining = items.filter(i => !i.checked).length;

  return (
    <div className="page">
      <h2 className="page-title">Shopping List</h2>
      <p className="page-subtitle">
        {items.length > 0 ? `${remaining} of ${items.length} to add` : 'Generated from your meal plan'}
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
                  <li key={item.name} className={`shop-item ${item.checked ? 'shop-item--checked' : ''}`}>
                    <button
                      className="shop-check"
                      onClick={() => setChecked(item, !item.checked)}
                      aria-label={item.checked ? 'Mark not done' : 'Mark done'}
                    />
                    <div className="shop-item-text" onClick={() => setChecked(item, !item.checked)}>
                      <span className="shop-item-name">{item.name}</span>
                      {item.qty && <span className="shop-item-qty">{item.qty}</span>}
                    </div>
                    <button className="shop-add-btn" onClick={() => handleAddToSainsburys(item)}>
                      {item.checked ? 'Search' : 'Add'}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <a href="https://www.sainsburys.co.uk/gol-ui/trolley" target="_blank" rel="noreferrer"
             className="sainsburys-btn" style={{display:'block', textAlign:'center', textDecoration:'none', marginTop:16}}>
            Open my Sainsbury's trolley →
          </a>
        </>
      )}
    </div>
  );
}
