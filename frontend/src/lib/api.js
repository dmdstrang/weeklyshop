const BASE = import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api` : '/api';

export async function fetchMealPlan(week) {
  const res = await fetch(`${BASE}/mealplan?week=${week}`);
  return res.json();
}

export async function upsertMealPlanDay(body) {
  const res = await fetch(`${BASE}/mealplan`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return res.json();
}

export async function fetchMealLibrary() {
  const res = await fetch(`${BASE}/mealplan/library`);
  return res.json();
}

export async function generateMealImage(mealId, force = false) {
  const res = await fetch(`${BASE}/mealplan/library/${mealId}/image${force ? '?force=1' : ''}`, {
    method: 'POST',
  });
  return res.json();
}

export async function fetchSuggestions(week, busyDays = []) {
  const res = await fetch(`${BASE}/suggestions?week=${week}&busyDays=${busyDays.join(',')}`);
  return res.json();
}

export async function fetchAlternatives(mealId, category) {
  const res = await fetch(`${BASE}/suggestions/alternatives?mealId=${mealId}&category=${category}`);
  return res.json();
}

export async function searchMeals(q, excludeId = '') {
  const res = await fetch(`${BASE}/suggestions/search?q=${encodeURIComponent(q)}&excludeId=${excludeId}`);
  return res.json();
}

export async function generateMeal(query, category = '') {
  const res = await fetch(`${BASE}/suggestions/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, category }),
  });
  return res.json();
}

export async function rateMeal(id, rating) {
  // rating: 'liked' | 'disliked' | null
  const res = await fetch(`${BASE}/mealplan/library/${id}/rate`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ rating }),
  });
  return res.json();
}

export async function saveMealToLibrary(meal) {
  const res = await fetch(`${BASE}/mealplan/library`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(meal),
  });
  return res.json();
}

export async function generateShoppingList(week) {
  const res = await fetch(`${BASE}/shopping/generate?week=${week}`, { method: 'POST' });
  return res.json();
}

export async function fetchShoppingList(week) {
  const res = await fetch(`${BASE}/shopping?week=${week}`);
  return res.json();
}

export async function toggleShoppingItem(week, itemName, checked) {
  const res = await fetch(`${BASE}/shopping/item`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ week, itemName, checked }),
  });
  return res.json();
}

export async function addShoppingExtra(week, name) {
  const res = await fetch(`${BASE}/shopping/extra`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ week, name }),
  });
  return res.json();
}

export async function removeShoppingExtra(week, name) {
  const res = await fetch(`${BASE}/shopping/extra`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ week, name }),
  });
  return res.json();
}
