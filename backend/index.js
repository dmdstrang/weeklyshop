import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import mealplanRoutes from './routes/mealplan.js';
import suggestionsRoutes from './routes/suggestions.js';
import sainsburysRoutes from './routes/sainsburys.js';
import shoppingRoutes from './routes/shopping.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173' }));
app.use(express.json());

app.use('/api/mealplan', mealplanRoutes);
app.use('/api/suggestions', suggestionsRoutes);
app.use('/api/sainsburys', sainsburysRoutes);
app.use('/api/shopping', shoppingRoutes);

app.get('/api/health', (_req, res) => res.json({ ok: true }));

app.listen(PORT, () => console.log(`Backend running on http://localhost:${PORT}`));
