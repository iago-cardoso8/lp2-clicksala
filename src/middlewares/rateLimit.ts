import { Request, Response, NextFunction } from 'express';
import HttpError from '../errors/HttpError.js';
import { SECURITY_CONFIG } from '../config/security.js';

const attempts = new Map<string, { count: number; resetAt: number }>();
const WINDOW_MS = SECURITY_CONFIG.rateLimit.loginWindowMinutes * 60 * 1000;
const MAX_ATTEMPTS = SECURITY_CONFIG.rateLimit.loginAttempts;

export default function authRateLimit(req: Request, res: Response, next: NextFunction) {
  const clientIp = req.ip || req.socket.remoteAddress || 'unknown';
  const now = Date.now();
  const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
  const key = `${clientIp}:${email}`;

  for (const [entryKey, entry] of attempts) {
    if (entry.resetAt <= now) attempts.delete(entryKey);
  }

  const current = attempts.get(key);

  if (current && current.count >= MAX_ATTEMPTS) {
    next(new HttpError(429, 'Muitas tentativas. Tente novamente mais tarde.'));
    return;
  }

  res.once('finish', () => {
    const finishedAt = Date.now();
    const latest = attempts.get(key);

    if (res.statusCode < 400) {
      attempts.delete(key);
      return;
    }

    if (!latest || latest.resetAt <= finishedAt) {
      attempts.set(key, { count: 1, resetAt: finishedAt + WINDOW_MS });
      return;
    }

    latest.count += 1;
  });

  next();
}