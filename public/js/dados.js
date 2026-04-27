export const listaSalas = [
  { nome: "SALA 1", bloco: "UA1", capacidade: 40, tipo: "Comum", equipamento: ["Projetor", "lousa"] },
  { nome: "SALA 2", bloco: "UA1", capacidade: 40, tipo: "Comum", equipamento: ["Projetor", "lousa"] },
  { nome: "SALA 22", bloco: "UA1", capacidade: 20, tipo: "Comum", equipamento: ["Projetor", "lousa"] },
  { nome: "LAB INFO 9", bloco: "UA2", capacidade: 20, tipo: "Laboratório", equipamento: ["Projetor", "lousa", "computadores"] },
  { nome: "SALA 102", bloco: "UAG ", capacidade: 35, tipo: "Comum", equipamento: ["Projetor", "lousa"] },
  { nome: "LAB INFO 1", bloco: "UA2", capacidade: 25, tipo: "Laboratório", equipamento: ["Projetor", "lousa", "computadores"] },
  { nome: "Auditório UAG", bloco: "UAG", capacidade: 30, tipo: "Auditório", equipamento: ["Projetor", "lousa", "microfone"] },
  { nome: "SALA 4", bloco: "UA1", capacidade: 40, tipo: "Comum", equipamento: ["Projetor", "lousa"] },
  { nome: "SALA 5", bloco: "UA1", capacidade: 20, tipo: "Comum", equipamento: ["Projetor", "lousa"] },
  { nome: "SALA 6", bloco: "UA1", capacidade: 60, tipo: "Auditório", equipamento: ["Projetor", "lousa", "microfone"] },
];


export const horariosBaseOcupados = [
  { sala: "SALA 1 - UA1", diaSemana: "SEGUNDA", hora: "08:40 - 09:30" },
  { sala: "SALA 1 - UA1", diaSemana: "QUARTA", hora: "13:50 - 14:40" },
  { sala: "LAB INFO 9 - UA2", diaSemana: "TERÇA", hora: "07:00 - 07:50" },
  { sala: "LAB INFO 1 - UA2", diaSemana: "SEXTA", hora: "10:40 - 11:30" },
];


export const blocosHorarios = [
  "07:00 - 07:50",
  "07:50 - 08:40",
  "08:40 - 09:30",
  "09:50 - 10:40",
  "10:40 - 11:30",
  "11:30 - 12:20",
  "13:00 - 13:50",
  "13:50 - 14:40",
  "14:40 - 15:30",
  "15:50 - 16:40",
  "16:40 - 17:30",
  "17:30 - 18:20",
];


export const diasSemana = ["SEGUNDA", "TERÇA", "QUARTA", "QUINTA", "SEXTA"];

export const solicitacoes = [
 { id: "1", sala: 'SALA 1', data: '2026-10-01', hora: '14:00', finalidade: 'Aula' }
];
