import { z } from 'zod';

export const imageUploadSchema = z.object({
  mimetype: z.enum(['image/jpeg', 'image/png', 'image/gif']),
  size: z.number().max(2 * 1024 * 1024, 'Arquivo excede o limite de 2 MB.'),
}).passthrough();