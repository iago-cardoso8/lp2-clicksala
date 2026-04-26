import { showScreen, carregarTabelaSalas, setMinDateOnForm, atualizarListaMinhasSalas } from './functions.js'
import { listaSalas } from './dados.js'


carregarTabelaSalas(listaSalas);
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
