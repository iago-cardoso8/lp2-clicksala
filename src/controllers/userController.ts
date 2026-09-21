import { Request, Response, NextFunction } from 'express';
import { readFile, unlink } from 'node:fs/promises';
import { prisma } from '../database/prismaClient.js';
import HttpError from '../errors/HttpError.js';

async function hasValidImageSignature(filePath: string, mimeType: string) {
  const bytes = await readFile(filePath);
  if (mimeType === 'image/png') {
    return bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  }

  if (mimeType === 'image/jpeg') {
    return bytes.subarray(0, 3).equals(Buffer.from([255, 216, 255]));
  }

  return bytes.subarray(0, 6).toString('ascii') === 'GIF87a' ||
    bytes.subarray(0, 6).toString('ascii') === 'GIF89a';
}

export async function uploadImage(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = Number((req as any).userId);
    if (!userId) {
      throw new HttpError(401, 'Não autorizado.');
    }

    if (!req.file) {
      throw new HttpError(400, 'Arquivo de imagem obrigatório.');
    }

    if (!(await hasValidImageSignature(req.file.path, req.file.mimetype))) {
      await unlink(req.file.path).catch(() => undefined);
      throw new HttpError(400, 'O conteúdo do arquivo não corresponde ao tipo de imagem informado.', 'image');
    }

    const publicUrl = `/uploads/${req.file.filename}`;

    await prisma.image.upsert({
      where: { userId },
      update: {
        filename: req.file.filename,
        mimeType: req.file.mimetype,
        size: req.file.size,
        publicUrl,
      },
      create: {
        filename: req.file.filename,
        mimeType: req.file.mimetype,
        size: req.file.size,
        publicUrl,
        userId,
      },
    });

    return res.status(201).json({
      message: 'Arquivo enviado com sucesso.',
      publicUrl,
    });
  } catch (error) {
    next(error);
  }
}

export async function updateImage(req: Request, res: Response, next: NextFunction) {
  return uploadImage(req, res, next);
}

export async function getImage(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = Number((req as any).userId);
    if (!userId) {
      throw new HttpError(401, 'Não autorizado.');
    }

    const image = await prisma.image.findUnique({ where: { userId } });
    if (!image) {
      return res.status(404).json({ error: 'Nenhuma imagem encontrada para este usuário.' });
    }

    return res.json({ publicUrl: image.publicUrl });
  } catch (error) {
    next(error);
  }
}

export default { uploadImage, updateImage, getImage };
