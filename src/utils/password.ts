import { hash, verify } from 'argon2';

/**
 * Criptografa uma senha usando Argon2
 * @param password - Senha em texto plano
 * @returns Hash seguro da senha
 */
export async function hashPassword(password: string): Promise<string> {
  try {
    const hashedPassword = await hash(password, {
      type: 2, // Argon2id (melhor combinação de segurança)
      memoryCost: 19 * 1024, // 19 MB de memória
      timeCost: 2, // 2 iterações
      parallelism: 1, // 1 thread
      raw: false, // Retorna string em vez de Buffer
    });
    return hashedPassword;
  } catch (error) {
    throw new Error(`Erro ao criptografar senha: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Verifica se uma senha corresponde ao hash armazenado
 * @param password - Senha em texto plano
 * @param hashedPassword - Hash armazenado
 * @returns true se a senha é válida, false caso contrário
 */
export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  try {
    return await verify(hashedPassword, password);
  } catch (error) {
    return false;
  }
}
