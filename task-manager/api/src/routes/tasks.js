const { Router } = require('express');
const { z } = require('zod');
const Task = require('../models/tasks');
const auth = require('../middleware/auth');

const router = Router();

const createSchema = z.object({
  titulo: z.string().min(1),
  descricao: z.string().optional().default(''),
  prazo: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  prioridade: z.enum(['Baixa', 'Média', 'Alta', 'Crítica']).default('Média'),
  status: z.enum(['A Fazer', 'Em Progresso', 'Concluída']).default('A Fazer')
});

router.use(auth);

// Listar com filtros
router.get('/', async (req, res) => {
  const { q, status, prioridade, sort = 'prazo:asc' } = req.query;
  const where = { user: req.userId };
  if (status) where.status = status;
  if (prioridade) where.prioridade = prioridade;
  if (q)
    where.$or = [
      { titulo: { $regex: String(q), $options: 'i' } },
      { descricao: { $regex: String(q), $options: 'i' } }
    ];

  const [field, dir] = String(sort).split(':');
  const sortObj = { [field]: dir === 'desc' ? -1 : 1 };

  const items = await Task.find(where).sort(sortObj);
  res.json({ items });
});

// Criar
router.post('/', async (req, res) => {
  try {
    const body = createSchema.parse(req.body);
    const task = await Task.create({ ...body, user: req.userId });
    res.status(201).json({ item: task });
  } catch (err) {
    if (err?.issues) return res.status(400).json({ error: 'Dados inválidos', issues: err.issues });
    res.status(500).json({ error: 'Falha ao criar tarefa' });
  }
});

// Atualizar
router.put('/:id', async (req, res) => {
  try {
    const body = createSchema.partial().parse(req.body);
    const task = await Task.findOneAndUpdate({ _id: req.params.id, user: req.userId }, body, {
      new: true
    });
    if (!task) return res.status(404).json({ error: 'Tarefa não encontrada' });
    res.json({ item: task });
  } catch (err) {
    if (err?.issues) return res.status(400).json({ error: 'Dados inválidos', issues: err.issues });
    res.status(500).json({ error: 'Falha ao atualizar tarefa' });
  }
});

// Excluir
router.delete('/:id', async (req, res) => {
  const done = await Task.findOneAndDelete({ _id: req.params.id, user: req.userId });
  if (!done) return res.status(404).json({ error: 'Tarefa não encontrada' });
  res.status(204).end();
});

module.exports = router;
