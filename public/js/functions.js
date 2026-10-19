
import { horariosBaseOcupados, blocosHorarios, diasSemana } from './dados.js'
import { createAuthHeaders } from './auth.js';

let listaSalas = [];
let salaDetalheSelecionada = null;
let deslocamentoSemana = 0;
let solicitacoesAprovadasSala = [];
let disponibilidadeRequestId = 0;
const BASE_URL = '/solicitacoes';

export function showToast(message, type = 'error') {
  const toast = document.getElementById('toast');
  if (!toast) return;

  toast.textContent = message;
  toast.className = `toast ${type}`;
  toast.hidden = false;
  window.clearTimeout(showToast.timeout);
  showToast.timeout = window.setTimeout(() => {
    toast.hidden = true;
  }, 4500);
}

function escapeHtml(value) {
  return String(value).replace(/[&<>'"]/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    "'": '&#39;',
    '"': '&quot;',
  })[character] || character);
}

async function getApiError(response, fallback) {
  const payload = await response.json().catch(() => null);
  return payload?.details?.[0]?.message || payload?.error || fallback;
}

export async function carregarSalas() {
  try {
    const res = await fetch(`${BASE_URL}/salas`);
    if (!res.ok) {
      throw new Error('Erro ao buscar salas');
    }

    listaSalas = await res.json();
    atualizarOpcoesSalasAdmin();
    return listaSalas;
  } catch (error) {
    console.error(error);
    showToast(error.message || 'Erro ao buscar salas.');
    return [];
  }
}

function atualizarOpcoesSalasAdmin() {
  const opcoesBlocos = document.getElementById('opcoes-blocos');
  const opcoesTipos = document.getElementById('opcoes-tipos-sala');
  if (!opcoesBlocos || !opcoesTipos) return;

  const blocos = [...new Set(listaSalas.map((sala) => sala.bloco.trim()).filter(Boolean))].sort();
  const tipos = [...new Set(listaSalas.map((sala) => sala.tipo.trim()).filter(Boolean))].sort();
  opcoesBlocos.replaceChildren(...blocos.map((bloco) => {
    const option = document.createElement('option');
    option.value = bloco;
    return option;
  }));
  opcoesTipos.replaceChildren(...tipos.map((tipo) => {
    const option = document.createElement('option');
    option.value = tipo;
    return option;
  }));
}

async function carregarSolicitacoes() {
  try {
    const res = await fetch(BASE_URL, {
      headers: createAuthHeaders(),
    });
    if (!res.ok) {
      throw new Error(await getApiError(res, 'Erro ao buscar dados.'));
    }
    const dados = await res.json();
    atualizarListaMinhasSalas(dados);
  } catch (erro) {
    console.error(erro);
    showToast(erro.message || 'Erro ao buscar dados.');
  }
}

export function carregarMinhasSalas() {
  return carregarSolicitacoes();
}

export function carregarTabelaSalas(salas) {
  const tbody = document.querySelector("#tabela-salas tbody");
  const selectSalas = document.getElementById("campo-sala");
  tbody.innerHTML = "";


  let existingOptions = Array.from(selectSalas.options).map(
    (o) => o.value
  );
  if (existingOptions.length === 0 || existingOptions[0] !== "") {
    selectSalas.innerHTML = '<option value="">Selecione...</option>';
  }


  salas.forEach((sala) => {
    const nomeCompleto = `${sala.nome} - ${sala.bloco}`;


    const tr = document.createElement("tr");
    tr.innerHTML = `
             <td>${escapeHtml(sala.nome)}</td>
             <td>${escapeHtml(sala.bloco)}</td>
             <td>${escapeHtml(sala.capacidade)}</td>
             <td>${escapeHtml(sala.equipamento.join(", "))}</td>
             <td>${escapeHtml(sala.tipo)}</td>
             <td class="actions-cell">
               <button class="btn btn-eye" data-action="ver" data-sala="${escapeHtml(nomeCompleto)}" title="Ver Horários">
                 <i class="fas fa-eye"></i>
               </button>
               <button class="btn btn-solicitar" data-action="solicitar" data-sala="${escapeHtml(nomeCompleto)}">
                 Solicitar
               </button>
             </td>
         `;
    tbody.appendChild(tr);
    if (!existingOptions.includes(nomeCompleto)) {
      const option = document.createElement("option");
      option.value = nomeCompleto;
      option.textContent = nomeCompleto;
      selectSalas.appendChild(option);
    }
  });
}


export function showScreen(screenId) {
  document
    .querySelectorAll(".screen")
    .forEach((s) => s.classList.remove("active"));
  document.getElementById(screenId).classList.add("active");
  document
    .querySelectorAll(".menu-item")
    .forEach((m) => m.classList.remove("active"));
  if (screenId === "ver-salas" || screenId === "detalhe-sala") {
    document.getElementById("menu-ver-salas").classList.add("active");
  }
  if (screenId === "minhas-salas") {
    document.getElementById("menu-minhas-salas").classList.add("active");
    carregarSolicitacoes();
  } else if (screenId === "solicitar") {
    setMinDateOnForm();
    document.getElementById("menu-solicitar").classList.add("active");
  } else if (screenId === "admin-solicitacoes") {
    document.getElementById("menu-admin-solicitacoes").classList.add("active");
    carregarAdmin();
  } else if (screenId === "admin-salas") {
    document.getElementById("menu-admin-salas").classList.add("active");
    carregarSalas();
  }
}

export async function carregarAdmin() {
  try {
    document.getElementById('titulo-resultados-admin').hidden = true;
    const salas = await carregarSalas();
    carregarTabelaSalas(salas);
    const res = await fetch('/admin/solicitacoes', { headers: createAuthHeaders() });
    if (!res.ok) {
      throw new Error(await getApiError(res, 'Erro ao buscar solicitações.'));
    }
    renderTabelaAdmin(await res.json());
    if (document.getElementById('detalhe-sala').classList.contains('active')) {
      await carregarGradeAprovados();
    }
  } catch (erro) {
    console.error(erro);
    showToast(erro.message || 'Erro ao buscar solicitações.');
  }
}

function dataDaSolicitacao(item) {
  const [dia, mes, ano] = item.data.split('/').map(Number);
  return new Date(ano, mes - 1, dia);
}

function horarioJaPassou(item, agora = new Date()) {
  const data = dataDaSolicitacao(item);
  const horaFinal = item.hora.split(' - ')[1];
  const [hora, minuto] = horaFinal.split(':').map(Number);
  data.setHours(hora, minuto, 0, 0);
  return data <= agora;
}

function ordenarDataDesc(lista) {
  return [...lista].sort((a, b) =>
    dataDaSolicitacao(b).getTime() - dataDaSolicitacao(a).getTime() || b.hora.localeCompare(a.hora)
  );
}

function ordenarPendentes(lista, passado) {
  return lista
    .filter((item) => horarioJaPassou(item) === passado)
    .sort((a, b) => a.id - b.id);
}

function criarLinhaAdmin(item, passada = false) {
  const sala = listaSalas.find((s) => s.id === item.cod_sala);
  const nomeSala = sala ? `${sala.nome} - ${sala.bloco}` : `Sala ${item.cod_sala}`;
  const statusClass = {
    Pendente: 'status-pendente',
    Aprovado: 'status-aprovado',
    Rejeitado: 'status-rejeitado',
  }[item.status] || 'status-cancelado';
  const dados = `data-id="${escapeHtml(item.id)}" data-cod-sala="${escapeHtml(item.cod_sala)}" data-data="${escapeHtml(item.data)}" data-hora="${escapeHtml(item.hora)}"`;
  const acoes = item.status === 'Pendente'
    ? `<button class="btn btn-solicitar" data-decisao="Aprovado" ${dados}>Aprovar</button>
       <button class="btn btn-danger" data-decisao="Rejeitado" ${dados}>Rejeitar</button>`
    : '---';

  const tr = document.createElement('tr');
  if (passada) tr.classList.add('admin-past-row');
  tr.innerHTML = `
    <td>${escapeHtml(item.usuario?.nome ?? '')}</td>
    <td>${escapeHtml(nomeSala)}</td>
    <td>${escapeHtml(item.data)}</td>
    <td>${escapeHtml(item.hora)}</td>
    <td>${escapeHtml(item.finalidade)}</td>
    <td><span class="status-badge ${statusClass}">${escapeHtml(item.status)}</span></td>
    <td class="actions-cell">${acoes}</td>
  `;
  return tr;
}

function renderTabelaAdmin(lista, resultadoBusca = false) {
  const tbody = document.querySelector('#tabela-admin tbody');
  const msg = document.getElementById('msg-admin-vazio');
  tbody.innerHTML = '';

  if (resultadoBusca) {
    msg.style.display = lista.length ? 'none' : 'block';
    msg.textContent = 'Nenhuma solicitação encontrada para esses filtros.';
    ordenarDataDesc(lista).forEach((item) => tbody.appendChild(criarLinhaAdmin(item, horarioJaPassou(item))));
    return;
  }

  const grupos = [
    { status: 'Pendente', titulo: 'Pendentes', itens: lista.filter((item) => item.status === 'Pendente') },
    { status: 'Aprovado', titulo: 'Aprovadas', itens: lista.filter((item) => item.status === 'Aprovado') },
    { status: 'Rejeitado', titulo: 'Recusadas', itens: lista.filter((item) => item.status === 'Rejeitado') },
  ];
  msg.style.display = grupos.some((grupo) => grupo.itens.length) ? 'none' : 'block';
  msg.textContent = 'Nenhuma solicitação encontrada.';

  grupos.forEach(({ status, titulo, itens }) => {
    const groupRow = document.createElement('tr');
    groupRow.className = `admin-group-row admin-group-${status.toLocaleLowerCase('pt-BR')}`;
    groupRow.innerHTML = `<th colspan="7" scope="colgroup">${titulo}<span class="admin-group-count">${itens.length}</span></th>`;
    tbody.appendChild(groupRow);

    const ordenados = status === 'Pendente'
      ? [...ordenarPendentes(itens, false), ...ordenarPendentes(itens, true)]
      : [...ordenarDataDesc(itens.filter((item) => !horarioJaPassou(item))), ...ordenarDataDesc(itens.filter((item) => horarioJaPassou(item)))];
    ordenados.forEach((item) => tbody.appendChild(criarLinhaAdmin(item, horarioJaPassou(item))));
  });
}

async function buscarAdmin(event) {
  event.preventDefault();
  const params = new URLSearchParams();
  const filtros = {
    status: document.getElementById('filtro-status-admin').value,
    data: document.getElementById('filtro-data-admin').value,
    hora: document.getElementById('filtro-hora-admin').value,
    nome: document.getElementById('filtro-nome-admin').value.trim(),
  };
  Object.entries(filtros).forEach(([chave, valor]) => {
    if (valor) params.set(chave, valor);
  });

  const titulo = document.getElementById('titulo-resultados-admin');
  titulo.hidden = false;
  renderTabelaAdmin([], true);
  try {
    const query = params.size ? `?${params}` : '';
    const response = await fetch(`/admin/solicitacoes${query}`, { headers: createAuthHeaders() });
    if (!response.ok) throw new Error(await getApiError(response, 'Erro ao buscar solicitações.'));
    renderTabelaAdmin(await response.json(), true);
  } catch (error) {
    console.error(error);
    showToast(error.message || 'Erro ao buscar solicitações.');
  }
}

function limparBuscaAdmin() {
  document.getElementById('form-busca-admin').reset();
  carregarAdmin();
}

async function decidirSolicitacao(id, cod_sala, data, hora, status) {
  try {
    const url = `/admin/solicitacoes/${encodeURIComponent(cod_sala)}/${encodeURIComponent(data)}/${encodeURIComponent(hora)}`;
    const res = await fetch(url, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...createAuthHeaders() },
      body: JSON.stringify({ id, status }),
    });

    if (!res.ok) {
      throw new Error(await getApiError(res, 'Erro ao atualizar solicitação.'));
    }

    showToast(`Solicitação ${status.toLowerCase()} com sucesso!`, 'success');
    await carregarAdmin();
    if (status === 'Aprovado') await carregarGradeAprovados();
  } catch (erro) {
    console.error(erro);
    showToast(erro.message || 'Erro ao atualizar solicitação.');
  }
}

function filtrarSalas() {
  const termo = document
    .getElementById("input-pesquisa-salas")
    .value.toLowerCase();
  const salasFiltradas = listaSalas.filter(
    (sala) =>
      sala.nome.toLowerCase().includes(termo) ||
      sala.bloco.toLowerCase().includes(termo) ||
      sala.tipo.toLowerCase().includes(termo)
  );
  carregarTabelaSalas(salasFiltradas);
}


async function verDetalhesSala(nomeSala) {
  showScreen("detalhe-sala");
  document.getElementById("titulo-detalhe-sala").innerText = nomeSala;
  document.getElementById("sala-exibida").innerText = nomeSala;
  const sala = listaSalas.find((item) => `${item.nome} - ${item.bloco}` === nomeSala);
  salaDetalheSelecionada = sala ? { id: sala.id, nome: nomeSala } : null;
  deslocamentoSemana = 0;
  const btn = document.getElementById("btn-solicitar-interno");
  btn.onclick = () => solicitarSala(nomeSala);
  await carregarGradeAprovados();
}

function formatarDataLocal(data) {
  return `${String(data.getDate()).padStart(2, '0')}/${String(data.getMonth() + 1).padStart(2, '0')}/${data.getFullYear()}`;
}

function obterDiasSemana(offset = deslocamentoSemana) {
  const hoje = new Date();
  const segunda = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());
  segunda.setDate(segunda.getDate() - ((segunda.getDay() + 6) % 7) + offset * 7);
  return Array.from({ length: 5 }, (_, index) => {
    const dia = new Date(segunda);
    dia.setDate(segunda.getDate() + index);
    return dia;
  });
}

function renderizarGradeSala() {
  if (!salaDetalheSelecionada) return;

  const dias = obterDiasSemana();
  const gradeContainer = document.getElementById("grade-horarios");
  const rotuloSemana = document.getElementById('semana-atual');
  rotuloSemana.textContent = `${formatarDataLocal(dias[0])} a ${formatarDataLocal(dias[4])}`;

  let html = '<div class="schedule-header">HORÁRIOS</div>';
  html += dias.map((data) => {
    const nomeDia = diasSemana[data.getDay() - 1];
    return `<div class="schedule-header">${escapeHtml(nomeDia)}<br>${escapeHtml(formatarDataLocal(data))}</div>`;
  }).join('');

  blocosHorarios.forEach((blocoHora) => {
    html += `<div class="schedule-cell time-col">${escapeHtml(blocoHora)}</div>`;
    dias.forEach((data) => {
      const dataFormatada = formatarDataLocal(data);
      const nomeDia = diasSemana[data.getDay() - 1];
      const isReservedBase = horariosBaseOcupados.some((reserva) =>
        reserva.sala === salaDetalheSelecionada.nome &&
        reserva.diaSemana === nomeDia &&
        reserva.hora === blocoHora
      );
      const isApproved = solicitacoesAprovadasSala.some((solicitacao) =>
        solicitacao.data === dataFormatada && solicitacao.hora === blocoHora
      );
      const isOccupied = isReservedBase || isApproved;
      html += isOccupied
        ? '<div class="schedule-cell reserved-slot" title="Horário Ocupado">Ocupado</div>'
        : '<div class="schedule-cell" title="Horário Disponível">Disponível</div>';
    });
  });

  gradeContainer.innerHTML = html;
}

async function carregarGradeAprovados() {
  if (!salaDetalheSelecionada) return;

  try {
    const response = await fetch(`${BASE_URL}/ocupados?cod_sala=${encodeURIComponent(salaDetalheSelecionada.id)}`, {
      headers: createAuthHeaders(),
    });
    if (!response.ok) {
      throw new Error(await getApiError(response, 'Erro ao buscar horários ocupados.'));
    }
    solicitacoesAprovadasSala = await response.json();
  } catch (error) {
    console.error(error);
    showToast(error.message || 'Erro ao buscar horários ocupados.');
    solicitacoesAprovadasSala = [];
  }

  renderizarGradeSala();
}


export function setMinDateOnForm() {
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, "0");
  const dd = String(today.getDate()).padStart(2, "0");
  const minDate = `${yyyy}-${mm}-${dd}`;
  document.getElementById("campo-data").setAttribute("min", minDate);
}


function solicitarSala(nomeSala) {
  showScreen("solicitar");
  document.getElementById("campo-sala").value = nomeSala;
  preencherHorarios();
}


function contarCaracteres() {
  document.getElementById("contador").innerText =
    document.getElementById("campo-finalidade").value.length;
}


function limparFormulario() {
  document.getElementById("form-solicitacao").reset();
  contarCaracteres();
  preencherHorarios();
}


export function atualizarListaMinhasSalas(lista) {
  const tbody = document.querySelector("#tabela-minhas-salas tbody");
  const msgVazio = document.getElementById("msg-vazio");


  tbody.innerHTML = "";


  if (!lista || lista.length === 0) {
    msgVazio.style.display = "block";
    return;
  }


  msgVazio.style.display = "none";


  lista.forEach((item) => {
    const tr = document.createElement("tr");

    const sala = listaSalas.find(s => s.id === item.cod_sala);
    const nomeSala = sala ? `${sala.nome} - ${sala.bloco}` : `Sala ${item.cod_sala}`;

    let statusClass = {
      Pendente: "status-pendente",
      Aprovado: "status-aprovado",
      Rejeitado: "status-rejeitado",
    }[item.status] || "status-cancelado";
    let actionButton = "";


    if (item.status === "Pendente") {
      actionButton = `<button class="btn-lixeira" data-cod-sala="${escapeHtml(item.cod_sala)}" data-data="${escapeHtml(item.data)}" data-hora="${escapeHtml(item.hora)}" title="Cancelar Solicitação"><i class="fas fa-trash"></i></button>`;


    } else {
      actionButton = "---";
    }


    tr.innerHTML = `
               <td>${escapeHtml(nomeSala)}</td>
               <td>${escapeHtml(item.data)}</td>
               <td>${escapeHtml(item.hora)}</td>
               <td><span class="status-badge ${escapeHtml(statusClass)}">${escapeHtml(item.status)}</span></td>
               <td>${actionButton}</td>
           `;
    tbody.appendChild(tr);
  });
}


async function cancelarAgendamento(cod_sala, data, hora) {
  if (!confirm("Cancelar solicitação?")) return;

  try {
    const res = await fetch(BASE_URL, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        ...createAuthHeaders(),
      },
      body: JSON.stringify({ cod_sala, data, hora })
    });

    if (!res.ok) {
      throw new Error(await getApiError(res, 'Erro ao cancelar solicitação.'));
    }

    showToast("Solicitação cancelada com sucesso!", 'success');
    carregarSolicitacoes();
  } catch (erro) {
    console.error(erro);
    showToast(erro.message || "Erro ao cancelar solicitação.");
  }
}


function formatarData(dataISO) {
  if (!dataISO) return "";
  const partes = dataISO.split("-");
  return `${partes[2]}/${partes[1]}/${partes[0]}`;
}

function diaDaSemana(dataISO) {
  const nomes = ["DOMINGO", "SEGUNDA", "TERÇA", "QUARTA", "QUINTA", "SEXTA", "SÁBADO"];
  return nomes[new Date(`${dataISO}T00:00:00`).getDay()];
}


async function preencherHorarios() {
  const selectHora = document.getElementById("campo-hora");
  const campoData = document.getElementById("campo-data");
  const dataISO = campoData.value;
  const salaSelecionada = listaSalas.find((sala) => `${sala.nome} - ${sala.bloco}` === document.getElementById('campo-sala').value);
  const requestId = ++disponibilidadeRequestId;

  selectHora.disabled = true;
  selectHora.innerHTML = '<option value="">Selecione sala e data primeiro...</option>';
  if (!dataISO || !salaSelecionada) return;

  if (diaDaSemana(dataISO) === "DOMINGO") {
    alert("Não é permitido agendar aos domingos.");
    campoData.value = "";
    selectHora.innerHTML = '<option value="">Selecione sala e data primeiro...</option>';
    return;
  }

  const hoje = new Date();
  const [ano, mes, dia] = dataISO.split("-").map(Number);
  const dataSelecionada = new Date(ano, mes - 1, dia);
  const hojeSemHora = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());
  const dataSelecSemHora = new Date(dataSelecionada.getFullYear(), dataSelecionada.getMonth(), dataSelecionada.getDate());

  let horariosAprovados = [];
  try {
    const params = new URLSearchParams({ cod_sala: salaSelecionada.id, data: formatarData(dataISO) });
    const response = await fetch(`${BASE_URL}/ocupados?${params}`, { headers: createAuthHeaders() });
    if (!response.ok) throw new Error(await getApiError(response, 'Erro ao buscar horários disponíveis.'));
    horariosAprovados = await response.json();
  } catch (error) {
    console.error('Erro ao buscar horários ocupados:', error);
    showToast(error.message || 'Erro ao buscar horários disponíveis.');
    return;
  }

  if (requestId !== disponibilidadeRequestId) return;
  selectHora.innerHTML = '<option value="">Selecione...</option>';
  let availableCount = 0;

  blocosHorarios.forEach((hora) => {
    const horaFinal = hora.split(" - ")[1];
    const [horaH, minH] = horaFinal.split(":").map(Number);
    const dataHoraFinal = new Date(dataSelecionada.getFullYear(), dataSelecionada.getMonth(), dataSelecionada.getDate(), horaH, minH);

    if (dataSelecSemHora.getTime() === hojeSemHora.getTime() && dataHoraFinal <= hoje) return;
    if (horariosAprovados.some((solicitacao) => solicitacao.hora === hora)) return;

    const option = document.createElement("option");
    option.value = hora;
    option.textContent = hora;
    selectHora.appendChild(option);
    availableCount += 1;
  });

  if (requestId !== disponibilidadeRequestId) return;
  selectHora.disabled = false;
  if (!availableCount) selectHora.innerHTML = '<option value="">Nenhum horário disponível</option>';
}



document.addEventListener("DOMContentLoaded", () => {
  const campoData = document.getElementById("campo-data");
  campoData.addEventListener("change", preencherHorarios);
  document.getElementById('campo-sala').addEventListener('change', preencherHorarios);
  document.getElementById('semana-anterior').addEventListener('click', () => {
    deslocamentoSemana -= 1;
    renderizarGradeSala();
  });
  document.getElementById('proxima-semana').addEventListener('click', () => {
    deslocamentoSemana += 1;
    renderizarGradeSala();
  });
  document.getElementById("btn-limpar")
    .addEventListener("click", limparFormulario);
  document.getElementById("input-pesquisa-salas")
    .addEventListener("keyup", filtrarSalas);
  document.getElementById("campo-finalidade")
    .addEventListener("input", contarCaracteres);



  const tabela = document.querySelector("#tabela-salas");


  tabela.addEventListener("click", (e) => {
    const botao = e.target.closest("button");
    if (!botao) return;


    const acao = botao.dataset.action;
    const sala = botao.dataset.sala;


    if (acao === "ver") {
      verDetalhesSala(sala);
    }


    if (acao === "solicitar") {
      solicitarSala(sala);
    }
  });
  const tabelaMinhas = document.querySelector("#tabela-minhas-salas");


  tabelaMinhas.addEventListener("click", (e) => {
    const btn = e.target.closest(".btn-lixeira");
    if (!btn) return;


    const codSala = btn.dataset.codSala;
    const data = btn.dataset.data;
    const hora = btn.dataset.hora;
    cancelarAgendamento(codSala, data, hora);
  });

  document.querySelector("#tabela-admin").addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-decisao]");
    if (!btn) return;
    decidirSolicitacao(btn.dataset.id, btn.dataset.codSala, btn.dataset.data, btn.dataset.hora, btn.dataset.decisao);
  });
  document.getElementById('form-busca-admin').addEventListener('submit', buscarAdmin);
  document.getElementById('limpar-busca-admin').addEventListener('click', limparBuscaAdmin);
});


document.getElementById("form-solicitacao")
  .addEventListener("submit", async function (e) {
    e.preventDefault();


    const salaNome = document.getElementById("campo-sala").value;
    const dataISO = document.getElementById("campo-data").value;
    const hora = document.getElementById("campo-hora").value;
    const finalidade = document.getElementById("campo-finalidade").value;


    if (!salaNome || !dataISO || !hora) {
      showToast("Preencha todos os campos obrigatórios.");
      return;
    }

    const sala = listaSalas.find(s => `${s.nome} - ${s.bloco}` === salaNome);
    if (!sala) {
      showToast("Sala não encontrada!");
      return;
    }

    const dataFormatada = formatarData(dataISO);


    try {
      console.log("1. Tentando buscar agendamentos existentes...");
      const res = await fetch(BASE_URL, {
        headers: {
          ...createAuthHeaders(),
        },
      });
      console.log("2. Resposta do servidor:", res.status);
      if (!res.ok) {
        throw new Error(await getApiError(res, "Erro ao buscar agendamentos."));
      }
      const agendamentos = await res.json();
      const conflitoUsuario = agendamentos.some(
        (agendamento) =>
          agendamento.cod_sala === sala.id &&
          agendamento.data === dataFormatada &&
          agendamento.hora === hora &&
          ["Pendente", "Aprovado"].includes(agendamento.status)
      );


      if (conflitoUsuario) {
        showToast("Você já solicitou este horário.");
        return;
      }


      const dia = diaDaSemana(dataISO);


      const conflitoBase = horariosBaseOcupados.some(
        (reserva) =>
          reserva.sala === salaNome &&
          reserva.diaSemana === dia &&
          reserva.hora === hora
      );


      if (conflitoBase) {
        showToast(`O horário ${hora} já está reservado.`);
        return;
      }


      const resPost = await fetch(BASE_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...createAuthHeaders(),
        },
        body: JSON.stringify({
          cod_sala: sala.id,
          data: dataFormatada,
          hora,
          finalidade
        })
      });

      console.log("3. POST enviado, resposta:", resPost.status);


      if (!resPost.ok) {
        throw new Error(await getApiError(resPost, "Erro ao salvar solicitação."));
      }


      showToast("Solicitação realizada com sucesso!", 'success');
      limparFormulario();
      carregarSolicitacoes();
      showScreen("minhas-salas");
    } catch (erro) {
      console.error("Erro completo:", erro);
      console.error("Mensagem:", erro.message);
      showToast(erro.message || "Erro ao salvar solicitação.");
    }
  });

document.getElementById('form-sala-admin').addEventListener('submit', async (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  const payload = {
    nome: document.getElementById('sala-nome').value.trim(),
    bloco: document.getElementById('sala-bloco').value.trim(),
    tipo: document.getElementById('sala-tipo').value.trim(),
    capacidade: Number(document.getElementById('sala-capacidade').value),
    equipamento: document.getElementById('sala-equipamentos').value.split(/[,;|]/).map((item) => item.trim()).filter(Boolean),
  };

  try {
    const response = await fetch('/admin/salas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...createAuthHeaders() },
      body: JSON.stringify(payload),
    });
    if (!response.ok) throw new Error(await getApiError(response, 'Erro ao cadastrar sala.'));
    form.reset();
    await carregarSalas().then(carregarTabelaSalas);
    showToast('Sala cadastrada com sucesso.', 'success');
  } catch (error) {
    showToast(error.message || 'Erro ao cadastrar sala.');
  }
});

document.getElementById('form-importar-salas').addEventListener('submit', async (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  const formData = new FormData(form);

  try {
    const response = await fetch('/admin/salas/importar', {
      method: 'POST',
      headers: createAuthHeaders(),
      body: formData,
    });
    if (!response.ok) throw new Error(await getApiError(response, 'Erro ao importar salas.'));
    const result = await response.json();
    form.reset();
    await carregarSalas().then(carregarTabelaSalas);
    showToast(result.message, 'success');
  } catch (error) {
    showToast(error.message || 'Erro ao importar salas.');
  }
});

document.getElementById('btn-modelo-salas').addEventListener('click', () => {
  const csv = 'nome,bloco,tipo,capacidade,equipamento\nSala exemplo,Bloco 1,Laboratório,30,"Projetor, Computador"\n';
  const url = URL.createObjectURL(new Blob(['\uFEFF', csv], { type: 'text/csv;charset=utf-8' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = 'modelo-salas.csv';
  link.click();
  URL.revokeObjectURL(url);
});
