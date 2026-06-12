# ZulCode API

API de autenticação e controle de acesso desenvolvida em NestJS como projeto de TCC.

## Sobre o projeto

A ZulCode API é o backend responsável por autenticação de usuários, controle de acesso por roles e gamificação de login diário. Desenvolvida com NestJS sobre Node.js, segue a estrutura padrão de módulos, controllers, services, DTOs e Prisma.

**Foco acadêmico:** o código prioriza clareza e fluxo direto. As decisões de simplificação estão documentadas como limitações conhecidas.

---

## Funcionalidades

| Funcionalidade | Status |
|---|---|
| Cadastro com email e senha | ✅ |
| Login com email e senha + JWT | ✅ |
| Controle de acesso por roles | ✅ |
| Rota pública, privada e admin | ✅ |
| Login com Google OAuth 2.0 | ✅ |
| Recuperação e redefinição de senha | ✅ |
| Sequência de login diário (`loginStreak`) | ✅ |
| Validação de entrada com `class-validator` | ✅ |

---

## Tecnologias

| Tecnologia | Uso |
|---|---|
| Node.js + TypeScript | Runtime e tipagem |
| NestJS | Framework principal |
| Prisma ORM | Acesso ao banco de dados |
| PostgreSQL | Banco de dados |
| Passport.js | Estratégias de autenticação |
| JWT (`@nestjs/jwt`) | Emissão e validação de tokens |
| Google OAuth 2.0 | Login social |
| `class-validator` | Validação de DTOs |
| Jest + Supertest | Testes unitários e e2e |

---

## Pré-requisitos

- Node.js 20+
- PostgreSQL 16+ (ou Docker)
- Credenciais Google OAuth configuradas no [Google Cloud Console](https://console.cloud.google.com/)

---

## Variáveis de ambiente

Crie um arquivo `.env` na raiz do projeto:

```env
DATABASE_URL=postgresql://usuario:senha@localhost:5432/zulcode
JWT_SECRET=sua-chave-secreta-aqui
GOOGLE_CLIENT_ID=seu-google-client-id
GOOGLE_CLIENT_SECRET=seu-google-client-secret
GOOGLE_CALLBACK_URL=http://localhost:3001/auth/google/callback
```

> ⚠️ O `.env` nunca deve ser versionado. Ele já está no `.gitignore`.
>
> No Google Cloud Console, registre exatamente a mesma URL configurada em `GOOGLE_CALLBACK_URL`.

---

## Instalação e execução

### 1. Instalar dependências

```bash
npm install
```

### 2. Subir o banco com Docker (recomendado)

```bash
docker compose up db -d
```

### 3. Aplicar migrations e gerar o Prisma Client

```bash
npx prisma migrate deploy
npx prisma generate
```

### 4. Rodar em desenvolvimento

```bash
npm run start:dev
```

A API estará disponível em `http://localhost:3001`.

### 5. Build de produção

```bash
npm run build
npm run start:prod
```

---

## Endpoints

### Status

| Método | Rota | Autenticação | Resposta |
|--------|------|---|---|
| `GET` | `/` | Nenhuma | `Hello World!` |
| `GET` | `/status` | Nenhuma | `OK` |

### Autenticação

| Método | Rota | Autenticação | Descrição |
|--------|------|---|---|
| `POST` | `/auth/signup` | Nenhuma | Cadastro de usuário |
| `POST` | `/auth/signin` | Nenhuma | Login com email e senha |
| `POST` | `/auth/forgot-password` | Nenhuma | Gerar token de recuperação |
| `POST` | `/auth/reset-password` | Nenhuma | Redefinir senha com token |
| `GET` | `/auth/google` | Nenhuma | Iniciar login com Google |
| `GET` | `/auth/google/callback` | Nenhuma | Callback do Google OAuth |

### Feature (rotas de exemplo)

| Método | Rota | Autenticação | Descrição |
|--------|------|---|---|
| `GET` | `/feature/public` | Nenhuma | Rota pública |
| `GET` | `/feature/private` | JWT | Rota autenticada |
| `GET` | `/feature/admin` | JWT + role `admin` | Rota administrativa |

---

## Exemplos de uso

### Cadastro

```http
POST /auth/signup
Content-Type: application/json

{
  "name": "João Silva",
  "email": "joao@email.com",
  "password": "minhasenha123",
  "roles": ["admin"]
}
```

> `roles` é opcional. Quando omitido, o usuário é criado sem permissões especiais.

Resposta `201`:

```json
{
  "id": "uuid",
  "name": "João Silva",
  "email": "joao@email.com",
  "createdAt": "2026-06-12T...",
  "loginStreak": 0
}
```

### Login

```http
POST /auth/signin
Content-Type: application/json

{
  "email": "joao@email.com",
  "password": "minhasenha123"
}
```

Resposta `200`:

```json
{
  "accessToken": "eyJhbGci...",
  "user": {
    "id": "uuid",
    "name": "João Silva",
    "email": "joao@email.com",
    "roles": ["admin"],
    "createdAt": "2026-06-12T...",
    "loginStreak": 1,
    "lastLoginAt": "2026-06-12T..."
  }
}
```

### Rota privada

```http
GET /feature/private
Authorization: Bearer eyJhbGci...
```

### Recuperação de senha

```http
POST /auth/forgot-password
Content-Type: application/json

{ "email": "joao@email.com" }
```

Resposta `201`:

```json
{
  "message": "Token de recuperacao gerado com sucesso",
  "resetToken": "uuid-do-token"
}
```

```http
POST /auth/reset-password
Content-Type: application/json

{
  "token": "uuid-do-token",
  "newPassword": "novasenha456"
}
```

---

## Testes

```bash
# Testes unitários (15 testes)
npm test

# Testes e2e (19 testes, sem banco real)
npm run test:e2e

# Cobertura
npm run test:cov
```

---

## Validação de entrada

Todos os endpoints utilizam `ValidationPipe` global com `class-validator`. Payloads inválidos retornam `400 Bad Request` com descrição do erro.

Exemplos de erros validados:

| Caso | Resposta |
|---|---|
| `POST /auth/signup` sem `password` | `400 Bad Request` |
| `POST /auth/signin` com email inválido | `400 Bad Request` |
| `POST /auth/forgot-password` com body vazio | `400 Bad Request` |

---

## Limitações conhecidas (TCC)

1. **Token de recuperação na resposta** — retornado diretamente pela API para facilitar testes. Em produção, deveria ser enviado por email.
2. **JWT expira em 60 segundos** — configurado para demonstração de segurança. Ajuste `expiresIn` em `auth.module.ts` conforme necessário.
3. **Google OAuth** — o fluxo completo depende de credenciais externas e não é coberto por testes automatizados.

---

## Estrutura do projeto

```
src/
├── main.ts                      # Bootstrap + ValidationPipe global
├── app.module.ts
├── app.controller.ts
├── app.service.ts
│
├── auth/
│   ├── auth.controller.ts
│   ├── auth.service.ts
│   ├── auth.module.ts
│   ├── jwt.strategy.ts
│   ├── jwt-auth.guard.ts        # Guard JWT + verificação de roles
│   ├── google.strategy.ts
│   ├── google-auth.guard.ts
│   ├── roles.decoreator.ts
│   ├── current-user.decorator.ts
│   ├── current-user.dto.ts
│   ├── status.controller.ts
│   └── dto/
│       ├── create-user.dto.ts
│       ├── sign-in.dto.ts
│       ├── forgot-password.dto.ts
│       └── reset-password.dto.ts
│
├── feature/
│   ├── feature.controller.ts
│   └── feature.module.ts
│
└── prisma/
    ├── prisma.module.ts
    └── prisma.service.ts

prisma/
├── schema.prisma
└── migrations/

test/
└── app.e2e-spec.ts
```
