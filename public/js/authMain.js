import { showScreen, carregarTabelaSalas, setMinDateOnForm, atualizarListaMinhasSalas, carregarSalas, carregarMinhasSalas } from './functions.js';
import { setAuthState, clearAuthState, getAuthState, createAuthHeaders, login, register } from './auth.js';

const sidebar = document.getElementById('sidebar');
const topBarUser = document.querySelector('.user-info');
const usernameLabel = document.querySelector('.username');
const btnLogout = document.getElementById('btn-logout');

function updateAuthDisplay() {
  const { token, user } = getAuthState();
  const loggedIn = Boolean(token && user);

  sidebar.style.display = loggedIn ? 'block' : 'none';
  topBarUser.style.display = loggedIn ? 'flex' : 'none';
  usernameLabel.textContent = user?.nome ?? '';

  if (!loggedIn) {
    showScreen('login');
    return;
  }

  showScreen('ver-salas');
}

async function loadApp() {
  const { token } = getAuthState();

  if (!token) {
    return;
  }

  const salas = await carregarSalas();
  carregarTabelaSalas(salas);
  await carregarMinhasSalas();
}

function bindScreenLinks() {
  document.querySelectorAll('.menu-item').forEach((item) => {
    item.addEventListener('click', () => {
      const screen = item.dataset.screen;
      showScreen(screen);
    });
  });

  document.querySelectorAll('.link-screen').forEach((link) => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      showScreen(link.dataset.screen);
    });
  });
}

function showAuthScreenHandlers() {
  document.getElementById('btn-show-register').addEventListener('click', () => showScreen('register'));
  document.getElementById('btn-show-login').addEventListener('click', () => showScreen('login'));
}

function bindAuthForms() {
  const loginForm = document.getElementById('form-login');
  const registerForm = document.getElementById('form-register');

  if (loginForm) {
    loginForm.addEventListener('submit', handleLogin);
  }

  if (registerForm) {
    registerForm.addEventListener('submit', handleRegister);
  }
}

async function handleLogin(event) {
  event.preventDefault();
  const email = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value.trim();

  try {
    const result = await login(email, password);
    setAuthState(result.user, result.token);
    updateAuthDisplay();
    await loadApp();
  } catch (error) {
    alert(error.message || 'Erro ao realizar login.');
  }
}

async function handleRegister(event) {
  event.preventDefault();
  const nome = document.getElementById('register-nome').value.trim();
  const email = document.getElementById('register-email').value.trim();
  const password = document.getElementById('register-password').value.trim();

  try {
    await register(nome, email, password);
    alert('Cadastro realizado com sucesso. Faça login para continuar.');
    showScreen('login');
  } catch (error) {
    alert(error.message || 'Erro ao realizar cadastro.');
  }
}

btnLogout.addEventListener('click', () => {
  clearAuthState();
  updateAuthDisplay();
});

showAuthScreenHandlers();
bindScreenLinks();
bindAuthForms();
updateAuthDisplay();
loadApp();
