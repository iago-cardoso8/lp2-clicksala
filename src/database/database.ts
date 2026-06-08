import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const dbFile = resolve(__dirname, 'db.sqlite');

function parseParams(params: any = []) {
  return Array.isArray(params) ? params : [params];
}

function parseRow(row: any) {
  return row ? { ...row } : row;
}

function createPromiseDatabase(database: any) {
  return {
    async run(sql: string, params?: any) {
      const result = database.prepare(sql).run(...parseParams(params));

      return {
        changes: result.changes,
        lastID: Number(result.lastInsertRowid),
      };
    },

    async get(sql: string, params?: any) {
      return parseRow(database.prepare(sql).get(...parseParams(params)));
    },

    async all(sql: string, params?: any) {
      return database.prepare(sql).all(...parseParams(params)).map(parseRow);
    },

    async close() {
      database.close();
    },
  };
}

export async function connect() {
  // lazy require to keep compatibility
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { DatabaseSync: DB } = await import('node:sqlite');
  return createPromiseDatabase(new (DB as any)(dbFile));
}

export default { connect };
