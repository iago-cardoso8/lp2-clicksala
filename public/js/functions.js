
import { horariosBaseOcupados, blocosHorarios, diasSemana } from './dados.js'
import { createAuthHeaders } from './auth.js';

let listaSalas = [];
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
    return listaSalas;
  } catch (error) {
    console.error(error);
    showToast(error.message || 'Erro ao buscar salas.');
    return [];
  }
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
    document.getElementById("menu-solicitar").classList.add("active");
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


function verDetalhesSala(nomeSala) {
  showScreen("detalhe-sala");
  document.getElementById("titulo-detalhe-sala").innerText = nomeSala;
  document.getElementById("sala-exibida").innerText = nomeSala;
  const btn = document.getElementById("btn-solicitar-interno");
  btn.onclick = null;
  btn.addEventListener("click", () => {
    solicitarSala(nomeSala);
  });


  const gradeContainer = document.getElementById("grade-horarios");
  let html = `
         <div class="schedule-header">HORÁRIOS</div>
        ${diasSemana
      .map((dia) => `<div class="schedule-header">${escapeHtml(dia)}</div>`)
      .join("")}
     `;
  blocosHorarios.forEach((blocoHora) => {
    html += `<div class="schedule-cell time-col">${escapeHtml(blocoHora)}</div>`;


    diasSemana.forEach((dia) => {
      const isReservedBase = horariosBaseOcupados.some(
        (reserva) =>
          reserva.sala === nomeSala &&
          reserva.diaSemana === dia &&
          reserva.hora === blocoHora
      );
      if (isReservedBase) {
        html += '<div class="schedule-cell reserved-slot" title="Horário Ocupado">Ocupado</div>';
      } else {
        html += '<div class="schedule-cell" title="Horário Disponível">Disponível</div>';
      }
    });
  });
  gradeContainer.innerHTML = html;
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

    let statusClass =
      item.status === "Pendente"
        ? "status-pendente"
        : "status-cancelado";
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


function preencherHorarios() {
    const selectHora = document.getElementById("campo-hora");
    const campoData = document.getElementById("campo-data");
    const dataISO = campoData.value;

    if (dataISO) {
        const diasSemana = ["DOMINGO", "SEGUNDA", "TERÇA", "QUARTA", "QUINTA", "SEXTA", "SÁBADO"];
        const diaSemana = diasSemana[new Date(dataISO + "T00:00:00").getDay()];
        
        if (diaSemana === "DOMINGO") {
            alert("Não é permitido agendar aos domingos.");
            campoData.value = "";
            selectHora.innerHTML = '<option value="">Selecione a data primeiro...</option>';
            return;
        }
    }

    selectHora.innerHTML = '<option value="">Selecione...</option>';

    if (!dataISO) {
        blocosHorarios.forEach((hora) => {
            const option = document.createElement("option");
            option.value = hora;
            option.textContent = hora;
            selectHora.appendChild(option);
        });
        return;
    }

    const hoje = new Date();
    const [ano, mes, dia] = dataISO.split("-").map(Number);
    const dataSelecionada = new Date(ano, mes - 1, dia);
    const hojeSemHora = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());
    const dataSelecSemHora = new Date(dataSelecionada.getFullYear(), dataSelecionada.getMonth(), dataSelecionada.getDate());

    blocosHorarios.forEach((hora) => {
        const horaFinal = hora.split(" - ")[1];
        const [horaH, minH] = horaFinal.split(":").map(Number);
        const dataHoraFinal = new Date(dataSelecionada.getFullYear(), dataSelecionada.getMonth(), dataSelecionada.getDate(), horaH, minH);

        if (dataSelecSemHora.getTime() === hojeSemHora.getTime() && dataHoraFinal <= hoje) {
            return;
        }

        const option = document.createElement("option");
        option.value = hora;
        option.textContent = hora;
        selectHora.appendChild(option);
    });
}



document.addEventListener("DOMContentLoaded", () => {
  const campoData = document.getElementById("campo-data");
  campoData.addEventListener("change", preencherHorarios);
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
          agendamento.data === dataFormatada &&
          agendamento.hora === hora &&
          agendamento.status === "Pendente"
      );


      if (conflitoUsuario) {
        showToast("Você já possui um agendamento neste dia e horário.");
        return;
      }


      const mapaDias = ["DOMINGO", "SEGUNDA", "TERÇA", "QUARTA", "QUINTA", "SEXTA", "SÁBADO"];
      const diaDaSemana = mapaDias[new Date(dataISO).getDay()];


      const conflitoBase = horariosBaseOcupados.some(
        (reserva) =>
          reserva.sala === salaNome &&
          reserva.diaSemana === diaDaSemana &&
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
