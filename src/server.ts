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

app.use(morgan('tiny'));
app.use(express.json());
app.use(cors());
app.use(requireJson);

app.use(express.static(path.join(__dirname, '..', 'public')));

app.use('/solicitacoes', solicitacoesRoutes);

await Migration.up();
await Seed.up();

app.use(errorHandler as any);

app.listen(3000, () => {
  console.log(`Servidor rodando em http://localhost:3000`);
});

export default app;
