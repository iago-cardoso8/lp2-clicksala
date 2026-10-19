import { z } from 'zod';

function capitalizeInitial(value: string) {
  const normalized = value.trim().normalize('NFC').toLocaleLowerCase('pt-BR');
  const [initial, ...rest] = Array.from(normalized);
  return initial ? `${initial.toLocaleUpperCase('pt-BR')}${rest.join('')}` : normalized;
}

export const createRoomSchema = z.object({
  nome: z.string().trim().min(1, 'Nome da sala é obrigatório.').max(40),
  bloco: z.string().trim().min(1, 'Bloco é obrigatório.').max(40),
  tipo: z.string().trim().min(1, 'Tipo é obrigatório.').max(40),
  capacidade: z.number().int().positive('Capacidade deve ser maior que zero.'),
  equipamento: z.array(z.string().trim().min(1)).default([]),
}).strict().transform((sala) => ({
  ...sala,
  nome: sala.nome.toLocaleUpperCase('pt-BR'),
  bloco: sala.bloco.toLocaleUpperCase('pt-BR'),
  tipo: capitalizeInitial(sala.tipo),
  equipamento: sala.equipamento.map((item, index) => index === 0 ? capitalizeInitial(item) : item),
}));