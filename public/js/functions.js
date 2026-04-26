
import { listaSalas, horariosBaseOcupados, blocosHorarios, diasSemana } from './dados.js'


const BASE_URL = '/solicitacoes';

async function carregarSolicitacoes() {
  try {
    const res = await fetch(BASE_URL);
    if (!res.ok) {
      throw new Error("Erro ao buscar dados");
    }
    const dados = await res.json();
    atualizarListaMinhasSalas(dados);
  } catch (erro) {
    console.error(erro);
  }
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
             <td>${sala.nome}</td>
             <td>${sala.bloco}</td>
             <td>${sala.capacidade}</td>
             <td>${sala.equipamento.join(", ")}</td>
             <td>${sala.tipo}</td>
             <td class="actions-cell">
               <button class="btn btn-eye" data-action="ver" data-sala="${nomeCompleto}" title="Ver Horários">
                 <i class="fas fa-eye"></i>
               </button>
               <button class="btn btn-solicitar" data-action="solicitar" data-sala="${nomeCompleto}">
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
      .map((dia) => `<div class="schedule-header">${dia}</div>`)
      .join("")}
     `;
  blocosHorarios.forEach((blocoHora) => {
    html += `<div class="schedule-cell time-col">${blocoHora}</div>`;


    diasSemana.forEach((dia) => {
      const isReservedBase = horariosBaseOcupados.some(
        (reserva) =>
          reserva.sala === nomeSala &&
          reserva.diaSemana === dia &&
          reserva.hora === blocoHora
      );
      if (isReservedBase) {
        html += `<div class="schedule-cell reserved-slot" title="Horário Ocupado">Ocupado</div>`;
      } else {
        html += `<div class="schedule-cell" title="Horário Disponível">Disponível</div>`;
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


    let statusClass =
      item.status === "Pendente"
        ? "status-pendente"
        : "status-cancelado";
    let actionButton = "";


    if (item.status === "Pendente") {
      actionButton = `<button class="btn-lixeira" data-id="${item.id}" title="Cancelar Solicitação"><i class="fas fa-trash"></i></button>`;


    } else {
      actionButton = "---";
    }


    tr.innerHTML = `
               <td>${item.sala}</td>
               <td>${item.data}</td>
               <td>${item.hora}</td>
               <td><span class="status-badge ${statusClass}">${item.status}</span></td>
               <td>${actionButton}</td>
           `;
    tbody.appendChild(tr);
  });
}


async function cancelarAgendamento(id) {
  if (!confirm("Cancelar solicitação?")) return;


  try {
    const res = await fetch(`${BASE_URL}/${id}`, {
      method: "DELETE"
    });


    if (!res.ok) {
      throw new Error("Erro ao cancelar solicitação");
    }


    alert("Solicitação cancelada com sucesso!");


    carregarSolicitacoes();


  } catch (erro) {
    console.error(erro);
    alert("Erro ao cancelar solicitação.");
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

    // BLOQUEIA DOMINGO
    if (dataISO) {
        // Pega o dia da semana em português
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


    const id = btn.dataset.id; cancelarAgendamento(id);
  });
});


document.getElementById("form-solicitacao")
  .addEventListener("submit", async function (e) {
    e.preventDefault();


    const sala = document.getElementById("campo-sala").value;
    const dataISO = document.getElementById("campo-data").value;
    const hora = document.getElementById("campo-hora").value;
    const finalidade = document.getElementById("campo-finalidade").value;


    if (!sala || !dataISO || !hora) {
      alert("Preencha todos os campos obrigatórios.");
      return;
    }


    const dataFormatada = formatarData(dataISO);


    try {
      console.log("1. Tentando buscar agendamentos existentes...");
      const res = await fetch(BASE_URL);
      console.log("2. Resposta do servidor:", res.status);
      if (!res.ok) {
        throw new Error("Erro ao buscar agendamentos");
      }
      const agendamentos = await res.json();
      const conflitoUsuario = agendamentos.some(
        (agendamento) =>
          agendamento.data === dataFormatada &&
          agendamento.hora === hora &&
          agendamento.status === "Pendente"
      );


      if (conflitoUsuario) {
        alert("Você já possui um agendamento neste DIA e HORÁRIO.");
        return;
      }


      const mapaDias = ["DOMINGO", "SEGUNDA", "TERÇA", "QUARTA", "QUINTA", "SEXTA", "SÁBADO"];
      const diaDaSemana = mapaDias[new Date(dataISO).getDay()];


      const conflitoBase = horariosBaseOcupados.some(
        (reserva) =>
          reserva.sala === sala &&
          reserva.diaSemana === diaDaSemana &&
          reserva.hora === hora
      );


      if (conflitoBase) {
        alert(`ERRO: O horário ${hora} já está reservado.`);
        return;
      }


      const resPost = await fetch(BASE_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          sala,
          data: dataFormatada,
          hora,
          finalidade,
          status: "Pendente"
        })
      });

      console.log("3. POST enviado, resposta:", resPost.status);


      if (!resPost.ok) {
        throw new Error("Erro ao salvar solicitação");
      }


      alert("Solicitação realizada com sucesso!");
      limparFormulario();
      carregarSolicitacoes();
      showScreen("minhas-salas");
    } catch (erro) {
      console.error("Erro completo:", erro);
      console.error("Mensagem:", erro.message);
      alert("Erro: " + erro.message);
    }
  });
