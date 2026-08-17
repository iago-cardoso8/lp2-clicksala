import { createHmac, timingSafeEqual } from 'node:crypto';

const SECRET = process.env.JWT_SECRET || 'clicksala-secret-key-change-in-production';
const EXPIRATION_SECONDS = 60 * 60 * 24; // 24 horas

/**
 * Converte string ou Buffer para base64url
 */
function base64url(value: string | Buffer): string {
  return Buffer.from(value).toString('base64url');
}

/**
 * Decodifica e valida o JWT
 */
function parsePayload(token: string): { exp: number; sub: string } | null {
  try {
    const [header, payload, signature] = token.split('.');
    if (!header || !payload || !signature) {
      return null;
    }

    // Validar assinatura
    const expected = createHmac('sha256', SECRET).update(`${header}.${payload}`).digest();
    const signatureBuffer = Buffer.from(signature, 'base64url');

    if (signatureBuffer.length !== expected.length || !timingSafeEqual(expected, signatureBuffer)) {
      return null;
    }

    // Decodificar payload
    const decoded = JSON.parse(Buffer.from(payload, 'base64url').toString('utf-8'));
    
    if (!decoded.exp || !decoded.sub || typeof decoded.exp !== 'number' || typeof decoded.sub !== 'string') {
      return null;
    }

    return { exp: decoded.exp, sub: decoded.sub };
  } catch {
    return null;
  }
}

/**
 * Cria um JWT com informações do usuário
 */
export function createToken(payload: { sub: string; nome: string; email: string }): string {
  const header = base64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body = base64url(
    JSON.stringify({
      sub: payload.sub,
      nome: payload.nome,
      email: payload.email,
      iat: Math.floor(Date.now() / 1000), // Tempo de emissão
      exp: Math.floor(Date.now() / 1000) + EXPIRATION_SECONDS, // Tempo de expiração
    })
  );
  const signature = base64url(createHmac('sha256', SECRET).update(`${header}.${body}`).digest());
  return `${header}.${body}.${signature}`;
}

/**
 * Verifica se o token é válido e retorna o payload
 */
export function verifyToken(token: string): { exp: number; sub: string } | null {
  const payload = parsePayload(token);
  if (!payload) {
    return null;
  }

  // Verificar expiração
  if (payload.exp < Math.floor(Date.now() / 1000)) {
    return null;
  }

  return payload;
}
