# Segurança de Autenticação e Criptografia

Este documento descreve a implementação de segurança no sistema de autenticação da aplicação ClickSala.

## 🔐 Componentes de Segurança

### 1. **Criptografia de Senha (Argon2)**

**Arquivo:** `src/utils/password.ts`

- **Algoritmo:** Argon2id (recomendado pelo OWASP)
- **Características:**
  - Resistente a ataques de força bruta
  - Resistente a ataques de GPU e ASIC
  - Usa 19 MB de memória por hash
  - 2 iterações para melhor segurança
  - Totalmente async para não bloquear a aplicação

**Funções principais:**
```typescript
export async function hashPassword(password: string): Promise<string>
export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean>
```

### 2. **Autenticação com JWT (JSON Web Token)**

**Arquivo:** `src/utils/token.ts`

- **Algoritmo:** HS256 (HMAC with SHA-256)
- **Características:**
  - Token com prazo de expiração de 24 horas
  - Assinatura HMAC para garantir integridade
  - Validação de timing-safe para evitar ataques de timing
  - Payload contém: `sub` (user ID), `nome`, `email`, `iat` (tempo de emissão), `exp` (tempo de expiração)

**Funções principais:**
```typescript
export function createToken(payload: { sub: string; nome: string; email: string }): string
export function verifyToken(token: string): { exp: number; sub: string } | null
```

### 3. **Middleware de Autenticação**

**Arquivo:** `src/middlewares/authMiddleware.ts`

- Valida o token JWT em cada requisição protegida
- Extrai o user ID do token e o armazena no objeto `request`
- Retorna erro 401 se o token for inválido ou ausente
- Formato esperado: `Authorization: Bearer <token>`

### 4. **Validações de Segurança**

**Arquivo:** `src/config/security.ts`

Implementa validações para:
- **Senha:** Mínimo 6 caracteres, máximo 128 caracteres
- **Email:** Validação de formato, máximo 255 caracteres
- **Nome:** Mínimo 3 caracteres, máximo 100 caracteres
- **Email Case-Insensitive:** Emails são armazenados em minúsculas para evitar duplicatas

**Funções de validação:**
```typescript
validatePasswordStrength(password: string)
validateEmail(email: string)
validateName(name: string)
```

## 🔄 Fluxo de Autenticação

### Registro (Register)

1. Usuário envia `POST /auth/register` com `nome`, `email` e `password`
2. Validações de entrada são executadas
3. Verifica se email já existe no banco de dados
4. Senha é criptografada com Argon2
5. Usuário é criado no banco de dados
6. JWT token é gerado e retornado

**Resposta (201 Created):**
```json
{
  "user": {
    "id": 1,
    "nome": "João Silva",
    "email": "joao@example.com"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Login

1. Usuário envia `POST /auth/login` com `email` e `password`
2. Usuário é buscado no banco de dados
3. Senha é verificada com Argon2
4. JWT token é gerado e retornado
5. Mensagem de erro genérica para não revelar se email existe

**Resposta (200 OK):**
```json
{
  "user": {
    "id": 1,
    "nome": "João Silva",
    "email": "joao@example.com"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Obter Dados do Usuário (Me)

1. Usuário envia `GET /auth/me` com header `Authorization: Bearer <token>`
2. Middleware valida o token
3. Usuário é buscado no banco de dados
4. Dados do usuário são retornados

**Resposta (200 OK):**
```json
{
  "id": 1,
  "nome": "João Silva",
  "email": "joao@example.com"
}
```

## 🛡️ Melhorias de Segurança

### Implementadas:

✅ **Criptografia forte com Argon2**
- Substitui o scrypt anterior
- Mais resistente a ataques modernos
- Recomendado pelo OWASP

✅ **JWT com expiração**
- Token expira em 24 horas
- Verificação de integridade com HMAC
- Timestamp de emissão incluído

✅ **Validações robustas**
- Validação de entrada em todos os endpoints
- Verificação de força de senha
- Validação de email com regex

✅ **Case-insensitive emails**
- Previne duplicatas de email com diferentes casos
- Melhor experiência do usuário

✅ **Middleware de autenticação segura**
- Try-catch para tratar erros corretamente
- Validação de tipo do payload

## 🔧 Variáveis de Ambiente

Adicione ao seu `.env`:

```env
JWT_SECRET=sua-chave-secreta-muito-segura-aqui
```

⚠️ **IMPORTANTE:** Em produção, use uma chave secreta forte e única (mínimo 32 caracteres).

## 📝 Exemplos de Uso

### Registrar novo usuário

```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "nome": "João Silva",
    "email": "joao@example.com",
    "password": "senha123"
  }'
```

### Fazer login

```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "joao@example.com",
    "password": "senha123"
  }'
```

### Acessar dados do usuário (requer autenticação)

```bash
curl -X GET http://localhost:3000/auth/me \
  -H "Authorization: Bearer seu_token_jwt_aqui"
```

## 🚀 Próximos Passos Recomendados

1. **Rate Limiting:** Implementar limite de tentativas de login
2. **Refresh Tokens:** Adicionar tokens de refresh para melhor segurança
3. **2FA (Two-Factor Authentication):** Adicionar autenticação de dois fatores
4. **Auditoria:** Registrar todas as ações de autenticação
5. **Logout:** Implementar blacklist de tokens expirados
6. **HTTPS:** Garantir que toda comunicação seja via HTTPS em produção
7. **CORS:** Configurar CORS adequadamente em produção

## 📚 Referências

- [OWASP Cheat Sheet - Password Storage](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html)
- [OWASP Cheat Sheet - Authentication](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)
- [Argon2 Documentation](https://github.com/ranisalt/node-argon2)
- [JWT Best Practices](https://tools.ietf.org/html/rfc7519)
