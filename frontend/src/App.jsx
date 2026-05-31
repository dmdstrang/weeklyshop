import { useState } from 'react';
import MealPlan from './pages/MealPlan';
import ShoppingList from './pages/ShoppingList';
import Preferences from './pages/Preferences';
import { getNextMonday } from './lib/weeks';
import './App.css';

const TABS = [
  { id: 'plan', label: 'Plan' },
  { id: 'shopping', label: 'Shopping' },
  { id: 'prefs', label: 'Preferences' },
];

export default function App() {
  const [tab, setTab] = useState('plan');
  const [monday] = useState(() => getNextMonday());

  return (
    <div className="app">
      <header className="app-header">
        <h1 className="app-title">Strang's Weekly Shop</h1>
      </header>

      <main className="app-main">
        {tab === 'plan' && <MealPlan />}
        {tab === 'shopping' && <ShoppingList monday={monday} />}
        {tab === 'prefs' && <Preferences />}
      </main>

      <nav className="tab-bar">
        {TABS.map(t => (
          <button
            key={t.id}
            className={`tab-btn ${tab === t.id ? 'tab-btn--active' : ''}`}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </nav>
    </div>
  );
}
