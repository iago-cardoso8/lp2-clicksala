import { z } from 'zod';
import { BLOCOS_HORARIOS } from '../config/horarios.js';

function normalizeDate(value: string) {
  const iso = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  return iso ? `${iso[3]}/${iso[2]}/${iso[1]}` : value;
}

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
}).transform(normalizeDate);

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

export const ocupadosQuerySchema = z.object({
  cod_sala: roomIdSchema,
}).strict();

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

  const [day, month, year] = data.data.split('/').map(Number);
  const requestedDate = `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  const today = new Date();
  const todayDate = `${String(today.getFullYear()).padStart(4, '0')}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  if (requestedDate < todayDate) {
    context.addIssue({
      code: 'custom',
      path: ['data'],
      message: 'Não é permitido solicitar uma sala em uma data passada.',
    });
  }

  if (new Date(year, month - 1, day).getDay() === 0) {
    context.addIssue({
      code: 'custom',
      path: ['data'],
      message: 'Não é permitido solicitar uma sala aos domingos.',
    });
  }

  if (!BLOCOS_HORARIOS.includes(data.hora as (typeof BLOCOS_HORARIOS)[number])) {
    context.addIssue({
      code: 'custom',
      path: ['hora'],
      message: 'Horário não está entre os blocos disponíveis.',
    });
  } else if (requestedDate === todayDate) {
    const [horaFinal, minutoFinal] = data.hora.split(' - ')[1].split(':').map(Number);
    const agora = new Date();
    if (horaFinal * 60 + minutoFinal <= agora.getHours() * 60 + agora.getMinutes()) {
      context.addIssue({
        code: 'custom',
        path: ['hora'],
        message: 'Não é permitido solicitar um horário que já terminou.',
      });
    }
  }
});

export const updateSolicitacaoSchema = z.object({
  status: z.literal('Cancelado', { message: 'Usuários só podem cancelar suas solicitações.' }),
}).strict();

export const deleteSolicitacaoBodySchema = z.object({
  cod_sala: roomIdSchema,
  data: dateSchema,
  hora: timeSchema,
}).strict();

export const adminListSchema = z.object({
  status: z.enum(['Pendente', 'Aprovado', 'Rejeitado', 'Cancelado']).optional(),
});

export const adminDecisionSchema = z.object({
  id: z.coerce.number().int().positive('Solicitação inválida.'),
  status: z.enum(['Aprovado', 'Rejeitado'], { message: 'Status inválido.' }),
}).strict();