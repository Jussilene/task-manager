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
app.use(cookieParser());

// Monta lista de origens permitidas a partir do ENV
const envOrigins = (process.env.CORS_ORIGIN || '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

// Opções de CORS que cobrem localhost, IP da rede e Render (e preflight)
const corsOptions = {
  credentials: true,
  origin: (origin, cb) => {
    // Permite requests sem Origin (ex: curl/health)
    if (!origin) return cb(null, true);

    // Se estiver explicitamente no ENV, permite
    if (envOrigins.includes(origin)) return cb(null, true);

    // Permite dev local: http://localhost:qualquerporta
    if (/^http:\/\/localhost:\d+$/.test(origin)) return cb(null, true);

    // Permite rede local: http://192.168.x.x:qualquerporta
    if (/^http:\/\/192\.168\.\d+\.\d+:\d+$/.test(origin)) return cb(null, true);

    // Permite subdomínios do Render em produção (https)
    if (/^https:\/\/.*\.onrender\.com$/.test(origin)) return cb(null, true);

    return cb(new Error('Not allowed by CORS: ' + origin));
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['Set-Cookie'],
  preflightContinue: false,
  optionsSuccessStatus: 204,
};

app.use(cors(corsOptions));
// Responde a todos os preflights
app.options('*', cors(corsOptions));

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

// Healthcheck simples
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
  // Sem build do front, mantém a raiz simples
  app.get('/', (_req, res) => {
    res.status(200).send('API online (sem front build)');
  });
}

// ---------- START ----------
const PORT = process.env.PORT || 4000;
app.set('trust proxy', 1); // importante p/ cookies "secure" atrás de proxy (Render)

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 API+WEB rodando em 0.0.0.0:${PORT}`);
});
