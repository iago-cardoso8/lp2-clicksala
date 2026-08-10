import { Request, Response, NextFunction } from 'express';
import authModel from '../models/authModel.js';
import { hashPassword, verifyPassword } from '../utils/password.js';
import { createToken } from '../utils/token.js';
import HttpError from '../errors/HttpError.js';

export async function register(req: Request, res: Response, next: NextFunction) {
  try {
    const { nome, email, password } = req.body;

    if (!nome || !email || !password) {
      throw new HttpError(400, 'Nome, email e senha são obrigatórios.');
    }

    const existingUser = await authModel.findByEmail(email);
    if (existingUser) {
      throw new HttpError(409, 'Já existe um usuário cadastrado com esse email.');
    }

    const senha = hashPassword(password);
    const user = await authModel.createUser({ nome, email, senha });

    const token = createToken({ sub: String(user.id), nome: user.nome, email: user.email });

    res.status(201).json({ user: { id: user.id, nome: user.nome, email: user.email }, token });
  } catch (error) {
    next(error);
  }
}

export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      throw new HttpError(400, 'Email e senha são obrigatórios.');
    }

    const user = await authModel.findByEmail(email);
    if (!user || !user.senha || !verifyPassword(password, user.senha)) {
      throw new HttpError(401, 'Email ou senha inválidos.');
    }

    const token = createToken({ sub: String(user.id), nome: user.nome, email: user.email });
    res.json({ user: { id: user.id, nome: user.nome, email: user.email }, token });
  } catch (error) {
    next(error);
  }
}

export async function me(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = (req as any).userId;

    if (!userId) {
      throw new HttpError(401, 'Não autorizado.');
    }

    const user = await authModel.findById(Number(userId));
    if (!user) {
      throw new HttpError(404, 'Usuário não encontrado.');
    }

    res.json({ id: user.id, nome: user.nome, email: user.email });
  } catch (error) {
    next(error);
  }
}

export default { register, login, me };
