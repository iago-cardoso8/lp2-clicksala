import { solicitacoes } from '../data/solicitacoes.js';

function create({ cod_sala, data, hora, finalidade, status }) {
  const solicitacao = {
    cod_sala,
    data,
    hora,
    finalidade: finalidade || '',
    status: status || 'Pendente',
  };

  if (cod_sala && data && hora) {
    solicitacoes.push(solicitacao);
    return solicitacao;
  }

  throw new Error('Unable to create solicitacao');
}

function read(field, value) {
  if (field && value) {
    return solicitacoes.filter((solicitacao) =>
      String(solicitacao[field]).includes(value)
    );
  }

  return solicitacoes;
}

function readByKey(cod_sala, data, hora) {
  if (cod_sala && data && hora) {
    const solicitacao = solicitacoes.find(
      (s) => String(s.cod_sala) === String(cod_sala) && s.data === data && s.hora === hora
    );

    if (!solicitacao) {
      throw new Error('Solicitação não encontrada');
    }

    return solicitacao;
  }

  throw new Error('Unable to find solicitacao');
}

function update({ cod_sala, data, hora, status }) {
  if (cod_sala && data && hora && status) {
    const index = solicitacoes.findIndex(
      (s) => String(s.cod_sala) === String(cod_sala) && s.data === data && s.hora === hora
    );

    if (index === -1) {
      throw new Error('Solicitação não encontrada');
    }

    solicitacoes[index] = {
      ...solicitacoes[index],
      status,
    };

    return solicitacoes[index];
  }

  throw new Error('Unable to update solicitacao');
}

function remove(cod_sala, data, hora) {
  if (cod_sala && data && hora) {
    const index = solicitacoes.findIndex(
      (s) => String(s.cod_sala) === String(cod_sala) && s.data === data && s.hora === hora
    );

    if (index === -1) {
      throw new Error('Solicitação não encontrada');
    }

    solicitacoes.splice(index, 1);
    return true;
  }

  throw new Error('Unable to remove solicitacao');
}

export default { create, read, readByKey, update, remove };