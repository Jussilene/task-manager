// task-manager/api/src/server.js (CommonJS)

const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');
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
    process.exit(1); // Pode comentar durante testes se quiser evitar crash
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

// ---------- Error handlers ----------
app.use((req, res) => res.status(404).json({ error: 'Not Found' }));
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(err.status || 500).json({ error: err.message || 'Internal Server Error' });
});

// ---------- START ----------
const PORT = process.env.PORT || 4000;
app.set('trust proxy', 1);
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 API+WEB rodando em 0.0.0.0:${PORT}`);
});
