// task-manager/api/src/server.js (CommonJS)

const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');
const cookieParser = require('cookie-parser');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const taskRoutes = require('./routes/tasks');

const app = express();

// ---------- Middlewares ----------
app.use(express.json());

// lê cookies (para sessão via cookie)
app.use(cookieParser());

// CORS com credentials e lista do ENV (permite chamadas sem origin também)
const allowedOrigins = (process.env.CORS_ORIGIN || '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

app.use(
  cors({
    credentials: true,
    origin: (origin, cb) => {
      if (!origin) return cb(null, true); // ex: curl / health checks
      if (!allowedOrigins.length) return cb(null, true);
      if (allowedOrigins.includes(origin)) return cb(null, true);
      return cb(new Error('Not allowed by CORS'));
    },
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
app.get('/api', (_req, res) =>
  res.json({ ok: true, name: 'Task Manager API', version: '1.0.0' })
);

// opcional: healthcheck simples
app.get('/healthz', (_req, res) => res.status(200).send('ok'));

app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);

// ---------- FRONT (Vite build) ----------
/**
 * Estrutura:
 *   task-manager/
 *     api/
 *       src/server.js
 *     web/
 *       dist/          <-- build do Vite
 */
const distPath = path.resolve(__dirname, '..', '..', 'web', 'dist');

if (fs.existsSync(path.join(distPath, 'index.html'))) {
  // Serve os arquivos do front se existir o build
  app.use(express.static(distPath));

  // SPA fallback: qualquer rota que não seja /api devolve index.html
  app.get('*', (req, res) => {
    if (req.path.startsWith('/api')) {
      return res.status(404).json({ error: 'Not Found' });
    }
    res.sendFile(path.join(distPath, 'index.html'));
  });
} else {
  // Sem build do front, mantenha a raiz simples
  app.get('/', (_req, res) => {
    res.status(200).send('API online (sem front build)');
  });
}

// ---------- START ----------
const PORT = process.env.PORT || 4000;

// importante para cookies "secure" atrás de proxy (Render)
app.set('trust proxy', 1);

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 API+WEB rodando em 0.0.0.0:${PORT}`);
});
