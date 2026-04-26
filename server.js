import express from 'express';
import morgan from 'morgan';
import { v4 as uuidv4 } from 'uuid';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

import { solicitacoes } from './public/js/dados.js';

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(morgan('tiny'));
app.use(express.json());
app.use(cors());

// Força o caminho absoluto da pasta public
app.use(express.static(path.join(__dirname, 'public')));

// Rotas da API...
app.get('/solicitacoes', (req, res) => {
  res.json(solicitacoes);
});

app.get('/solicitacoes/:id', (req, res) => {
  const solicitacao = solicitacoes.find(s => String(s.id) === String(req.params.id));
  if (!solicitacao) return res.status(404).json({ erro: 'Não encontrada' });
  res.json(solicitacao);
});

app.post('/solicitacoes', (req, res) => {
  const { sala, data, hora, finalidade } = req.body;
  if (!sala || !data || !hora) {
    return res.status(400).json({ error: 'Os campos sala, data e hora são obrigatórios.' });
  }
  const novaSolicitacao = {
    id: uuidv4(),
    sala,
    data,
    hora,
    finalidade: finalidade || '',
    status: 'Pendente',
  };
  solicitacoes.push(novaSolicitacao);
  return res.status(201).json(novaSolicitacao);
});

app.put('/solicitacoes/:id', (req, res) => {
  const { status } = req.body;
  const solicitacao = solicitacoes.find(s => String(s.id) === String(req.params.id));
  if (!solicitacao) return res.status(404).json({ erro: 'Não encontrada' });
  solicitacao.status = status;
  res.json(solicitacao);
});

app.delete('/solicitacoes/:id', (req, res) => {
  const index = solicitacoes.findIndex(s => String(s.id) === String(req.params.id));
  if (index === -1) return res.status(404).json({ erro: 'Não encontrada' });
  solicitacoes.splice(index, 1);
  res.status(204).send();
});

app.listen(3000, () => {
  console.log(`Servidor rodando em http://localhost:3000`);
});