// task-manager/api/src/routes/auth.js
const { Router } = require('express');
const jwt = require('jsonwebtoken');
const { z } = require('zod');
const User = require('../models/user');
const auth = require('../middleware/auth');

const router = Router();

// Detecta se está em produção (Render usa NODE_ENV=production)
const isProd = process.env.NODE_ENV === 'production';

// Schema dos dados de autenticação
const credsSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email(),
  password: z.string().min(6),
});

// Gera o JWT
function sign(user) {
  return jwt.sign({}, process.env.JWT_SECRET, {
    subject: user.id,
    expiresIn: '7d',
  });
}

// Helper para enviar o cookie de sessão
function setSessionCookie(res, token) {
  res.cookie('token', token, {
    httpOnly: true,
    sameSite: isProd ? 'none' : 'lax', // precisa ser 'none' em HTTPS
    secure: isProd,                    // true em produção (HTTPS), false no local
    maxAge: 7 * 24 * 60 * 60 * 1000,   // 7 dias
  });
}

// ---------- ROTAS ----------

// Registrar
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = credsSchema.parse(req.body);

    const exists = await User.findOne({ email });
    if (exists) {
      return res.status(409).json({ error: 'E-mail já cadastrado' });
    }

    const user = await User.create({ name, email, password });
    const token = sign(user);

    // Envia cookie de sessão
    setSessionCookie(res, token);

    // >>> Importante: também devolve o token no JSON (o front usa isso)
    return res.status(201).json({
      ok: true,
      token,
      user: { id: user.id, name: user.name, email: user.email },
    });
  } catch (err) {
    if (err?.issues) {
      return res.status(400).json({ error: 'Dados inválidos', issues: err.issues });
    }
    return res.status(500).json({ error: 'Falha ao registrar' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = credsSchema.pick({ email: true, password: true }).parse(req.body);

    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ error: 'Credenciais inválidas' });

    const ok = await user.comparePassword(password);
    if (!ok) return res.status(401).json({ error: 'Credenciais inválidas' });

    const token = sign(user);

    // Envia cookie de sessão
    setSessionCookie(res, token);

    // >>> Importante: também devolve o token no JSON (o front usa isso)
    return res.json({
      ok: true,
      token,
      user: { id: user.id, name: user.name, email: user.email },
    });
  } catch (err) {
    if (err?.issues) {
      return res.status(400).json({ error: 'Dados inválidos', issues: err.issues });
    }
    return res.status(500).json({ error: 'Falha ao autenticar' });
  }
});

// Dados do usuário logado
router.get('/me', auth, async (req, res) => {
  const user = await User.findById(req.userId).select('name email');
  return res.json({ user });
});

// Logout (zera o cookie)
router.post('/logout', (_req, res) => {
  res.clearCookie('token', {
    httpOnly: true,
    sameSite: isProd ? 'none' : 'lax',
    secure: isProd,
  });
  return res.json({ ok: true });
});

module.exports = router;
