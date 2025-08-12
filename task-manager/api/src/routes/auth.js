const { Router } = require('express');
const jwt = require('jsonwebtoken');
const { z } = require('zod');
const User = require('../models/User');
const auth = require('../middleware/auth');

const router = Router();

const credsSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email(),
  password: z.string().min(6)
});

function sign(user) {
  return jwt.sign({}, process.env.JWT_SECRET, { subject: user.id, expiresIn: '7d' });
}

router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = credsSchema.parse(req.body);
    const exists = await User.findOne({ email });
    if (exists) return res.status(409).json({ error: 'E-mail já cadastrado' });
    const user = await User.create({ name, email, password });
    const token = sign(user);
    res.status(201).json({ token, user: { id: user.id, name: user.name, email: user.email } });
  } catch (err) {
    if (err?.issues) return res.status(400).json({ error: 'Dados inválidos', issues: err.issues });
    res.status(500).json({ error: 'Falha ao registrar' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = credsSchema.pick({ email: true, password: true }).parse(req.body);
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ error: 'Credenciais inválidas' });
    const ok = await user.comparePassword(password);
    if (!ok) return res.status(401).json({ error: 'Credenciais inválidas' });
    const token = sign(user);
    res.json({ token, user: { id: user.id, name: user.name, email: user.email } });
  } catch (err) {
    if (err?.issues) return res.status(400).json({ error: 'Dados inválidos', issues: err.issues });
    res.status(500).json({ error: 'Falha ao autenticar' });
  }
});

router.get('/me', auth, async (req, res) => {
  const user = await User.findById(req.userId).select('name email');
  res.json({ user });
});

module.exports = router;
