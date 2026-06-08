import { Request, Response, NextFunction } from 'express';
import solicitacoesModel from '../models/solicitacoesModel.js';
import HttpError from '../errors/HttpError.js';

export async function list(req: Request, res: Response, next: NextFunction) {
  try {
    const { field, value } = req.query;
    const result = solicitacoesModel.read(field as string, value as string);
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
    const solicitacao = solicitacoesModel.readByKey(cod_sala, data, hora);
    res.json(solicitacao);
  } catch (error) {
    next(error);
  }
}

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const { cod_sala, data, hora, finalidade } = req.body;
    if (!cod_sala || !data || !hora) {
      throw new HttpError(400, 'Os campos sala, data e hora são obrigatórios.');
    }

    const conflito = solicitacoesModel.read().some((s: any) =>
      s.cod_sala === cod_sala &&
      s.data === data &&
      s.hora === hora &&
      s.status === 'Pendente'
    );

    if (conflito) {
      throw new HttpError(409, 'Já existe uma solicitação para essa sala neste dia e horário.');
    }

    const novaSolicitacao = solicitacoesModel.create({ cod_sala, data, hora, finalidade });
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

    const solicitacaoAtualizada = solicitacoesModel.update({
      cod_sala: req.params.cod_sala,
      data: req.params.data,
      hora: req.params.hora,
      status,
    });

    res.json(solicitacaoAtualizada);
  } catch (error) {
    next(error);
  }
}

export async function remove(req: Request, res: Response, next: NextFunction) {
  try {
    const { cod_sala, data, hora } = req.body.cod_sala ? req.body : req.query;

    if (!cod_sala || !data || !hora) {
      throw new HttpError(400, 'Parâmetros cod_sala, data e hora são obrigatórios.');
    }

    solicitacoesModel.remove(cod_sala, data, hora);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
}

export default { list, getSalas, getByKey, create, update, remove };
