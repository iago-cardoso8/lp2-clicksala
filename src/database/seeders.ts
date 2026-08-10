import { resolve, dirname } from 'node:path';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { prisma } from './prismaClient.js';
import { hashPassword } from '../utils/password.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

interface SeedUsuario {
  id: number;
  nome: string;
  email: string;
  senha: string;
}

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
  id_user: number;
}

interface SeedFile {
  usuarios: SeedUsuario[];
  salas: SeedSala[];
  solicitacoes: SeedSolicitacao[];
}

async function up() {
  const file = resolve(__dirname, 'seeders.json');
  const seed = JSON.parse(readFileSync(file, 'utf-8')) as SeedFile;

  if (Array.isArray(seed.usuarios)) {
    for (const usuario of seed.usuarios) {
      const senha = hashPassword(usuario.senha);

      await prisma.$executeRawUnsafe(
        `INSERT OR IGNORE INTO usuario (nome, email, senha) VALUES (?, ?, ?)`,
        usuario.nome,
        usuario.email,
        senha
      );
    }
  }

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
    await prisma.solicitacao.upsert({
      where: {
        cod_sala_data_hora: {
          cod_sala: Number(solicitacao.cod_sala),
          data: solicitacao.data,
          hora: solicitacao.hora,
        },
      },
      update: {
        finalidade: solicitacao.finalidade,
        status: solicitacao.status,
        id_user: solicitacao.id_user,
      },
      create: {
        cod_sala: Number(solicitacao.cod_sala),
        data: solicitacao.data,
        hora: solicitacao.hora,
        finalidade: solicitacao.finalidade,
        status: solicitacao.status,
        id_user: solicitacao.id_user,
      },
    });
  }
}

export default { up };
