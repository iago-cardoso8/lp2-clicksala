import { Request, Response, NextFunction } from 'express';
import solicitacoesModel from '../models/solicitacoesModel.js';
import HttpError from '../errors/HttpError.js';

export async function list(req: Request, res: Response, next: NextFunction) {
  try {
    const { field, value } = req.query as { field?: string; value?: string };
    const userId = Number((req as any).userId);

    if (!userId) {
      throw new HttpError(401, 'Não autorizado.');
    }

    const result = await solicitacoesModel.read(field, value, userId);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function getSalas(req: Request, res: Response, next: NextFunction) {
  try {
    const salas = await solicitacoesModel.getSalas();
    res.json(salas);
  } catch (error) {
    next(error);
  }
}

export async function getByKey(req: Request, res: Response, next: NextFunction) {
  try {
    const { cod_sala, data, hora } = req.params as unknown as { cod_sala: number; data: string; hora: string };
    const userId = Number((req as any).userId);

    if (!userId) {
      throw new HttpError(401, 'Não autorizado.');
    }

    const solicitacao = await solicitacoesModel.readByKey(cod_sala, data, hora, userId);
    res.json(solicitacao);
  } catch (error) {
    next(error);
  }
}

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const { cod_sala, sala, data, hora, finalidade } = req.body;
    const rawSala = cod_sala ?? sala;
    const userId = Number((req as any).userId);

    if (!userId) {
      throw new HttpError(401, 'Não autorizado.');
    }

    let normalizedCodSala: number | string = rawSala;
    const salas = await solicitacoesModel.getSalas();

    if (typeof rawSala === 'string') {
      const trimmedSala = rawSala.trim();
      if (/^\d+$/.test(trimmedSala)) {
        normalizedCodSala = Number(trimmedSala);
      } else {
        const salaEncontrada = salas.find(
          (item) => item.nome.toLowerCase() === trimmedSala.toLowerCase() ||
            `${item.nome} - ${item.bloco}`.toLowerCase() === trimmedSala.toLowerCase()
        );

        if (!salaEncontrada) {
          throw new HttpError(404, 'Sala não encontrada.');
        }

        normalizedCodSala = salaEncontrada.id;
      }
    }

    const salaExiste = salas.some((item) => item.id === Number(normalizedCodSala));
    if (!salaExiste) {
      throw new HttpError(404, 'Sala não encontrada.');
    }

    const novaSolicitacao = await solicitacoesModel.create({
      cod_sala: normalizedCodSala,
      data,
      hora,
      finalidade,
      id_user: userId,
    });
    return res.status(201).json(novaSolicitacao);
  } catch (erro) {
    next(erro);
  }
}

export async function update(req: Request, res: Response, next: NextFunction) {
  try {
    const { status } = req.body;
    const userId = Number((req as any).userId);

    if (!userId) {
      throw new HttpError(401, 'Não autorizado.');
    }

    const solicitacaoAtualizada = await solicitacoesModel.update({
      cod_sala: Number(req.params.cod_sala),
      data: req.params.data,
      hora: req.params.hora,
      status,
      id_user: userId,
    });

    res.json(solicitacaoAtualizada);
  } catch (error) {
    if (error instanceof Error && error.message === 'Solicitação não encontrada') {
      next(new HttpError(404, 'Solicitação não encontrada.'));
      return;
    }

    next(error);
  }
}

export async function remove(req: Request, res: Response, next: NextFunction) {
  try {
    const cod_sala = Number(req.params.cod_sala ?? req.body.cod_sala);
    const data = req.params.data ?? req.body.data;
    const hora = req.params.hora ?? req.body.hora;

    const userId = Number((req as any).userId);

    if (!userId) {
      throw new HttpError(401, 'Não autorizado.');
    }

    await solicitacoesModel.readByKey(cod_sala, data, hora, userId);
    await solicitacoesModel.remove(cod_sala, data, hora, userId);
    res.status(204).send();
  } catch (error) {
    if (error instanceof Error && error.message === 'Solicitação não encontrada') {
      next(new HttpError(404, 'Solicitação não encontrada.'));
      return;
    }

    next(error);
  }
}

export default { list, getSalas, getByKey, create, update, remove };
