// task-manager/api/src/server.js (CommonJS)

const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const taskRoutes = require('./routes/tasks');

const app = express();

// ---------- Middlewares ----------
app.use(express.json());

// Em produção, tudo roda no mesmo domínio; se CORS_ORIGIN não vier, não define origin
const allowedOrigins = (process.env.CORS_ORIGIN || '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: allowedOrigins.length ? allowedOrigins : undefined,
    credentials: true,
  })
);

app.use(morgan('dev'));

// ---------- Conexão MongoDB ----------
mongoose.set('strictQuery', true);
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB conectado'))
  .catch((err) => {
    console.error('❌ Erro ao conectar no MongoDB', err.message);
    process.exit(1);
  });

// ---------- Rotas da API ----------
app.get('/api', (req, res) =>
  res.json({ ok: true, name: 'Task Manager API', version: '1.0.0' })
);
app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);

// ---------- FRONT (Vite build) ----------
/**
 * Estrutura:
 *   task-manager/
 *     api/
 *       src/server.js  <-- (estamos aqui)
 *     web/
 *       dist/          <-- build do Vite
 *
 * Sobe 2 níveis e entra em web/dist
 */
const distPath = path.resolve(__dirname, '..', '..', 'web', 'dist');
app.use(express.static(distPath));

/**
 * SPA fallback: qualquer coisa que não seja /api/*
 * devolve o index.html da aplicação React
 */
app.get('*', (req, res) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ error: 'Not Found' });
  }
  res.sendFile(path.join(distPath, 'index.html'));
});

// ---------- Error handlers ----------
app.use((req, res) => res.status(404).json({ error: 'Not Found' }));
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(err.status || 500).json({ error: err.message || 'Internal Server Error' });
});

// ---------- START ----------
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`🚀 API+WEB rodando em http://localhost:${PORT}`));
