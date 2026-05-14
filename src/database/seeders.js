import { resolve, dirname } from 'node:path';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import solicitacoesModel from '../models/solicitacoesModel.js';
import Database from './database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function up() {
  const file = resolve(__dirname, 'seeders.json');
  const seed = JSON.parse(readFileSync(file, 'utf-8'));
  const db = await Database.connect();

  try {
    if (Array.isArray(seed.salas)) {
      for (const sala of seed.salas) {
        const exists = await db.get('SELECT id FROM sala WHERE id = ?', [sala.id]);
        if (!exists) {
          await db.run(
            `INSERT INTO sala (id, nome, bloco, tipo, capacidade, equipamento)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [
              sala.id,
              sala.nome,
              sala.bloco,
              sala.tipo,
              sala.capacidade,
              JSON.stringify(sala.equipamento),
            ]
          );
        }
      }
    }
  } finally {
    db.close();
  }

  for (const solicitacao of seed.solicitacoes) {
    const exists = solicitacoesModel.read().some(
      (item) => String(item.cod_sala) === String(solicitacao.cod_sala) &&
                 item.data === solicitacao.data &&
                 item.hora === solicitacao.hora
    );

    if (!exists) {
      solicitacoesModel.create(solicitacao);
    }
  }
}

export default { up };