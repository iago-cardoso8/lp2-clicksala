export interface Sala {
  id: number;
  nome: string;
  bloco: string;
  tipo: string;
  capacidade: number;
  equipamento: unknown[];
}

export interface Solicitacao {
  cod_sala: number | string;
  data: string;
  hora: string;
  finalidade: string;
  status: string;
}

export interface CreateSolicitacaoDTO {
  cod_sala: number | string;
  data: string;
  hora: string;
  finalidade?: string;
  status?: string;
}

export interface UpdateSolicitacaoDTO {
  cod_sala: number | string;
  data: string;
  hora: string;
  status: string;
}
