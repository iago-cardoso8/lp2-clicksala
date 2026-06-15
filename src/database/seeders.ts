import { resolve, dirname } from 'node:path';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { prisma } from './prismaClient.js';
import solicitacoesModel from '../models/solicitacoesModel.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

interface SeedSala {
  id: number;
  nome: string;
  bloco: string;
  tipo: string;
  capacidade: number;
  equipamento: string[];
}

interface SeedSolicitacao {
  cod_sala: number;
  data: string;
  hora: string;
  finalidade: string;
  status: string;
}

interface SeedFile {
  salas: SeedSala[];
  solicitacoes: SeedSolicitacao[];
}

async function up() {
  const file = resolve(__dirname, 'seeders.json');
  const seed = JSON.parse(readFileSync(file, 'utf-8')) as SeedFile;

  if (Array.isArray(seed.salas)) {
    for (const sala of seed.salas) {
      const equipamentoValue = JSON.stringify(sala.equipamento ?? []);
      await prisma.sala.upsert({
        where: { id: sala.id },
        update: {
          nome: sala.nome,
          bloco: sala.bloco,
          tipo: sala.tipo,
          capacidade: sala.capacidade,
          equipamento: equipamentoValue,
        },
        create: {
          id: sala.id,
          nome: sala.nome,
          bloco: sala.bloco,
          tipo: sala.tipo,
          capacidade: sala.capacidade,
          equipamento: equipamentoValue,
        },
      });
    }
  }

  for (const solicitacao of seed.solicitacoes) {
    const exists = await prisma.solicitacao.findUnique({
      where: {
        cod_sala_data_hora: {
          cod_sala: Number(solicitacao.cod_sala),
          data: solicitacao.data,
          hora: solicitacao.hora,
        },
      },
    });

    if (!exists) {
      await solicitacoesModel.create(solicitacao);
    }
  }
}

export default { up };
