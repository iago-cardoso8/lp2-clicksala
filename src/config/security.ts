/**
 * Configurações de segurança da aplicação
 */

export const SECURITY_CONFIG = {
  // JWT Configuration
  jwt: {
    secret: process.env.JWT_SECRET || 'clicksala-secret-key-change-in-production',
    expirationSeconds: 60 * 60 * 24, // 24 horas
  },

  // Argon2 Configuration
  argon2: {
    type: 2, // Argon2id
    memoryCost: 19 * 1024, // 19 MB
    timeCost: 2,
    parallelism: 1,
  },

  // Validação de Senha
  password: {
    minLength: 6,
    maxLength: 128,
    requireUpperCase: false,
    requireNumbers: false,
    requireSpecialChars: false,
  },

  // Validação de Email
  email: {
    maxLength: 255,
  },

  // Rate Limiting (para implementação futura)
  rateLimit: {
    loginAttempts: 5,
    loginWindowMinutes: 15,
  },
};

/**
 * Regex para validação de email
 */
export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Validar força da senha
 */
export function validatePasswordStrength(password: string): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!password) {
    errors.push('Senha é obrigatória.');
  } else {
    if (password.length < SECURITY_CONFIG.password.minLength) {
      errors.push(`Senha deve ter pelo menos ${SECURITY_CONFIG.password.minLength} caracteres.`);
    }

    if (password.length > SECURITY_CONFIG.password.maxLength) {
      errors.push(`Senha não pode ter mais de ${SECURITY_CONFIG.password.maxLength} caracteres.`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validar email
 */
export function validateEmail(email: string): {
  isValid: boolean;
  error?: string;
} {
  if (!email) {
    return { isValid: false, error: 'Email é obrigatório.' };
  }

  if (email.length > SECURITY_CONFIG.email.maxLength) {
    return { isValid: false, error: `Email não pode ter mais de ${SECURITY_CONFIG.email.maxLength} caracteres.` };
  }

  if (!EMAIL_REGEX.test(email)) {
    return { isValid: false, error: 'Email inválido.' };
  }

  return { isValid: true };
}

/**
 * Validar nome do usuário
 */
export function validateName(name: string): {
  isValid: boolean;
  error?: string;
} {
  if (!name) {
    return { isValid: false, error: 'Nome é obrigatório.' };
  }

  if (name.trim().length < 3) {
    return { isValid: false, error: 'Nome deve ter pelo menos 3 caracteres.' };
  }

  if (name.length > 100) {
    return { isValid: false, error: 'Nome não pode ter mais de 100 caracteres.' };
  }

  return { isValid: true };
}
