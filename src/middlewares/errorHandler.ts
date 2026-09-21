import { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import { Prisma } from '@prisma/client';
import { ZodError } from 'zod';
import HttpError from '../errors/HttpError.js';

export default function errorHandler(err: unknown, req: Request, res: Response, next: NextFunction) {
  if (err instanceof ZodError) {
    return res.status(400).json({
      error: 'Dados inválidos.',
      details: err.issues.map((issue) => ({
        field: issue.path.join('.') || 'body',
        message: issue.message,
      })),
    });
  }

  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        error: 'Dados inválidos.',
        details: [{ field: err.field || 'image', message: 'Arquivo excede o limite de 2 MB.' }],
      });
    }

    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        error: 'Dados inválidos.',
        details: [{ field: err.field || 'image', message: 'Arquivo inesperado enviado.' }],
      });
    }

    return res.status(400).json({
      error: 'Dados inválidos.',
      details: [{ field: err.field || 'image', message: err.message }],
    });
  }

  if (err instanceof HttpError) {
    return res.status(err.status).json({
      error: err.message,
      ...(err.field ? { details: [{ field: err.field, message: err.message }] } : {}),
    });
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      return res.status(409).json({ error: 'Já existe um registro com esses dados.' });
    }

    if (err.code === 'P2025') {
      return res.status(404).json({ error: 'Registro não encontrado.' });
    }
  }

  if (err instanceof Error) {
    console.error(err);
    return res.status(500).json({ error: 'Erro interno do servidor.' });
  }

  const anyErr: any = err;
  if (anyErr && anyErr.message) {
    return res.status(anyErr.status || 500).json({ error: anyErr.message });
  }

  return res.status(500).json({ error: 'Internal Server Error' });
}
