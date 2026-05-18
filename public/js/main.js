import { showScreen, carregarTabelaSalas, setMinDateOnForm, atualizarListaMinhasSalas, carregarSalas } from './functions.js'

async function init() {
  const salas = await carregarSalas();
  carregarTabelaSalas(salas);
}

init();
setMinDateOnForm();
atualizarListaMinhasSalas([]);


document.querySelectorAll(".menu-item").forEach((item) => {
  item.addEventListener("click", () => {
    const screen = item.dataset.screen;
    showScreen(screen);
  });
});


document.querySelectorAll(".link-screen").forEach((link) => {
  link.addEventListener("click", (e) => {
    e.preventDefault();
    showScreen(link.dataset.screen);
  });
});