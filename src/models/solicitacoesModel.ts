import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { DatabaseSync } from 'node:sqlite';
import Database from '../database/database.js';
import type { Sala, Solicitacao, CreateSolicitacaoDTO, UpdateSolicitacaoDTO } from '../types/entities.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const dbFile = resolve(__dirname, 'db.sqlite');
const allowedFields = new Set(['cod_sala', 'data', 'hora', 'finalidade', 'status']);

function connect() {
  // use sync Database for simple operations
  return new DatabaseSync(dbFile);
}

async function getSalas(): Promise<Sala[]> {
  const db = await Database.connect();
  try {
    const salas = await db.all(
      `SELECT id, nome, bloco, capacidade, tipo, equipamento FROM sala ORDER BY id`
    );

    return salas.map((sala: any) => ({
      ...sala,
      equipamento: sala.equipamento ? JSON.parse(sala.equipamento) : [],
    }));
  } finally {
    await db.close();
  }
}

function create({ cod_sala, data, hora, finalidade, status }: CreateSolicitacaoDTO): Solicitacao {
  if (!cod_sala || !data || !hora) {
    throw new Error('Unable to create solicitacao');
  }

  const db = connect();
  try {
    const result = db.prepare(
      `INSERT INTO solicitacao (cod_sala, data, hora, finalidade, status)
       VALUES (?, ?, ?, ?, ?)`
    ).run(
      cod_sala,
      data,
      hora,
      finalidade || '',
      status || 'Pendente'
    );

    if (result.changes !== 1) {
      throw new Error('Unable to create solicitacao');
    }

    return {
      cod_sala,
      data,
      hora,
      finalidade: finalidade || '',
      status: status || 'Pendente',
    };
  } finally {
    db.close();
  }
}

function read(field?: string, value?: string): Solicitacao[] {
  const db = connect();
  try {
    if (field && value && allowedFields.has(field)) {
      return db
        .prepare(`SELECT cod_sala, data, hora, finalidade, status FROM solicitacao WHERE ${field} LIKE ?`)
        .all(`%${value}%`);
    }

    return db.prepare(`SELECT cod_sala, data, hora, finalidade, status FROM solicitacao`).all();
  } finally {
    db.close();
  }
}

function readByKey(cod_sala: number | string, data: string, hora: string): Solicitacao {
  if (!cod_sala || !data || !hora) {
    throw new Error('Unable to find solicitacao');
  }

  const db = connect();
  try {
    const solicitacao = db
      .prepare(
        `SELECT cod_sala, data, hora, finalidade, status
         FROM solicitacao
         WHERE cod_sala = ? AND data = ? AND hora = ?`
      )
      .get(cod_sala, data, hora);

    if (!solicitacao) {
      throw new Error('Solicitação não encontrada');
    }

    return solicitacao;
  } finally {
    db.close();
  }
}

function update({ cod_sala, data, hora, status }: UpdateSolicitacaoDTO): Solicitacao {
  if (!cod_sala || !data || !hora || !status) {
    throw new Error('Unable to update solicitacao');
  }

  const db = connect();
  try {
    const result = db
      .prepare(
        `UPDATE solicitacao SET status = ?
         WHERE cod_sala = ? AND data = ? AND hora = ?`
      )
      .run(status, cod_sala, data, hora);

    if (result.changes === 0) {
      throw new Error('Solicitação não encontrada');
    }

    return readByKey(cod_sala, data, hora);
  } finally {
    db.close();
  }
}

function remove(cod_sala: number | string, data: string, hora: string) {
  if (!cod_sala || !data || !hora) {
    throw new Error('Unable to remove solicitacao');
  }

  const db = connect();
  try {
    const result = db
      .prepare(
        `DELETE FROM solicitacao WHERE cod_sala = ? AND data = ? AND hora = ?`
      )
      .run(cod_sala, data, hora);

    if (result.changes === 0) {
      throw new Error('Solicitação não encontrada');
    }

    return true;
  } finally {
    db.close();
  }
}

export default { create, read, readByKey, update, remove, getSalas };
