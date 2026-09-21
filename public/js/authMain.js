import { showScreen, showToast, carregarTabelaSalas, setMinDateOnForm, atualizarListaMinhasSalas, carregarSalas, carregarMinhasSalas } from './functions.js';
import { setAuthState, clearAuthState, getAuthState, createAuthHeaders, login, register, uploadAvatar } from './auth.js';

const sidebar = document.getElementById('sidebar');
const topBarUser = document.querySelector('.user-info');
const usernameLabel = document.querySelector('.username');
const btnLogout = document.getElementById('btn-logout');
const avatarHeader = document.getElementById('avatar-header');
const imageFile = document.getElementById('image-file');
const avatarPreview = document.getElementById('avatar-preview');
const uploadStatus = document.getElementById('upload-status');
const uploadErrors = document.getElementById('upload-errors');
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
  topBarUser.style.display = loggedIn ? 'flex' : 'none';
  usernameLabel.textContent = user?.nome ?? '';

  if (loggedIn) {
    const image = localStorage.getItem('clicksala_avatar') || '';
    if (image) {
      avatarHeader.src = image;
      avatarHeader.style.display = 'inline-block';
    }
  }

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

  try {
    const result = await login(email, password);
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

async function handleAvatarSubmit(event) {
  event.preventDefault();
  clearFormValidity(event.currentTarget);
  const file = imageFile.files?.[0];
  const errors = [];

  if (!file) {
    imageFile.setCustomValidity('Escolha uma imagem primeiro.');
    imageFile.reportValidity();
    uploadErrors.textContent = 'Escolha uma imagem primeiro.';
    showToast('Escolha uma imagem primeiro.');
    return;
  }

  if (file.size > 2 * 1024 * 1024) {
    errors.push('Arquivo maior que o limite de 2 MB.');
  }

  if (!['image/jpeg', 'image/png', 'image/gif'].includes(file.type)) {
    errors.push('Tipo de arquivo não permitido. Use JPEG, PNG ou GIF.');
  }

  if (errors.length > 0) {
    imageFile.setCustomValidity(errors.join(' '));
    imageFile.reportValidity();
    uploadErrors.textContent = errors.join(' ');
    showToast(errors.join(' '));
    return;
  }

  try {
    const result = await uploadAvatar(file);
    const src = result.publicUrl;
    localStorage.setItem('clicksala_avatar', src);
    avatarHeader.src = src;
    avatarHeader.style.display = 'inline-block';
    avatarPreview.src = src;
    avatarPreview.style.display = 'inline-block';
    uploadStatus.textContent = 'Avatar enviado com sucesso.';
    uploadErrors.textContent = '';
  } catch (error) {
    showApiErrors(event.currentTarget, error);
    uploadErrors.textContent = error.message || 'Erro ao enviar avatar.';
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
  clearAvatarState();
  updateAuthDisplay();
});

function clearAvatarState() {
  localStorage.removeItem('clicksala_avatar');
  if (avatarHeader) avatarHeader.style.display = 'none';
  if (avatarPreview) avatarPreview.style.display = 'none';
}

const formUploadAvatar = document.getElementById('form-upload-avatar');
if (formUploadAvatar) {
  formUploadAvatar.addEventListener('submit', handleAvatarSubmit);
}

showAuthScreenHandlers();
bindScreenLinks();
bindAuthForms();
updateAuthDisplay();
loadApp();
