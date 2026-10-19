import { Request, Response, NextFunction } from 'express';
import HttpError from '../errors/HttpError.js';

export default function requireJson(req: Request, res: Response, next: NextFunction) {
  const contentType = req.headers['content-type'] ?? '';
  const isImageUpload = req.originalUrl.startsWith('/api/users/image');
  const isSpreadsheetUpload = req.originalUrl.startsWith('/admin/salas/importar');
  const isJson = contentType.includes('application/json');
  const isMultipart = contentType.includes('multipart/form-data');

  if ((req.method === 'POST' || req.method === 'PUT') && !isJson && !((isImageUpload || isSpreadsheetUpload) && isMultipart)) {
    return next(new HttpError(415, 'Content-Type must be application/json'));
  }

  next();
}
