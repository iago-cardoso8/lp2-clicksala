import { Request, Response, NextFunction } from 'express';
import solicitacoesModel from '../models/solicitacoesModel.js';
import HttpError from '../errors/HttpError.js';
import { prisma } from '../database/prismaClient.js';
import { sendRequestDecisionEmail } from '../services/emailService.js';
import { parseRoomSpreadsheet } from '../services/roomImportService.js';

function roomKey(nome: string, bloco: string) {
  return `${nome.trim().toLocaleLowerCase()}\u0000${bloco.trim().toLocaleLowerCase()}`;
}

function isUniqueConstraintError(error: unknown) {
  return Boolean(error && typeof error === 'object' && 'code' in error && error.code === 'P2002');
}

function duplicateRoomError(nome: string, bloco: string) {
  return new HttpError(409, `Já existe uma sala cadastrada com o nome ${nome} no bloco ${bloco}.`);
}

export async function listAll(req: Request, res: Response, next: NextFunction) {
  try {
    const filters = req.query as unknown as { status?: string; data?: string; hora?: string; nome?: string };
    res.json(await solicitacoesModel.readAll(filters));
  } catch (error) {
    next(error);
  }
}

export async function decide(req: Request, res: Response, next: NextFunction) {
  try {
    const { cod_sala, data, hora } = req.params as unknown as { cod_sala: number; data: string; hora: string };
    const { id, status } = req.body;
    const result = await solicitacoesModel.updateStatusAdmin(cod_sala, data, hora, id, status);
    const { solicitacao } = result;
    const sala = `${solicitacao.sala.nome} - ${solicitacao.sala.bloco}`;
    void sendRequestDecisionEmail(
      solicitacao.usuario.email,
      solicitacao.usuario.nome,
      sala,
      solicitacao.data,
      solicitacao.hora,
      status === 'Aprovado'
    ).catch((error) => console.error('Falha ao enviar e-mail de decisão:', error));

    for (const recusada of result.recusadas) {
      void sendRequestDecisionEmail(
        recusada.usuario.email,
        recusada.usuario.nome,
        `${recusada.sala.nome} - ${recusada.sala.bloco}`,
        recusada.data,
        recusada.hora,
        false
      ).catch((error) => console.error('Falha ao enviar e-mail de recusa:', error));
    }

    res.json(solicitacao);
  } catch (error) {
    if (error instanceof Error && error.message === 'Solicitação pendente não encontrada') {
      next(new HttpError(404, 'Solicitação pendente não encontrada.'));
      return;
    }
    next(error);
  }
}

export async function createRoom(req: Request, res: Response, next: NextFunction) {
  try {
    const { nome, bloco, tipo, capacidade, equipamento } = req.body;
    const rooms = await prisma.sala.findMany({ select: { nome: true, bloco: true } });
    if (rooms.some((room) => roomKey(room.nome, room.bloco) === roomKey(nome, bloco))) {
      throw duplicateRoomError(nome, bloco);
    }

    const sala = await prisma.sala.create({
      data: { nome, bloco, tipo, capacidade, equipamento: JSON.stringify(equipamento) },
    });
    res.status(201).json({ ...sala, equipamento });
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      next(duplicateRoomError(req.body.nome, req.body.bloco));
      return;
    }
    next(error);
  }
}

export async function importRooms(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.file) throw new HttpError(400, 'Envie uma planilha .xlsx ou .csv.', 'arquivo');
    const salas = await parseRoomSpreadsheet(req.file.buffer, req.file.originalname);
    if (!salas.length) throw new HttpError(400, 'A planilha não contém salas para importar.', 'arquivo');

    const existing = await prisma.sala.findMany({ select: { nome: true, bloco: true } });
    const existingKeys = new Set(existing.map(({ nome, bloco }) => roomKey(nome, bloco)));
    const repeated = salas.find(({ nome, bloco }) => existingKeys.has(roomKey(nome, bloco)));
    if (repeated) {
      throw duplicateRoomError(repeated.nome, repeated.bloco);
    }

    await prisma.sala.createMany({
      data: salas.map((sala) => ({ ...sala, equipamento: JSON.stringify(sala.equipamento) })),
    });
    res.status(201).json({ message: `${salas.length} sala(s) cadastrada(s).`, quantidade: salas.length });
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      next(new HttpError(409, 'Há uma sala duplicada neste arquivo. Confira o nome e o bloco de cada linha.'));
      return;
    }
    next(error);
  }
}

export default { listAll, decide, createRoom, importRooms };
