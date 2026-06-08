import { Request, Response, NextFunction } from 'express';
import HttpError from '../errors/HttpError.js';

export default function errorHandler(err: unknown, req: Request, res: Response, next: NextFunction) {
  if (err instanceof HttpError) {
    return res.status(err.status).json({ error: err.message });
  }

  if (err instanceof Error) {
    return res.status(500).json({ error: err.message });
  }

  // unknown non-Error
  const anyErr: any = err;
  if (anyErr && anyErr.message) {
    return res.status(anyErr.status || 500).json({ error: anyErr.message });
  }

  return res.status(500).json({ error: 'Internal Server Error' });
}
