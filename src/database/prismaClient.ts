import { PrismaClient } from '@prisma/client';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const dbFilePath = resolve(__dirname, '..', 'models', 'db.sqlite');

if (!existsSync(dbFilePath)) {
  mkdirSync(resolve(__dirname, '..', 'models'), { recursive: true });
  writeFileSync(dbFilePath, '');
}

const databaseUrl = process.env.DATABASE_URL ?? `file:${dbFilePath}`;

export const prisma = new PrismaClient({
  datasources: {
    db: {
      url: databaseUrl,
    },
  },
});
