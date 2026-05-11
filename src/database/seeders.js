import { resolve, dirname } from 'node:path';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import solicitacoesModel from '../models/solicitacoesModel.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function up() {
  const file = resolve(__dirname, 'seeders.json');
  const seed = JSON.parse(readFileSync(file, 'utf-8'));

  for (const solicitacao of seed.solicitacoes) {
    const exists = solicitacoesModel.read().some(
      (item) => String(item.id) === String(solicitacao.id)
    );

    if (!exists) {
      solicitacoesModel.create(solicitacao);
    }
  }
}

export default { up };