# ZulCode API

API de autenticação e controle de acesso desenvolvida com NestJS como projeto de TCC.

## Sobre o projeto

A ZulCode API é o backend responsável por:

- Cadastro e autenticação de usuários com email e senha
- Emissão e validação de tokens JWT
- Controle de acesso por roles (ex.: `admin`)
- Login com Google OAuth 2.0
- Recuperação de senha via token
- Controle de sequência diária de login (`loginStreak`)

Este projeto tem foco acadêmico (TCC) e prioriza clareza de código, fluxo direto e facilidade de demonstração.

## Tecnologias

- [Node.js](https://nodejs.org)
- [NestJS](https://nestjs.com)
- [TypeScript](https://www.typescriptlang.org)
- [Prisma ORM](https://www.prisma.io)
- [PostgreSQL](https://www.postgresql.org)
- [Passport.js](https://www.passportjs.org) (JWT + Google OAuth 2.0)
- [Jest](https://jestjs.io) + [Supertest](https://github.com/ladjs/supertest)

## Pré-requisitos

- Node.js 20+
- PostgreSQL 16+ (ou Docker)
- Conta Google com credenciais OAuth configuradas

## Variáveis de ambiente

Crie um arquivo `.env` na raiz do projeto com as seguintes variáveis:

```env
DATABASE_URL=postgresql://usuario:senha@localhost:5432/zulcode
JWT_SECRET=sua-chave-secreta-aqui
GOOGLE_CLIENT_ID=seu-google-client-id
GOOGLE_CLIENT_SECRET=seu-google-client-secret
GOOGLE_CALLBACK_URL=http://localhost:3001/auth/google/callback
```

> **Atenção:** Nunca versione o arquivo `.env` com valores reais. Ele já está no `.gitignore`.

## Instalação

```bash
npm install
```

## Banco de dados

Iniciar o banco com Docker (recomendado para desenvolvimento):

```bash
docker compose up db -d
```

Aplicar as migrations do Prisma:

```bash
npx prisma migrate deploy
```

Gerar o Prisma Client:

```bash
npx prisma generate
```

## Rodando o projeto

```bash
# Desenvolvimento (modo watch)
npm run start:dev

# Produção
npm run build
npm run start:prod
```

A API escuta por padrão em:

```
http://localhost:3001
```

## Endpoints principais

### Status

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/` | Hello World |
| GET | `/status` | Status da API |

### Autenticação

| Método | Rota | Descrição |
|--------|------|-----------|
| POST | `/auth/signup` | Cadastro de usuário |
| POST | `/auth/signin` | Login com email e senha |
| POST | `/auth/forgot-password` | Gerar token de recuperação de senha |
| POST | `/auth/reset-password` | Redefinir senha com token |
| GET | `/auth/google` | Iniciar login com Google |
| GET | `/auth/google/callback` | Callback do Google OAuth |

### Feature (rotas protegidas)

| Método | Rota | Proteção | Descrição |
|--------|------|----------|-----------|
| GET | `/feature/public` | Nenhuma | Rota pública |
| GET | `/feature/private` | JWT | Rota autenticada |
| GET | `/feature/admin` | JWT + role `admin` | Rota administrativa |

## Testes

```bash
# Testes unitários
npm test

# Testes e2e
npm run test:e2e

# Cobertura
npm run test:cov
```

## Docker Compose

Para subir a aplicação completa com banco de dados:

```bash
docker compose up --build
```

## Limitações conhecidas (TCC)

1. **Recuperação de senha simplificada**: o token é retornado na resposta da API para facilitar testes. Em produção, deveria ser enviado por email.
2. **JWT com expiração curta**: o token expira em `60s` para demonstração de segurança. Em produção, usar `3600s` ou mais.
3. **Google OAuth**: depende de credenciais externas e não é coberto por testes automatizados locais.
4. **Testes e2e**: cobrem os fluxos principais com mock do banco, não com banco real.

## Estrutura do projeto

```
src/
  app.controller.ts
  app.module.ts
  app.service.ts
  main.ts

  auth/
    auth.controller.ts
    auth.module.ts
    auth.service.ts
    jwt.strategy.ts
    jwt-auth.guard.ts
    google.strategy.ts
    google-auth.guard.ts
    roles.decoreator.ts
    current-user.decorator.ts
    current-user.dto.ts
    status.controller.ts
    dto/
      create-user.dto.ts
      sign-in.dto.ts
      forgot-password.dto.ts
      reset-password.dto.ts

  feature/
    feature.controller.ts
    feature.module.ts

  prisma/
    prisma.module.ts
    prisma.service.ts

prisma/
  schema.prisma
  migrations/

test/
  app.e2e-spec.ts
```

## Licença

Projeto acadêmico — uso restrito ao TCC.
