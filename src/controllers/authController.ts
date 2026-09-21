import { Request, Response, NextFunction } from 'express';
import authModel from '../models/authModel.js';
import { hashPassword, verifyPassword } from '../utils/password.js';
import { createToken } from '../utils/token.js';
import HttpError from '../errors/HttpError.js';
import { sendWelcomeEmail } from '../services/emailService.js';

function setAuthCookie(res: Response, token: string) {
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  res.setHeader('Set-Cookie', `clicksala_token=${encodeURIComponent(token)}; HttpOnly; SameSite=Lax; Path=/; Max-Age=86400${secure}`);
}

export async function register(req: Request, res: Response, next: NextFunction) {
  try {
    const { nome, email, password } = req.body;

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

    void sendWelcomeEmail(user.email, user.nome).catch((error) => {
      console.error('Falha ao enviar e-mail de boas-vindas:', error);
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
    setAuthCookie(res, token);
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

export function logout(_req: Request, res: Response) {
  res.setHeader('Set-Cookie', 'clicksala_token=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0');
  res.status(204).send();
}

export default { register, login, me, logout };
