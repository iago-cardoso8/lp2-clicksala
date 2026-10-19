import { readSheet } from 'read-excel-file/node';
import { parse as parseCsv } from 'csv-parse/sync';
import { createRoomSchema } from '../schemas/roomSchemas.js';
import HttpError from '../errors/HttpError.js';

type RoomImport = {
  nome: string;
  bloco: string;
  tipo: string;
  capacidade: number;
  equipamento: string[];
};

function normalizeHeader(value: string) {
  return value.trim().toLocaleLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function parseEquipment(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return [];
  try {
    const parsed = JSON.parse(trimmed);
    if (Array.isArray(parsed)) return parsed.map(String);
  } catch {
    // Equipment cells may also contain a simple comma- or semicolon-separated list.
  }
  return trimmed.split(/[,;|]/).map((item) => item.trim()).filter(Boolean);
}

function cellText(value: unknown) {
  if (value === null || value === undefined) return '';
  return String(value).trim();
}

export async function parseRoomSpreadsheet(buffer: Buffer, filename: string): Promise<RoomImport[]> {
  const extension = filename.split('.').pop()?.toLowerCase();
  let rows: unknown[][];

  try {
    if (extension === 'xlsx') {
      rows = await readSheet(buffer);
    } else if (extension === 'csv') {
      const csv = buffer.toString('utf8');
      const firstLine = csv.split(/\r?\n/, 1)[0];
      const delimiter = firstLine.split(';').length > firstLine.split(',').length ? ';' : ',';
      rows = parseCsv(csv, { delimiter, skip_empty_lines: true }) as unknown[][];
    } else {
      throw new HttpError(400, 'Formato inválido. Envie um arquivo .xlsx ou .csv.', 'arquivo');
    }
  } catch (error) {
    if (error instanceof HttpError) throw error;
    throw new HttpError(400, 'Não foi possível ler a planilha. Confira o formato do arquivo.', 'arquivo');
  }

  if (rows.length < 2) {
    throw new HttpError(400, 'A planilha precisa conter cabeçalho e pelo menos uma sala.', 'arquivo');
  }

  const headers = rows[0].map((value) => normalizeHeader(cellText(value)));
  const fields = ['nome', 'bloco', 'tipo', 'capacidade', 'equipamento'];
  const indexes = new Map(fields.map((field) => [field, headers.findIndex((header) => header === field || (field === 'equipamento' && header === 'equipamentos')) + 1]));
  const missing = fields.filter((field) => indexes.get(field) === 0);
  if (missing.length) {
    throw new HttpError(400, `Colunas obrigatórias ausentes: ${missing.join(', ')}.`, 'arquivo');
  }

  const rooms: RoomImport[] = [];
  const issues: string[] = [];
  rows.slice(1).forEach((row, index) => {
    if (row.every((value) => !cellText(value))) return;
    const rowNumber = index + 2;
    const get = (field: string) => cellText(row[indexes.get(field)! - 1]);
    const result = createRoomSchema.safeParse({
      nome: get('nome'),
      bloco: get('bloco'),
      tipo: get('tipo'),
      capacidade: Number(get('capacidade')),
      equipamento: parseEquipment(get('equipamento')),
    });

    if (!result.success) {
      issues.push(`Linha ${rowNumber}: ${result.error.issues.map((issue) => issue.message).join(' ')}`);
    } else {
      rooms.push(result.data);
    }
  });

  if (issues.length) throw new HttpError(400, issues.slice(0, 10).join(' '), 'arquivo');
  const keys = new Set<string>();
  for (const room of rooms) {
    const key = `${room.nome.toLocaleLowerCase()}|${room.bloco.toLocaleLowerCase()}`;
    if (keys.has(key)) throw new HttpError(400, `Sala duplicada na planilha: ${room.nome} - ${room.bloco}.`, 'arquivo');
    keys.add(key);
  }
  return rooms;
}