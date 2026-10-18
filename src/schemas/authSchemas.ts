import { z } from 'zod';
import { emailSchema, nameSchema, passwordSchema } from '../config/security.js';

export const registerSchema = z.object({
  nome: nameSchema,
  email: emailSchema,
  password: passwordSchema,
}).strict();

export const loginSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  tipo: z.enum(['user', 'admin']).default('user'),
}).strict();