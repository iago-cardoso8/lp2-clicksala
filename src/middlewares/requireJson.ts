import { Request, Response, NextFunction } from 'express';
import HttpError from '../errors/HttpError.js';

export default function requireJson(req: Request, res: Response, next: NextFunction) {
  const contentType = req.headers['content-type'] ?? '';

  if ((req.method === 'POST' || req.method === 'PUT') && !contentType.includes('application/json')) {
    throw new HttpError(415, 'Content-Type must be application/json');
  }

  next();
}
