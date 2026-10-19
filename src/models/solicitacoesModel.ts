import { prisma } from '../database/prismaClient.js';
import type { Prisma } from '@prisma/client';
import type { Sala, Solicitacao, CreateSolicitacaoDTO, UpdateSolicitacaoDTO } from '../types/entities.js';
import HttpError from '../errors/HttpError.js';
import { BLOCOS_HORARIOS, isHorarioFixo } from '../config/horarios.js';

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

function parseEquipment(value: string | null) {
  if (!value) return [];

  try {
    const equipment = JSON.parse(value);
    return Array.isArray(equipment) ? equipment : [];
  } catch {
    return [];
  }
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
    equipamento: parseEquipment(sala.equipamento),
  }));
}

export async function readApprovedForRoom(cod_sala: number, data?: string) {
  const approved = await prisma.solicitacao.findMany({
    where: { cod_sala, status: 'Aprovado', ...(data ? { data } : {}) },
    select: { cod_sala: true, data: true, hora: true },
  });

  if (!data) return approved;

  const fixed = BLOCOS_HORARIOS
    .filter((hora) => isHorarioFixo(cod_sala, data, hora))
    .map((hora) => ({ cod_sala, data, hora }));

  return [...approved, ...fixed];
}

export async function hasApproved(cod_sala: number, data: string, hora: string) {
  return Boolean(await prisma.solicitacao.findFirst({
    where: { cod_sala, data, hora, status: 'Aprovado' },
    select: { id: true },
  }));
}

export async function create({ cod_sala, data, hora, finalidade, id_user }: CreateSolicitacaoDTO): Promise<Solicitacao> {
  const normalizedCodSala = Number(cod_sala);

  if (isHorarioFixo(normalizedCodSala, data, hora)) {
    throw new HttpError(409, `O horário ${hora} já está reservado.`);
  }

  let solicitacao: PrismaSolicitacao;
  try {
    solicitacao = await prisma.$transaction(async (transaction) => {
      const existing = await transaction.solicitacao.findFirst({
        where: {
          cod_sala: normalizedCodSala,
          data,
          hora,
          id_user,
          status: { in: ['Pendente', 'Aprovado'] },
        },
      });

      if (existing) {
        throw new HttpError(409, 'Você já solicitou este horário.');
      }

      const approved = await transaction.solicitacao.findFirst({
        where: {
          cod_sala: normalizedCodSala,
          data,
          hora,
          status: 'Aprovado',
        },
      });

      if (approved) {
        throw new HttpError(409, 'Este horário já foi aprovado.');
      }

      return transaction.solicitacao.create({
        data: {
          cod_sala: normalizedCodSala,
          data,
          hora,
          finalidade: finalidade || '',
          status: 'Pendente',
          id_user,
        },
      });
    });
  } catch (error) {
    if ((error as { code?: string }).code === 'P2002') {
      throw new HttpError(409, 'Você já solicitou este horário.');
    }
    throw error;
  }

  return normalizeSolicitacao(solicitacao);
}

export async function read(field?: string, value?: string, id_user?: number): Promise<Solicitacao[]> {
  const where: Record<string, any> = {};

  if (field && value && allowedFields.has(field)) {
    if (field === 'cod_sala') {
      const codSala = Number(value);
      where.cod_sala = Number.isNaN(codSala) ? -1 : codSala;
    } else {
      where[field] = { contains: value };
    }
  }

  if (id_user !== undefined) {
    where.id_user = id_user;
  }

  const result = await prisma.solicitacao.findMany({ where });
  const toKey = (d: string) => d.split('/').reverse().join('-');
  result.sort((a, b) => toKey(a.data).localeCompare(toKey(b.data)) || a.hora.localeCompare(b.hora));

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

  if (id_user !== undefined) {
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

export async function update({ cod_sala, data, hora, status, id_user }: UpdateSolicitacaoDTO & { id_user: number }): Promise<Solicitacao> {
  const solicitacao = await prisma.solicitacao.findFirst({
    where: {
      cod_sala: Number(cod_sala),
      data,
      hora,
      id_user,
      status: 'Pendente',
    },
    orderBy: { id: 'desc' },
  });

  if (!solicitacao) {
    throw new Error('Solicitação não encontrada');
  }

  const updated = await prisma.solicitacao.update({
    where: { id: solicitacao.id },
    data: { status },
  });

  return normalizeSolicitacao(updated);
}

export async function remove(cod_sala: number | string, data: string, hora: string, id_user: number): Promise<boolean> {
  const deleted = await prisma.solicitacao.deleteMany({
    where: {
      cod_sala: Number(cod_sala),
      data,
      hora,
      id_user,
      status: 'Pendente',
    },
  });

  if (deleted.count === 0) {
    throw new Error('Solicitação não encontrada');
  }

  return true;
}

export async function readAll(filters: { status?: string; data?: string; hora?: string; nome?: string } = {}) {
  const result = await prisma.solicitacao.findMany({
    where: {
      ...(filters.status ? { status: filters.status } : {}),
      ...(filters.data ? { data: filters.data } : {}),
      ...(filters.hora ? { hora: filters.hora } : {}),
    },
    include: { usuario: { select: { nome: true, email: true } } },
  });

  const normalizedName = filters.nome?.toLocaleLowerCase('pt-BR');
  const filtered = normalizedName
    ? result.filter(({ usuario }) => usuario.nome.toLocaleLowerCase('pt-BR').includes(normalizedName))
    : result;

  return filtered.map(({ usuario, ...rest }) => ({ ...normalizeSolicitacao(rest), usuario }));
}

export async function updateStatusAdmin(cod_sala: number | string, data: string, hora: string, id: number, status: string) {
  return prisma.$transaction(async (transaction) => {
    const where = {
      id,
      cod_sala: Number(cod_sala),
      data,
      hora,
      status: 'Pendente',
    };
    const solicitacao = await transaction.solicitacao.findFirst({ where });

    if (!solicitacao) {
      throw new Error('Solicitação pendente não encontrada');
    }

    if (status === 'Aprovado') {
      const approved = await transaction.solicitacao.findFirst({
        where: {
          cod_sala: Number(cod_sala),
          data,
          hora,
          status: 'Aprovado',
          id: { not: id },
        },
      });

      if (approved) {
        throw new HttpError(409, 'Este horário já foi aprovado.');
      }

      const conflictingPending = await transaction.solicitacao.findMany({
        where: {
          cod_sala: Number(cod_sala),
          data,
          hora,
          status: 'Pendente',
          id: { not: id },
        },
        include: { usuario: { select: { nome: true, email: true } }, sala: { select: { nome: true, bloco: true } } },
      });

      await transaction.solicitacao.updateMany({
        where: {
          cod_sala: Number(cod_sala),
          data,
          hora,
          status: 'Pendente',
          id: { not: id },
        },
        data: { status: 'Rejeitado' },
      });

      const updated = await transaction.solicitacao.update({
        where: { id },
        data: { status },
        include: { usuario: { select: { nome: true, email: true } }, sala: { select: { nome: true, bloco: true } } },
      });

      return {
        solicitacao: { ...normalizeSolicitacao(updated), usuario: updated.usuario, sala: updated.sala },
        recusadas: conflictingPending,
      };
    }

    const updated = await transaction.solicitacao.update({
      where: { id },
      data: { status },
      include: { usuario: { select: { nome: true, email: true } }, sala: { select: { nome: true, bloco: true } } },
    });

    return {
      solicitacao: { ...normalizeSolicitacao(updated), usuario: updated.usuario, sala: updated.sala },
      recusadas: [],
    };
  });
}

export default { getSalas, readApprovedForRoom, hasApproved, create, read, readByKey, update, remove, readAll, updateStatusAdmin };
