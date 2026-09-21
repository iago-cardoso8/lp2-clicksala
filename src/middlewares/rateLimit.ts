import { Request, Response, NextFunction } from 'express';
import HttpError from '../errors/HttpError.js';
import { SECURITY_CONFIG } from '../config/security.js';

const attempts = new Map<string, { count: number; resetAt: number }>();
const WINDOW_MS = SECURITY_CONFIG.rateLimit.loginWindowMinutes * 60 * 1000;
const MAX_ATTEMPTS = SECURITY_CONFIG.rateLimit.loginAttempts;

export default function authRateLimit(req: Request, _res: Response, next: NextFunction) {
  const key = req.ip || req.socket.remoteAddress || 'unknown';
  const now = Date.now();
  const current = attempts.get(key);

  if (!current || current.resetAt <= now) {
    attempts.set(key, { count: 1, resetAt: now + WINDOW_MS });
    next();
    return;
  }

  if (current.count >= MAX_ATTEMPTS) {
    next(new HttpError(429, 'Muitas tentativas. Tente novamente mais tarde.'));
    return;
  }

  current.count += 1;
  next();
}