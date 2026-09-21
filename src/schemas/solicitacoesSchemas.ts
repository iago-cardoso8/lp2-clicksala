import { z } from 'zod';

const dateSchema = z.string().superRefine((value, context) => {
  const match = value.match(/^(\d{2})\/(\d{2})\/(\d{4})$|^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) {
    context.addIssue({ code: 'custom', message: 'Data deve estar no formato DD/MM/AAAA ou AAAA-MM-DD.' });
    return;
  }

  const day = Number(match[1] || match[6]);
  const month = Number(match[2] || match[5]);
  const year = Number(match[3] || match[4]);
  const parsed = new Date(Date.UTC(year, month - 1, day));

  if (parsed.getUTCFullYear() !== year || parsed.getUTCMonth() !== month - 1 || parsed.getUTCDate() !== day) {
    context.addIssue({ code: 'custom', message: 'Data inválida.' });
  }
});

const timeSchema = z.string().superRefine((value, context) => {
  const match = value.match(/^(\d{2}):(\d{2}) - (\d{2}):(\d{2})$/);
  if (!match) {
    context.addIssue({ code: 'custom', message: 'Horário deve estar no formato HH:MM - HH:MM.' });
    return;
  }

  const start = Number(match[1]) * 60 + Number(match[2]);
  const end = Number(match[3]) * 60 + Number(match[4]);
  if ([match[1], match[3]].some((hour) => Number(hour) > 23) || [match[2], match[4]].some((minute) => Number(minute) > 59)) {
    context.addIssue({ code: 'custom', message: 'Horário inválido.' });
  } else if (end <= start) {
    context.addIssue({ code: 'custom', message: 'O horário final deve ser posterior ao inicial.' });
  }
});

const roomIdSchema = z.coerce.number().int().positive('Sala inválida.');

export const listSolicitacoesSchema = z.object({
  field: z.enum(['cod_sala', 'data', 'hora', 'finalidade', 'status']).optional(),
  value: z.string().trim().min(1, 'Valor de pesquisa obrigatório.').optional(),
}).superRefine((data, context) => {
  if (Boolean(data.field) !== Boolean(data.value)) {
    context.addIssue({
      code: 'custom',
      path: ['value'],
      message: 'field e value devem ser informados juntos.',
    });
  }
});

export const solicitacaoParamsSchema = z.object({
  cod_sala: roomIdSchema,
  data: dateSchema,
  hora: timeSchema,
}).strict();

export const createSolicitacaoSchema = z.object({
  cod_sala: roomIdSchema.optional(),
  sala: z.string().trim().min(1, 'Sala é obrigatória.').optional(),
  data: dateSchema,
  hora: timeSchema,
  finalidade: z.string().trim().max(800, 'Finalidade não pode ter mais de 800 caracteres.').optional().default(''),
}).strict().superRefine((data, context) => {
  if (data.cod_sala === undefined && data.sala === undefined) {
    context.addIssue({
      code: 'custom',
      path: ['sala'],
      message: 'Sala é obrigatória.',
    });
  }
});

export const updateSolicitacaoSchema = z.object({
  status: z.enum(['Pendente', 'Aprovado', 'Cancelado'], {
    message: 'Status inválido.',
  }),
}).strict();

export const deleteSolicitacaoBodySchema = z.object({
  cod_sala: roomIdSchema,
  data: dateSchema,
  hora: timeSchema,
}).strict();