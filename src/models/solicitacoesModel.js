import cuid from 'cuid';
import { solicitacoes } from '../data/solicitacoes.js';

function create({ id, sala, data, hora, finalidade, status }) {
  const solicitacao = {
    id: id || cuid(),
    sala,
    data,
    hora,
    finalidade: finalidade || '',
    status: status || 'Pendente',
  };

  if (sala && data && hora) {
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

function readById(id) {
  if (id) {
    const index = solicitacoes.findIndex((solicitacao) => String(solicitacao.id) === String(id));

    if (!solicitacoes[index]) {
      throw new Error('Solicitação não encontrada');
    }

    return solicitacoes[index];
  }

  throw new Error('Unable to find solicitacao');
}

function update({ id, status }) {
  if (id && status) {
    const index = solicitacoes.findIndex((solicitacao) => String(solicitacao.id) === String(id));

    if (!solicitacoes[index]) {
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

function remove(id) {
  if (id) {
    const index = solicitacoes.findIndex((solicitacao) => String(solicitacao.id) === String(id));

    if (index === -1) {
      throw new Error('Solicitação não encontrada');
    }

    solicitacoes.splice(index, 1);
    return true;
  }

  throw new Error('Unable to remove solicitacao');
}

export default { create, read, readById, update, remove };