import { prisma } from '../database/prismaClient.js';
import type { Prisma } from '@prisma/client';
import type { Sala, Solicitacao, CreateSolicitacaoDTO, UpdateSolicitacaoDTO } from '../types/entities.js';

type PrismaSala = Prisma.SalaGetPayload<{
  select: {
    id: true;
    nome: true;
    bloco: true;
    tipo: true;
    capacidade: true;
    equipamento: true;
  };
}>;

type PrismaSolicitacao = Prisma.SolicitacaoGetPayload<{}>;

const allowedFields = new Set(['cod_sala', 'data', 'hora', 'finalidade', 'status']);

function normalizeSolicitacao(solicitacao: PrismaSolicitacao): Solicitacao {
  return {
    ...solicitacao,
    finalidade: solicitacao.finalidade ?? '',
  };
}

export async function getSalas(): Promise<Sala[]> {
  const salas = await prisma.sala.findMany({
    orderBy: { id: 'asc' },
    select: {
      id: true,
      nome: true,
      bloco: true,
      tipo: true,
      capacidade: true,
      equipamento: true,
    },
  });

  return salas.map((sala: PrismaSala): Sala => ({
    id: sala.id,
    nome: sala.nome,
    bloco: sala.bloco,
    tipo: sala.tipo,
    capacidade: sala.capacidade,
    equipamento: sala.equipamento ? JSON.parse(sala.equipamento) : [],
  }));
}

export async function create({ cod_sala, data, hora, finalidade, status, id_user }: CreateSolicitacaoDTO): Promise<Solicitacao> {
  if (!cod_sala || !data || !hora || !id_user) {
    throw new Error('Unable to create solicitacao');
  }

  const solicitacao = await prisma.solicitacao.create({
    data: {
      cod_sala: Number(cod_sala),
      data,
      hora,
      finalidade: finalidade || '',
      status: status || 'Pendente',
      id_user: Number(id_user),
    },
  });

  return normalizeSolicitacao(solicitacao);
}

export async function read(field?: string, value?: string, id_user?: number): Promise<Solicitacao[]> {
  const where: Record<string, any> = {};

  if (field && value && allowedFields.has(field)) {
    if (field === 'cod_sala') {
      const codSala = Number(value);
      where.cod_sala = Number.isNaN(codSala) ? -1 : codSala;
    } else {
      where[field] = { contains: value, mode: 'insensitive' };
    }
  }

  if (id_user) {
    where.id_user = id_user;
  }

  const result = await prisma.solicitacao.findMany({
    where,
    orderBy: [{ data: 'asc' }, { hora: 'asc' }],
  });

  return result.map(normalizeSolicitacao);
}

export async function readByKey(cod_sala: number | string, data: string, hora: string, id_user?: number): Promise<Solicitacao> {
  if (!cod_sala || !data || !hora) {
    throw new Error('Unable to find solicitacao');
  }

  const where: Record<string, any> = {
    cod_sala: Number(cod_sala),
    data,
    hora,
  };

  if (id_user) {
    where.id_user = id_user;
  }

  const solicitacao = await prisma.solicitacao.findFirst({
    where,
  });

  if (!solicitacao) {
    throw new Error('Solicitação não encontrada');
  }

  return normalizeSolicitacao(solicitacao);
}

export async function update({ cod_sala, data, hora, status, id_user }: UpdateSolicitacaoDTO & { id_user?: number }): Promise<Solicitacao> {
  if (!cod_sala || !data || !hora || !status || !id_user) {
    throw new Error('Unable to update solicitacao');
  }

  const updated = await prisma.solicitacao.updateMany({
    where: {
      cod_sala: Number(cod_sala),
      data,
      hora,
      id_user,
    },
    data: { status },
  });

  if (updated.count === 0) {
    throw new Error('Solicitação não encontrada');
  }

  return readByKey(cod_sala, data, hora, id_user);
}

export async function remove(cod_sala: number | string, data: string, hora: string, id_user?: number): Promise<boolean> {
  if (!cod_sala || !data || !hora || !id_user) {
    throw new Error('Unable to remove solicitacao');
  }

  const deleted = await prisma.solicitacao.deleteMany({
    where: {
      cod_sala: Number(cod_sala),
      data,
      hora,
      id_user,
    },
  });

  if (deleted.count === 0) {
    throw new Error('Solicitação não encontrada');
  }

  return true;
}

export default { getSalas, create, read, readByKey, update, remove };
