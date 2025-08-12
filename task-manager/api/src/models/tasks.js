const { Schema, model, Types } = require('mongoose');

const PRIORIDADES = ['Baixa', 'Média', 'Alta', 'Crítica'];
const STATUS = ['A Fazer', 'Em Progresso', 'Concluída'];

const taskSchema = new Schema(
  {
    user: { type: Types.ObjectId, ref: 'User', index: true, required: true },
    titulo: { type: String, required: true, trim: true },
    descricao: { type: String, trim: true },
    prazo: { type: String }, // YYYY-MM-DD
    prioridade: { type: String, enum: PRIORIDADES, default: 'Média' },
    status: { type: String, enum: STATUS, default: 'A Fazer' }
  },
  { timestamps: true }
);

module.exports = model('Task', taskSchema);
