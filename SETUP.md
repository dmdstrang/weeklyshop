# Weekly Meal Planner — Setup Guide

## 1. Supabase

1. Go to [supabase.com](https://supabase.com) and create a free project
2. Open the SQL Editor and run the contents of `supabase/schema.sql`
3. Copy your **Project URL** and **anon public key** from Settings → API

## 2. Configure environment

**Frontend** — create `frontend/.env`:
```
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
```

**Backend** — create `backend/.env`:
```
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_SERVICE_KEY=your_service_role_key
PORT=3001
FRONTEND_URL=http://localhost:5173
```

## 3. Install Playwright browsers

```bash
cd backend && npx playwright install chromium
```

## 4. Run the app

```bash
npm install          # install root tooling
npm run dev          # starts both frontend (port 5173) and backend (port 3001)
```

Open [http://localhost:5173](http://localhost:5173)

## 5. Add to Home Screen (mobile)

- On iPhone: Safari → Share → Add to Home Screen
- On Android: Chrome → ⋮ → Add to Home Screen

## Using the app

1. **Meal Plan tab** — tap "✨ Suggest meals" to auto-fill the week
2. Toggle a day as "Out" if you're not eating at home
3. Tap 🔄 on any meal to swap it for an alternative
4. **Shopping tab** — tap "Regenerate" to build the shopping list from your plan
5. Check off items as you already have them, then tap "Add to Sainsbury's basket"
6. Enter your Sainsbury's login on first use (stored locally, never sent to a server)
