import express from 'express';
import morgan from 'morgan';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import solicitacoesModel from './models/solicitacoesModel.js';
import Seed from './database/seeders.js';

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(morgan('tiny'));
app.use(express.json());
app.use(cors());

app.use(express.static(path.join(__dirname, '..', 'public')));

app.get('/solicitacoes', (req, res) => {
  const { field, value } = req.query;
  const result = solicitacoesModel.read(field, value);
  res.json(result);
});

app.get('/solicitacoes/:id', (req, res) => {
  try {
    const solicitacao = solicitacoesModel.readById(req.params.id);
    res.json(solicitacao);
  } catch (error) {
    res.status(404).json({ erro: error.message });
  }
});

app.post('/solicitacoes', (req, res) => {
  try {
    const { sala, data, hora, finalidade } = req.body;
    if (!sala || !data || !hora) {
      return res.status(400).json({
        error: 'Os campos sala, data e hora são obrigatórios.'
      });
    }

    const conflito = solicitacoesModel.read().some((s) =>
      s.sala === sala &&
      s.data === data &&
      s.hora === hora &&
      s.status === 'Pendente'
    );

    if (conflito) {
      return res.status(409).json({
        error: 'Já existe uma solicitação para essa sala neste dia e horário.'
      });
    }

    const novaSolicitacao = solicitacoesModel.create({ sala, data, hora, finalidade });
    return res.status(201).json(novaSolicitacao);
  } catch (erro) {
    return res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

app.put('/solicitacoes/:id', (req, res) => {
  try {
    const { status } = req.body;
    if (!status) {
      return res.status(400).json({ error: 'O status é obrigatório.' });
    }

    const solicitacaoAtualizada = solicitacoesModel.update({
      id: req.params.id,
      status,
    });

    res.json(solicitacaoAtualizada);
  } catch (error) {
    if (error.message.includes('não encontrada')) {
      return res.status(404).json({ erro: error.message });
    }
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

app.delete('/solicitacoes/:id', (req, res) => {
  try {
    solicitacoesModel.remove(req.params.id);
    res.status(204).send();
  } catch (error) {
    res.status(404).json({ erro: error.message });
  }
});

await Seed.up();

app.listen(3000, () => {
  console.log(`Servidor rodando em http://localhost:3000`);
});