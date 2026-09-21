import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import multer from 'multer';
import HttpError from '../errors/HttpError.js';

const uploadRoot = path.resolve(process.cwd(), 'public', 'uploads');
fs.mkdirSync(uploadRoot, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, callback) => {
    callback(null, uploadRoot);
  },
  filename: (_req, file, callback) => {
    const extension = path.extname(file.originalname).toLowerCase();
    const generatedName = `${Date.now()}-${crypto.randomUUID()}${extension}`;
    callback(null, generatedName);
  },
});

const allowedMimeTypes = new Set(['image/jpeg', 'image/png', 'image/gif']);

const upload = multer({
  storage,
  limits: {
    fileSize: 2 * 1024 * 1024,
  },
  fileFilter: (_req, file, callback) => {
    if (!allowedMimeTypes.has(file.mimetype)) {
      return callback(new HttpError(400, 'Tipo de arquivo não permitido. Use apenas image/jpeg, image/png ou image/gif.'));
    }

    callback(null, true);
  },
});

export default upload;
