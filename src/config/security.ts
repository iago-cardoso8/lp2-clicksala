import { z } from 'zod';
import { randomBytes } from 'node:crypto';

/**
 * Configurações de segurança da aplicação
 */

const configuredSecret = process.env.JWT_SECRET;
if (!configuredSecret && process.env.NODE_ENV === 'production') {
  throw new Error('JWT_SECRET deve ser configurado em produção.');
}

export const JWT_SECRET = configuredSecret || randomBytes(32).toString('hex');

export const SECURITY_CONFIG = {
  // JWT Configuration
  jwt: {
    secret: JWT_SECRET,
    expirationSeconds: 60 * 60 * 24, // 24 horas
  },

  // Argon2 Configuration
  argon2: {
    type: 2, // Argon2id
    memoryCost: 19 * 1024, // 19 MB
    timeCost: 2,
    parallelism: 1,
  },

  // Validação de Senha
  password: {
    minLength: 6,
    maxLength: 128,
    requireUpperCase: false,
    requireNumbers: false,
    requireSpecialChars: false,
  },

  // Validação de Email
  email: {
    maxLength: 255,
  },

  // Rate Limiting (para implementação futura)
  rateLimit: {
    loginAttempts: 5,
    loginWindowMinutes: 15,
  },
};

export const passwordSchema = z.string()
  .min(SECURITY_CONFIG.password.minLength, `Senha deve ter pelo menos ${SECURITY_CONFIG.password.minLength} caracteres.`)
  .max(SECURITY_CONFIG.password.maxLength, `Senha não pode ter mais de ${SECURITY_CONFIG.password.maxLength} caracteres.`);

export const emailSchema = z.string()
  .min(1, 'Email é obrigatório.')
  .max(SECURITY_CONFIG.email.maxLength, `Email não pode ter mais de ${SECURITY_CONFIG.email.maxLength} caracteres.`)
  .email('Email inválido.');

export const nameSchema = z.string()
  .min(1, 'Nome é obrigatório.')
  .trim()
  .min(3, 'Nome deve ter pelo menos 3 caracteres.')
  .max(100, 'Nome não pode ter mais de 100 caracteres.');
