import { PrismaClient } from '@prisma/client';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

const projectRoot = process.cwd();
const dbFilePath = resolve(projectRoot, 'src', 'database', 'db.sqlite');

if (!existsSync(dbFilePath)) {
  mkdirSync(dirname(dbFilePath), { recursive: true });
  writeFileSync(dbFilePath, '');
}

function resolveDatabaseUrl(rawUrl?: string) {
  if (!rawUrl) {
    return `file:${dbFilePath}`;
  }

  if (!rawUrl.startsWith('file:')) {
    return rawUrl;
  }

  const relativePath = rawUrl.slice('file:'.length);

  if (!relativePath || relativePath.startsWith('/')) {
    return rawUrl;
  }

  return `file:${resolve(projectRoot, relativePath)}`;
}

const databaseUrl = resolveDatabaseUrl(process.env.DATABASE_URL);

console.log(`📦 Banco de dados: ${databaseUrl}`);

export const prisma = new PrismaClient({
  datasources: {
    db: {
      url: databaseUrl,
    },
  },
});