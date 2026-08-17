import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/token.js';
import HttpError from '../errors/HttpError.js';

/**
 * Middleware de autenticação que verifica o token JWT
 * Espera o token no header: Authorization: Bearer <token>
 */
export default function authMiddleware(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new HttpError(401, 'Token de autenticação não fornecido.');
    }

    const token = authHeader.slice('Bearer '.length);
    const payload = verifyToken(token);

    if (!payload || !payload.sub) {
      throw new HttpError(401, 'Token inválido ou expirado.');
    }

    // Armazenar userId no objeto request para uso em controllers
    (req as any).userId = payload.sub;
    next();
  } catch (error) {
    if (error instanceof HttpError) {
      next(error);
    } else {
      next(new HttpError(401, 'Erro ao validar token.'));
    }
  }
}
