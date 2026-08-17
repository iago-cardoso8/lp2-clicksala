const API_BASE = '/auth';

export function setAuthState(user, token) {
  localStorage.setItem('clicksala_token', token);
  localStorage.setItem('clicksala_user', JSON.stringify(user));
}

export function clearAuthState() {
  localStorage.removeItem('clicksala_token');
  localStorage.removeItem('clicksala_user');
}

export function getAuthState() {
  const token = localStorage.getItem('clicksala_token');
  const user = localStorage.getItem('clicksala_user');
  return {
    token,
    user: user ? JSON.parse(user) : null,
  };
}

export function createAuthHeaders() {
  const { token } = getAuthState();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function login(email, password) {
  const res = await fetch(`${API_BASE}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  if (!res.ok) {
    try {
      const errorData = await res.json();
      throw new Error(errorData.error || 'Falha no login');
    } catch (e) {
      throw new Error('Falha no login');
    }
  }

  return res.json();
}

export async function register(nome, email, password) {
  const res = await fetch(`${API_BASE}/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nome, email, password }),
  });

  if (!res.ok) {
    try {
      const errorData = await res.json();
      throw new Error(errorData.error || 'Falha no cadastro');
    } catch (e) {
      throw new Error('Falha no cadastro');
    }
  }

  return res.json();
}
