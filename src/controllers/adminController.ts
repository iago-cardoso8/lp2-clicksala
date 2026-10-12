import { Request, Response, NextFunction } from 'express';
import solicitacoesModel from '../models/solicitacoesModel.js';
import HttpError from '../errors/HttpError.js';

export async function listAll(req: Request, res: Response, next: NextFunction) {
  try {
    const status = req.query.status as string | undefined;
    res.json(await solicitacoesModel.readAll(status));
  } catch (error) {
    next(error);
  }
}

export async function decide(req: Request, res: Response, next: NextFunction) {
  try {
    const { cod_sala, data, hora } = req.params as unknown as { cod_sala: number; data: string; hora: string };
    const { status } = req.body;
    res.json(await solicitacoesModel.updateStatusAdmin(cod_sala, data, hora, status));
  } catch (error) {
    if (error instanceof Error && error.message === 'Solicitação pendente não encontrada') {
      next(new HttpError(404, 'Solicitação pendente não encontrada.'));
      return;
    }
    next(error);
  }
}

export default { listAll, decide };
