import { Request, Response, NextFunction } from 'express';
import solicitacoesModel from '../models/solicitacoesModel.js';
import HttpError from '../errors/HttpError.js';

export async function list(req: Request, res: Response, next: NextFunction) {
  try {
    const { field, value } = req.query;
    const result = await solicitacoesModel.read(field as string, value as string);
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
    const { cod_sala, data, hora } = req.params;
    const solicitacao = await solicitacoesModel.readByKey(cod_sala, data, hora);
    res.json(solicitacao);
  } catch (error) {
    next(error);
  }
}

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const { cod_sala, sala, data, hora, finalidade } = req.body;
    const rawSala = cod_sala ?? sala;

    if (!rawSala || !data || !hora) {
      throw new HttpError(400, 'Os campos sala, data e hora são obrigatórios.');
    }

    let normalizedCodSala: number | string = rawSala;

    if (typeof rawSala === 'string') {
      const trimmedSala = rawSala.trim();
      if (/^\d+$/.test(trimmedSala)) {
        normalizedCodSala = Number(trimmedSala);
      } else {
        const salaEncontrada = (await solicitacoesModel.getSalas()).find(
          (item) => item.nome.toLowerCase() === trimmedSala.toLowerCase()
        );

        if (!salaEncontrada) {
          throw new HttpError(404, 'Sala não encontrada.');
        }

        normalizedCodSala = salaEncontrada.id;
      }
    }

    const conflito = (await solicitacoesModel.read()).some((s: any) =>
      Number(s.cod_sala) === Number(normalizedCodSala) &&
      s.data === data &&
      s.hora === hora &&
      s.status === 'Pendente'
    );

    if (conflito) {
      throw new HttpError(409, 'Já existe uma solicitação para essa sala neste dia e horário.');
    }

    const novaSolicitacao = await solicitacoesModel.create({
      cod_sala: normalizedCodSala,
      data,
      hora,
      finalidade,
    });
    return res.status(201).json(novaSolicitacao);
  } catch (erro) {
    next(erro);
  }
}

export async function update(req: Request, res: Response, next: NextFunction) {
  try {
    const { status } = req.body;
    if (!status) {
      throw new HttpError(400, 'O status é obrigatório.');
    }

    await solicitacoesModel.readByKey(req.params.cod_sala, req.params.data, req.params.hora);

    const solicitacaoAtualizada = await solicitacoesModel.update({
      cod_sala: req.params.cod_sala,
      data: req.params.data,
      hora: req.params.hora,
      status,
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
    const cod_sala = req.params.cod_sala ?? req.body?.cod_sala ?? req.query?.cod_sala;
    const data = req.params.data ?? req.body?.data ?? req.query?.data;
    const hora = req.params.hora ?? req.body?.hora ?? req.query?.hora;

    if (!cod_sala || !data || !hora) {
      throw new HttpError(400, 'Parâmetros cod_sala, data e hora são obrigatórios.');
    }

    await solicitacoesModel.readByKey(cod_sala, data, hora);
    await solicitacoesModel.remove(cod_sala, data, hora);
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
