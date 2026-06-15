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

export async function create({ cod_sala, data, hora, finalidade, status }: CreateSolicitacaoDTO): Promise<Solicitacao> {
  if (!cod_sala || !data || !hora) {
    throw new Error('Unable to create solicitacao');
  }

  const solicitacao = await prisma.solicitacao.create({
    data: {
      cod_sala: Number(cod_sala),
      data,
      hora,
      finalidade: finalidade || '',
      status: status || 'Pendente',
    },
  });

  return normalizeSolicitacao(solicitacao);
}

export async function read(field?: string, value?: string): Promise<Solicitacao[]> {
  const where: Record<string, any> = {};

  if (field && value && allowedFields.has(field)) {
    if (field === 'cod_sala') {
      const codSala = Number(value);
      where.cod_sala = Number.isNaN(codSala) ? -1 : codSala;
    } else {
      where[field] = { contains: value, mode: 'insensitive' };
    }
  }

  const result = await prisma.solicitacao.findMany({
    where,
    orderBy: [{ data: 'asc' }, { hora: 'asc' }],
  });

  return result.map(normalizeSolicitacao);
}

export async function readByKey(cod_sala: number | string, data: string, hora: string): Promise<Solicitacao> {
  if (!cod_sala || !data || !hora) {
    throw new Error('Unable to find solicitacao');
  }

  const solicitacao = await prisma.solicitacao.findUnique({
    where: {
      cod_sala_data_hora: {
        cod_sala: Number(cod_sala),
        data,
        hora,
      },
    },
  });

  if (!solicitacao) {
    throw new Error('Solicitação não encontrada');
  }

  return normalizeSolicitacao(solicitacao);
}

export async function update({ cod_sala, data, hora, status }: UpdateSolicitacaoDTO): Promise<Solicitacao> {
  if (!cod_sala || !data || !hora || !status) {
    throw new Error('Unable to update solicitacao');
  }

  const updated = await prisma.solicitacao.update({
    where: {
      cod_sala_data_hora: {
        cod_sala: Number(cod_sala),
        data,
        hora,
      },
    },
    data: { status },
  });

  return normalizeSolicitacao(updated);
}

export async function remove(cod_sala: number | string, data: string, hora: string): Promise<boolean> {
  if (!cod_sala || !data || !hora) {
    throw new Error('Unable to remove solicitacao');
  }

  await prisma.solicitacao.delete({
    where: {
      cod_sala_data_hora: {
        cod_sala: Number(cod_sala),
        data,
        hora,
      },
    },
  });

  return true;
}

export default { getSalas, create, read, readByKey, update, remove };
