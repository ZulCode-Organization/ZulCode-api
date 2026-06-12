# Documentação do Projeto — ZulCode API

## Objetivo do projeto

Esta API foi criada em NestJS para servir como backend de autenticação e controle de acesso do projeto ZulCode.

O projeto tem foco acadêmico (TCC). A implementação prioriza clareza, fluxo direto e facilidade de demonstração. A estrutura segue o padrão NestJS com módulos, controllers, services, DTOs e Prisma, sem abstrações desnecessárias.

---

## Escopo atual

A API oferece:

- cadastro de usuário com email e senha;
- login com email e senha;
- emissão de token JWT com `sub`, `email` e `roles`;
- controle de acesso por roles (`admin`);
- rota pública, rota privada (JWT) e rota administrativa (JWT + role);
- recuperação de senha com token retornado na resposta;
- redefinição de senha com token válido;
- login com Google OAuth 2.0;
- sequência diária de login (`loginStreak`);
- validação de entrada com `class-validator` e `ValidationPipe` global.

---

## Tecnologias principais

| Tecnologia | Versão (aprox.) | Uso |
|---|---|---|
| Node.js | 20+ | Runtime |
| NestJS | 11 | Framework |
| TypeScript | 5.8 | Tipagem |
| Prisma ORM | 7 | Acesso ao banco |
| PostgreSQL | 16 | Banco de dados |
| Passport.js | 0.7 | Estratégias de autenticação |
| `@nestjs/jwt` | 11 | JWT |
| `passport-google-oauth20` | 2 | Google OAuth |
| `class-validator` | 0.15 | Validação de DTOs |
| Jest + Supertest | 30 / 7 | Testes |

---

## Estrutura de arquivos

```
src/
├── main.ts                      # Bootstrap da aplicação + ValidationPipe global
├── app.module.ts                # Módulo raiz
├── app.controller.ts            # GET /
├── app.service.ts
│
├── auth/
│   ├── auth.controller.ts       # Rotas de autenticação
│   ├── auth.service.ts          # Lógica de autenticação
│   ├── auth.module.ts           # Configuração JWT + Passport
│   ├── jwt.strategy.ts          # Extrai e valida token JWT do header
│   ├── jwt-auth.guard.ts        # Guard JWT + verificação de roles
│   ├── google.strategy.ts       # Estratégia Google OAuth 2.0
│   ├── google-auth.guard.ts     # Guard para rotas Google
│   ├── roles.decoreator.ts      # Decorator @Roles(...)
│   ├── current-user.decorator.ts
│   ├── current-user.dto.ts
│   ├── status.controller.ts     # GET /status
│   └── dto/
│       ├── create-user.dto.ts   # name, email, password, roles?
│       ├── sign-in.dto.ts       # email, password
│       ├── forgot-password.dto.ts # email
│       └── reset-password.dto.ts  # token, newPassword
│
├── feature/
│   ├── feature.controller.ts    # Rotas pública, privada e admin
│   └── feature.module.ts
│
└── prisma/
    ├── prisma.module.ts
    └── prisma.service.ts

prisma/
├── schema.prisma
└── migrations/

test/
└── app.e2e-spec.ts              # 19 testes e2e com mock do banco
```

---

## Módulos

### AppModule — `src/app.module.ts`

Módulo raiz. Importa:

- `ConfigModule.forRoot({ isGlobal: true })` — leitura do `.env` disponível em toda a aplicação;
- `PrismaModule`;
- `AuthModule`;
- `FeatureModule`.

### PrismaModule — `src/prisma/`

Fornece o `PrismaService` para acesso ao banco PostgreSQL via `DATABASE_URL`.

### AuthModule — `src/auth/auth.module.ts`

Responsável pelos fluxos de autenticação. Registra:

- `JwtModule.registerAsync` com `JWT_SECRET` e `expiresIn: '60s'`;
- `PassportModule`;
- `JwtStrategy` e `GoogleStrategy`;
- `AuthController` e `StatusController`.

### FeatureModule — `src/feature/feature.module.ts`

Módulo com rotas de demonstração:

- rota pública;
- rota autenticada por JWT;
- rota autenticada por JWT com role `admin`.

---

## Banco de dados

Arquivo: `prisma/schema.prisma`

### Modelo `User`

| Campo | Tipo | Descrição |
|---|---|---|
| `id` | `String` (UUID) | Identificador único |
| `name` | `String` | Nome do usuário |
| `email` | `String` (único) | Email de acesso |
| `password` | `String?` | Senha com hash `scrypt`. Nulo para usuários Google |
| `googleId` | `String?` (único) | ID do Google |
| `avatar` | `String?` | URL da foto do Google |
| `roles` | `String[]` | Lista de permissões (ex.: `["admin"]`) |
| `loginStreak` | `Int` | Sequência de dias consecutivos de login |
| `lastLoginAt` | `DateTime?` | Data do último login |
| `createdAt` | `DateTime` | Data de criação |
| `updatedAt` | `DateTime` | Última atualização |

### Modelo `PasswordResetToken`

| Campo | Tipo | Descrição |
|---|---|---|
| `id` | `String` (UUID) | Identificador único |
| `token` | `String` (único) | Token de recuperação (UUID aleatório) |
| `email` | `String` | Email do usuário |
| `expiresAt` | `DateTime` | Expiração (15 minutos após criação) |
| `createdAt` | `DateTime` | Data de criação |

O token possui relação com `User` pelo campo `email`. Ao deletar um usuário, os tokens são excluídos em cascata (`onDelete: Cascade`).

---

## Variáveis de ambiente

```env
DATABASE_URL=postgresql://usuario:senha@localhost:5432/zulcode
JWT_SECRET=sua-chave-secreta-aqui
GOOGLE_CLIENT_ID=seu-google-client-id
GOOGLE_CLIENT_SECRET=seu-google-client-secret
GOOGLE_CALLBACK_URL=http://localhost:3001/auth/google/callback
```

> Nunca versionar valores reais. O `.env` está no `.gitignore`.

---

## Como rodar

```bash
# 1. Instalar dependências
npm install

# 2. Gerar o Prisma Client
npx prisma generate

# 3. Aplicar migrations
npx prisma migrate deploy

# 4. Rodar em desenvolvimento
npm run start:dev

# 5. Build de produção
npm run build
npm run start:prod
```

A API escuta por padrão em `http://localhost:3001`.

---

## Endpoints e comportamentos

### `GET /`

Resposta: `Hello World!`

### `GET /status`

Resposta: `OK`

---

### `POST /auth/signup`

Cadastra usuário com email e senha.

**Body (validado pelo `ValidationPipe`):**

```json
{
  "name": "string — obrigatório",
  "email": "email válido — obrigatório",
  "password": "string — obrigatório",
  "roles": ["string"] // opcional
}
```

**Resposta `201`:**

```json
{
  "id": "uuid",
  "name": "...",
  "email": "...",
  "createdAt": "ISO date",
  "loginStreak": 0
}
```

**Erros:**
- `400` — campo obrigatório ausente ou email inválido;
- `400` — email já está em uso.

A senha é armazenada como `salt.hash` usando `scrypt`. Nunca é retornada pela API.

---

### `POST /auth/signin`

Login com email e senha.

**Body:**

```json
{
  "email": "email válido — obrigatório",
  "password": "string — obrigatório"
}
```

**Resposta `200`:**

```json
{
  "accessToken": "JWT",
  "user": {
    "id": "uuid",
    "name": "...",
    "email": "...",
    "roles": [],
    "createdAt": "ISO date",
    "loginStreak": 1,
    "lastLoginAt": "ISO date"
  }
}
```

**Erros:**
- `400` — campo inválido;
- `401` — email não encontrado ou senha incorreta.

---

### `POST /auth/forgot-password`

Gera token de recuperação de senha.

**Body:**

```json
{ "email": "email válido — obrigatório" }
```

**Resposta `201`:**

```json
{
  "message": "Token de recuperacao gerado com sucesso",
  "resetToken": "uuid"
}
```

O token expira em **15 minutos**.

> **Nota TCC:** o token é retornado na resposta para facilitar testes. Em produção, seria enviado por email.

**Erros:**
- `400` — email inválido ou usuário não encontrado.

---

### `POST /auth/reset-password`

Redefine a senha usando um token válido.

**Body:**

```json
{
  "token": "string — obrigatório",
  "newPassword": "string — obrigatório"
}
```

**Resposta `201`:**

```json
{ "message": "Senha alterada com sucesso" }
```

Após o uso, o token é excluído do banco.

**Erros:**
- `400` — token inválido ou expirado;
- `400` — usuário não encontrado.

---

### `GET /auth/google`

Inicia o fluxo de login com Google. O Passport redireciona o usuário para a tela de autenticação do Google.

### `GET /auth/google/callback`

Recebe o retorno do Google após autenticação. Cria o usuário se não existir, associa o `googleId` e retorna o mesmo formato de resposta do `signin`.

---

### `GET /feature/public`

Sem autenticação. Resposta: `This is a public feature`

### `GET /feature/private`

Requer JWT válido no header:

```http
Authorization: Bearer TOKEN
```

Resposta: `This is a private feature for user USER_ID`

**Erro:** `401` sem token.

### `GET /feature/admin`

Requer JWT válido **e** role `admin`.

Resposta: `This is an admin route`

**Erros:**
- `401` — sem token;
- `403` — autenticado, mas sem role `admin`.

---

## Autenticação e autorização

### JWT

O token é gerado com:

```ts
{ sub: user.id, email: user.email, roles: user.roles }
```

Extraído do header `Authorization: Bearer TOKEN`. Após validação pelo `JwtStrategy`, `request.user` recebe:

```ts
{ userId: payload.sub, email: payload.email, roles: payload.roles }
```

### Roles

O decorator `@Roles('admin')` marca uma rota como restrita.

O `JwtAuthGuard` verifica, nessa ordem:

1. Token JWT válido;
2. Se a rota exige role;
3. Se o usuário possui alguma das roles exigidas.

Se faltar a role, retorna `403 Forbidden`.

### Hash de senha

Senhas são armazenadas no formato `salt.hash` usando `scrypt` (Node.js nativo, sem bibliotecas externas).

---

## Sequência de login diário (`loginStreak`)

Calculada em UTC a cada login com senha ou Google:

| Situação | Resultado |
|---|---|
| Primeiro login | `loginStreak = 1` |
| Login no mesmo dia | Mantém o valor atual |
| Login no dia seguinte | Incrementa em 1 |
| Login após pular um dia | Reinicia para `1` |

---

## Validação de entrada

O `ValidationPipe` global foi configurado em `src/main.ts` com:

```ts
app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
```

Todos os DTOs usam decorators do `class-validator`:

| DTO | Campos e decorators |
|---|---|
| `CreateUserDto` | `name` `@IsString @IsNotEmpty`, `email` `@IsEmail @IsNotEmpty`, `password` `@IsString @IsNotEmpty`, `roles?` `@IsArray @IsOptional` |
| `SignInDto` | `email` `@IsEmail @IsNotEmpty`, `password` `@IsString @IsNotEmpty` |
| `ForgotPasswordDto` | `email` `@IsEmail @IsNotEmpty` |
| `ResetPasswordDto` | `token` `@IsString @IsNotEmpty`, `newPassword` `@IsString @IsNotEmpty` |

---

## Testes

### Testes unitários

Comando: `npm test`

**15 testes** cobrindo:

| Arquivo | O que testa |
|---|---|
| `auth.controller.spec.ts` | Delegação do controller para o service (5 testes) |
| `auth.service.spec.ts` | Cadastro, email duplicado, login, loginStreak (4 cenários), credenciais inválidas, forgot/reset password, login Google (10 testes) |

### Testes e2e

Comando: `npm run test:e2e`

**19 testes** usando mock do `PrismaService` (sem banco real):

| Suite | Testes |
|---|---|
| `GET /` | 200 Hello World! |
| `GET /status` | 200 OK |
| `GET /feature/public` | 200 sem autenticação |
| `GET /feature/private` | 401 sem token |
| `GET /feature/admin` | 401 sem token |
| `POST /auth/signup` | 400 body vazio, 400 email inválido, 400 sem password, 201 válido, 400 email duplicado |
| `POST /auth/signin` | 400 body vazio, 400 email inválido, 401 credenciais inválidas |
| `POST /auth/forgot-password` | 400 body vazio, 400 email inválido, 400 usuário não encontrado, 201 token gerado |
| `POST /auth/reset-password` | 400 body vazio, 400 token inválido |

---

## Limitações conhecidas

### 1. Recuperação de senha simplificada

O token de reset é retornado na resposta da API. Em produção, deveria ser enviado por email.

### 2. JWT com expiração curta

O JWT expira em `60s` (configurado em `auth.module.ts`). Útil para demonstração de segurança, mas pode dificultar testes manuais longos. Ajuste `expiresIn` conforme necessário.

### 3. Google OAuth depende de credenciais externas

O fluxo completo exige credenciais válidas e a URL de callback configurada no Google Cloud Console. Não é coberto por testes automatizados.

### 4. Testes e2e sem banco real

Os testes e2e usam mock do `PrismaService`. Não validam migrations, índices ou queries reais.

### 5. Prisma v7 + driver adapter e IntelliSense do VS Code

O `PrismaService` usa `@prisma/adapter-pg` (driver adapter do Prisma v7). Isso faz com que o Language Server do VS Code às vezes não reconheça as propriedades de modelo (`.user`, `.passwordResetToken`) na instância do serviço, exibindo um sublinhado vermelho.

**Isso é um falso positivo do editor.** O compilador TypeScript (`tsc --noEmit`) e o build (`nest build`) não apontam nenhum erro. Todos os 34 testes passam normalmente.

Solução quando ocorrer: rodar `npx prisma generate` e reiniciar o TS Server no VS Code (`Ctrl+Shift+P` → `TypeScript: Restart TS Server`).

---

## Princípios para alterações futuras

- Manter a estrutura de módulos, controllers, services e DTOs;
- Preferir soluções nativas do NestJS;
- Evitar refatorações grandes antes da entrega;
- Toda mudança no banco deve passar por migration do Prisma;
- Senha nunca pode ser retornada pela API;
- Não versionar `.env`, senhas, JWT secret ou credenciais Google.

---

## Análise de próximas alterações

Alterações avaliadas por viabilidade para o escopo atual do TCC:

| # | Alteração | Esforço | Impacto | Viabilidade |
|---|---|---|---|---|
| **1** | `GET /auth/me` — retornar dados do usuário autenticado pelo JWT | Baixo | Alto | ✅ **Recomendada agora** |
| 2 | JWT expiration via variável de ambiente (`JWT_EXPIRES_IN`) | Baixo | Médio | ✅ Viável |
| 3 | Testes e2e com banco de dados real (PostgreSQL de teste) | Alto | Alto | ⚠️ Complexo para TCC |
| 4 | Envio de email real no `forgot-password` (ex.: Nodemailer) | Médio | Baixo para TCC | ⏸ Desnecessário para entrega |
| 5 | Documentação via Swagger / OpenAPI | Médio | Alto para banca | 🔜 Pós-entrega |

### Por que `GET /auth/me` é a alteração mais viável agora

- **Sem mudança de estrutura:** novo endpoint no `AuthController` já existente;
- **Sem mudança no banco:** usa apenas o payload do JWT que já existe em `request.user`;
- **Sem nova migration:** nenhuma alteração no schema;
- **Demonstrável na apresentação:** prova que o JWT funciona e que rotas privadas expõem dados do usuário logado;
- **Testável facilmente:** um novo teste e2e com token válido confirma o funcionamento.

**Implementação esperada:**

```ts
// em auth.controller.ts
@Get('me')
@UseGuards(JwtAuthGuard)
getMe(@CurrentUser() user: CurrentUserDto) {
  return user;
}
```

Resposta:

```json
{
  "userId": "uuid",
  "email": "usuario@email.com",
  "roles": ["admin"]
}
```
