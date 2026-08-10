import { createHmac, timingSafeEqual } from 'node:crypto';

const SECRET = process.env.JWT_SECRET || 'clicksala-secret';
const EXPIRATION_SECONDS = 60 * 60 * 24;

function base64url(value: string | Buffer) {
  return Buffer.from(value).toString('base64url');
}

function parsePayload(token: string) {
  const [header, payload, signature] = token.split('.');
  if (!header || !payload || !signature) {
    return null;
  }

  const expected = createHmac('sha256', SECRET).update(`${header}.${payload}`).digest();
  const signatureBuffer = Buffer.from(signature, 'base64url');

  if (signatureBuffer.length !== expected.length || !timingSafeEqual(expected, signatureBuffer)) {
    return null;
  }

  try {
    return JSON.parse(Buffer.from(payload, 'base64url').toString('utf-8')) as { exp: number; sub: string };
  } catch {
    return null;
  }
}

export function createToken(payload: { sub: string; nome: string; email: string }) {
  const header = base64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body = base64url(JSON.stringify({ ...payload, exp: Math.floor(Date.now() / 1000) + EXPIRATION_SECONDS }));
  const signature = base64url(createHmac('sha256', SECRET).update(`${header}.${body}`).digest());
  return `${header}.${body}.${signature}`;
}

export function verifyToken(token: string) {
  const payload = parsePayload(token);
  if (!payload || !payload.sub || typeof payload.exp !== 'number') {
    return null;
  }

  if (payload.exp < Math.floor(Date.now() / 1000)) {
    return null;
  }

  return payload;
}
