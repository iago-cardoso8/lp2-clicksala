import { Request, Response, NextFunction } from 'express';
import authModel from '../models/authModel.js';
import { hashPassword, verifyPassword } from '../utils/password.js';
import { createToken } from '../utils/token.js';
import HttpError from '../errors/HttpError.js';
import { validateEmail, validateName, validatePasswordStrength } from '../config/security.js';

export async function register(req: Request, res: Response, next: NextFunction) {
  try {
    const { nome, email, password } = req.body;

    // Validar entrada
    if (!nome || !email || !password) {
      throw new HttpError(400, 'Nome, email e senha são obrigatórios.');
    }

    // Validar nome
    const nameValidation = validateName(nome);
    if (!nameValidation.isValid) {
      throw new HttpError(400, nameValidation.error || 'Nome inválido.');
    }

    // Validar email
    const emailValidation = validateEmail(email);
    if (!emailValidation.isValid) {
      throw new HttpError(400, emailValidation.error || 'Email inválido.');
    }

    // Validar força da senha
    const passwordValidation = validatePasswordStrength(password);
    if (!passwordValidation.isValid) {
      throw new HttpError(400, passwordValidation.errors.join(' '));
    }

    // Verificar se email já existe
    const existingUser = await authModel.findByEmail(email.toLowerCase());
    if (existingUser) {
      throw new HttpError(409, 'Já existe um usuário cadastrado com esse email.');
    }

    // Criptografar senha com Argon2
    const hashedPassword = await hashPassword(password);
    const user = await authModel.createUser({ 
      nome: nome.trim(), 
      email: email.toLowerCase(), 
      senha: hashedPassword 
    });

    // Gerar token JWT
    const token = createToken({ sub: String(user.id), nome: user.nome, email: user.email });

    res.status(201).json({ 
      user: { id: user.id, nome: user.nome, email: user.email }, 
      token 
    });
  } catch (error) {
    next(error);
  }
}

export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, password } = req.body;

    // Validar entrada
    if (!email || !password) {
      throw new HttpError(400, 'Email e senha são obrigatórios.');
    }

    // Buscar usuário por email (case-insensitive)
    const user = await authModel.findByEmail(email.toLowerCase());
    if (!user || !user.senha) {
      // Mensagem genérica para não revelar se o email existe
      throw new HttpError(401, 'Email ou senha inválidos.');
    }

    // Verificar senha com Argon2
    const isValidPassword = await verifyPassword(password, user.senha);
    if (!isValidPassword) {
      throw new HttpError(401, 'Email ou senha inválidos.');
    }

    // Gerar token JWT
    const token = createToken({ sub: String(user.id), nome: user.nome, email: user.email });
    res.json({ 
      user: { id: user.id, nome: user.nome, email: user.email }, 
      token 
    });
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
