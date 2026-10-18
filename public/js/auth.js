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

export async function login(email, password, tipo = 'user') {
  const res = await fetch(`${API_BASE}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, tipo }),
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
