import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import morgan from 'morgan';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import solicitacoesRoutes from './routes/solicitacoesRoutes.js';
import Migration from './database/migration.js';
import Seed from './database/seeders.js';
import requireJson from './middlewares/requireJson.js';
import errorHandler from './middlewares/errorHandler.js';

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || 'localhost';
const NODE_ENV = process.env.NODE_ENV || 'development';
const CORS_ORIGIN = process.env.CORS_ORIGIN || `http://localhost:${PORT}`;
const LOG_LEVEL = process.env.LOG_LEVEL || 'debug';

app.use(morgan(LOG_LEVEL === 'debug' ? 'dev' : 'tiny'));
app.use(express.json());
app.use(cors({ origin: CORS_ORIGIN }));
app.use(requireJson);

app.use(express.static(path.join(__dirname, '..', 'public')));

app.use('/solicitacoes', solicitacoesRoutes);

await Migration.up();
await Seed.up();

app.use(errorHandler as any);

app.listen(PORT, () => {
  console.log(`✅ Servidor rodando em http://${HOST}:${PORT}`);
  console.log(`🌍 Ambiente: ${NODE_ENV}`);
  console.log(`📍 CORS Origin: ${CORS_ORIGIN}`);
});

export default app;