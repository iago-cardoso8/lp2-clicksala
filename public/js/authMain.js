import { showScreen, showToast, carregarTabelaSalas, setMinDateOnForm, atualizarListaMinhasSalas, carregarSalas, carregarMinhasSalas } from './functions.js';
import { setAuthState, clearAuthState, getAuthState, createAuthHeaders, login, register } from './auth.js';

const sidebar = document.getElementById('sidebar');
const topBarUser = document.querySelector('.user-info');
const usernameLabel = document.querySelector('.username');
const btnLogout = document.getElementById('btn-logout');
function clearFormValidity(form) {
  form.querySelectorAll('input').forEach((input) => input.setCustomValidity(''));
}

function showApiErrors(form, error) {
  const details = error.details || [];
  details.forEach(({ field, message }) => {
    const input = form.querySelector(`[name="${field}"]`);
    if (input) input.setCustomValidity(message);
  });

  const firstInvalid = form.querySelector(':invalid');
  if (firstInvalid) firstInvalid.reportValidity();
  showToast(details[0]?.message || error.message || 'Não foi possível concluir a operação.');
}

function updateAuthDisplay() {
  const { token, user } = getAuthState();
  const loggedIn = Boolean(token && user);

  sidebar.style.display = loggedIn ? 'block' : 'none';
  document.getElementById('menu-admin').style.display = user?.role === 'admin' ? 'block' : 'none';
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
  clearFormValidity(event.currentTarget);
  const email = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value.trim();
  const tipo = document.getElementById('login-tipo').value;

  try {
    const result = await login(email, password, tipo);
    setAuthState(result.user, result.token);
    updateAuthDisplay();
    await loadApp();
  } catch (error) {
    showApiErrors(event.currentTarget, error);
  }
}

async function handleRegister(event) {
  event.preventDefault();
  clearFormValidity(event.currentTarget);
  const nome = document.getElementById('register-nome').value.trim();
  const email = document.getElementById('register-email').value.trim();
  const password = document.getElementById('register-password').value.trim();

  try {
    await register(nome, email, password);
    showToast('Cadastro realizado com sucesso. Faça login para continuar.', 'success');
    showScreen('login');
  } catch (error) {
    showApiErrors(event.currentTarget, error);
  }
}

btnLogout.addEventListener('click', async () => {
  await fetch('/auth/logout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: '{}',
    credentials: 'same-origin',
  }).catch(() => undefined);
  clearAuthState();
  updateAuthDisplay();
});

showAuthScreenHandlers();
bindScreenLinks();
bindAuthForms();
updateAuthDisplay();
loadApp();
