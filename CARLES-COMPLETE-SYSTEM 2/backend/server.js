require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 8080;
const allowed = (process.env.FRONTEND_URL || '*').split(',').map(s => s.trim());
app.use(helmet());
app.use(cors({ origin: (origin, cb) => (!origin || allowed.includes('*') || allowed.includes(origin)) ? cb(null, true) : cb(new Error('Not allowed by CORS')), credentials: true }));
app.use(express.json({ limit: '1mb' }));

app.get('/', (_, res) => res.json({ name: 'Carles Meatland & Farms API', status: 'ok' }));
app.get('/health', async (_, res) => {
  try { await db.query('SELECT 1'); res.json({ status: 'ok', database: 'connected', timestamp: new Date().toISOString() }); }
  catch { res.status(500).json({ status: 'error', database: 'unavailable' }); }
});

app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/animals', require('./routes/animals'));
app.use('/api/feed', require('./routes/feed'));
app.use('/api/medications', require('./routes/medications'));
app.use('/api/breeding', require('./routes/breeding'));
app.use('/api/finance', require('./routes/finance'));
app.use('/api/reports', require('./routes/reports'));

app.use((req, res) => res.status(404).json({ error: 'Route not found' }));
app.use((err, req, res, next) => { console.error(err); res.status(500).json({ error: 'Internal server error' }); });
app.listen(PORT, () => console.log(`Carles API running on port ${PORT}`));
