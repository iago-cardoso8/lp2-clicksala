import express from 'express';
import morgan from 'morgan';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import solicitacoesModel from './models/solicitacoesModel.js';
import Database from './database/database.js';
import Migration from './database/migration.js';
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

app.get('/salas', async (req, res) => {
  try {
    const db = await Database.connect();
    const salas = await db.all(
      `SELECT id, nome, bloco, capacidade, tipo, equipamento FROM sala ORDER BY id`
    );
    db.close();
    res.json(
      salas.map((sala) => ({
        ...sala,
        equipamento: sala.equipamento ? JSON.parse(sala.equipamento) : [],
      }))
    );
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar salas' });
  }
});

app.get('/solicitacoes/:cod_sala/:data/:hora', (req, res) => {
  try {
    const { cod_sala, data, hora } = req.params;
    const solicitacao = solicitacoesModel.readByKey(cod_sala, data, hora);
    res.json(solicitacao);
  } catch (error) {
    res.status(404).json({ erro: error.message });
  }
});

app.post('/solicitacoes', (req, res) => {
  try {
    const { cod_sala, data, hora, finalidade } = req.body;
    if (!cod_sala || !data || !hora) {
      return res.status(400).json({
        error: 'Os campos sala, data e hora são obrigatórios.'
      });
    }

    const conflito = solicitacoesModel.read().some((s) =>
      s.cod_sala === cod_sala &&
      s.data === data &&
      s.hora === hora &&
      s.status === 'Pendente'
    );

    if (conflito) {
      return res.status(409).json({
        error: 'Já existe uma solicitação para essa sala neste dia e horário.'
      });
    }

    const novaSolicitacao = solicitacoesModel.create({ cod_sala, data, hora, finalidade });
    return res.status(201).json(novaSolicitacao);
  } catch (erro) {
    return res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

app.put('/solicitacoes/:cod_sala/:data/:hora', (req, res) => {
  try {
    const { status } = req.body;
    if (!status) {
      return res.status(400).json({ error: 'O status é obrigatório.' });
    }

    const solicitacaoAtualizada = solicitacoesModel.update({
      cod_sala: req.params.cod_sala,
      data: req.params.data,
      hora: req.params.hora,
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

app.delete('/solicitacoes', (req, res) => {
  const { cod_sala, data, hora } = req.body.cod_sala ? req.body : req.query;
  try {
    if (!cod_sala || !data || !hora) {
      return res.status(400).json({ error: 'Parâmetros cod_sala, data e hora são obrigatórios.' });
    }

    solicitacoesModel.remove(cod_sala, data, hora);
    res.status(204).send();
  } catch (error) {
    res.status(404).json({ erro: error.message });
  }
});

app.delete('/solicitacoes/:cod_sala/:data/:hora', (req, res) => {
  try {
    solicitacoesModel.remove(req.params.cod_sala, req.params.data, req.params.hora);
    res.status(204).send();
  } catch (error) {
    res.status(404).json({ erro: error.message });
  }
});

await Migration.up();
await Seed.up();

app.listen(3000, () => {
  console.log(`Servidor rodando em http://localhost:3000`);
});