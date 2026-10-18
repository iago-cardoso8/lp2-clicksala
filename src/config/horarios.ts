export const BLOCOS_HORARIOS = [
  '07:00 - 07:50',
  '07:50 - 08:40',
  '08:40 - 09:30',
  '09:50 - 10:40',
  '10:40 - 11:30',
  '11:30 - 12:20',
  '13:00 - 13:50',
  '13:50 - 14:40',
  '14:40 - 15:30',
  '15:50 - 16:40',
  '16:40 - 17:30',
  '17:30 - 18:20',
] as const;

export const HORARIOS_FIXOS = [
  { cod_sala: 1, diaSemana: 1, hora: '08:40 - 09:30' },
  { cod_sala: 1, diaSemana: 3, hora: '13:50 - 14:40' },
  { cod_sala: 4, diaSemana: 2, hora: '07:00 - 07:50' },
  { cod_sala: 6, diaSemana: 5, hora: '10:40 - 11:30' },
] as const;

export function isHorarioFixo(codSala: number, data: string, hora: string) {
  const [dia, mes, ano] = data.split('/').map(Number);
  const diaSemana = new Date(ano, mes - 1, dia).getDay();

  return HORARIOS_FIXOS.some((reserva) =>
    reserva.cod_sala === codSala && reserva.diaSemana === diaSemana && reserva.hora === hora
  );
}