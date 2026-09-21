const API_BASE = '/auth';

export function setAuthState(user, token) {
  localStorage.removeItem('clicksala_token');
  localStorage.setItem('clicksala_user', JSON.stringify(user));
  localStorage.setItem('clicksala_authenticated', 'true');
}

export function clearAuthState() {
  localStorage.removeItem('clicksala_token');
  localStorage.removeItem('clicksala_user');
  localStorage.removeItem('clicksala_authenticated');
}

export function getAuthState() {
  const token = localStorage.getItem('clicksala_token') ||
    (localStorage.getItem('clicksala_authenticated') === 'true' ? 'cookie' : null);
  const user = localStorage.getItem('clicksala_user');
  return {
    token,
    user: user ? JSON.parse(user) : null,
  };
}

export function createAuthHeaders() {
  const { token } = getAuthState();
  return token && token !== 'cookie' ? { Authorization: `Bearer ${token}` } : {};
}

export async function uploadAvatar(file) {
  const formData = new FormData();
  formData.append('image', file);

  const response = await fetch('/api/users/image', {
    method: 'POST',
    headers: createAuthHeaders(),
    body: formData,
    credentials: 'same-origin',
  });

  const payload = await response.json().catch(() => ({ error: 'Erro ao enviar avatar.' }));
  if (!response.ok) {
    const error = new Error(payload.error || 'Erro ao enviar avatar.');
    error.details = payload.details || [];
    throw error;
  }

  return payload;
}

export async function login(email, password) {
  const res = await fetch(`${API_BASE}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
    credentials: 'same-origin',
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => null);
    const error = new Error(errorData?.error || 'Falha no login');
    error.details = errorData?.details || [];
    throw error;
  }

  return res.json();
}

export async function register(nome, email, password) {
  const res = await fetch(`${API_BASE}/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nome, email, password }),
    credentials: 'same-origin',
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => null);
    const error = new Error(errorData?.error || 'Falha no cadastro');
    error.details = errorData?.details || [];
    throw error;
  }

  return res.json();
}
