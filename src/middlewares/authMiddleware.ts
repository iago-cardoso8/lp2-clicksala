import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/token.js';
import HttpError from '../errors/HttpError.js';

export default function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new HttpError(401, 'Token de autenticação não fornecido.');
  }

  const token = authHeader.slice('Bearer '.length);
  const payload = verifyToken(token);

  if (!payload) {
    throw new HttpError(401, 'Token inválido ou expirado.');
  }

  (req as any).userId = payload.sub;
  next();
}
