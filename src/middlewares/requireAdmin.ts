import { Request, Response, NextFunction } from 'express';
import authModel from '../models/authModel.js';
import HttpError from '../errors/HttpError.js';

export default async function requireAdmin(req: Request, _res: Response, next: NextFunction) {
  try {
    const userId = Number((req as any).userId);
    const user = userId ? await authModel.findById(userId) : null;

    if (!user || user.role !== 'admin') {
      throw new HttpError(403, 'Acesso restrito a administradores.');
    }

    next();
  } catch (error) {
    next(error);
  }
}
