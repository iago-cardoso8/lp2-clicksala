import multer from 'multer';
import path from 'node:path';
import HttpError from '../errors/HttpError.js';

const allowedExtensions = new Set(['.xlsx', '.csv']);

const spreadsheetUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, callback) => {
    if (!allowedExtensions.has(path.extname(file.originalname).toLowerCase())) {
      return callback(new HttpError(400, 'Envie uma planilha .xlsx ou .csv.', 'arquivo'));
    }
    callback(null, true);
  },
});

export default spreadsheetUpload;