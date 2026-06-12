# Documentacao do Projeto ZulCode API

## Objetivo do projeto

Esta API foi criada em NestJS para servir como backend simples de autenticacao e controle de acesso do projeto ZulCode.

O projeto tem foco academico, voltado para um TCC. Por isso, a implementacao prioriza clareza, fluxo direto e facilidade de demonstracao. A estrutura base do codigo deve ser preservada: modulos, controllers, services, DTOs e Prisma devem continuar simples e proximos do padrao inicial do NestJS.

## Escopo atual

A API atualmente oferece:

- cadastro de usuario com email e senha;
- login com email e senha;
- emissao de token JWT;
- controle simples de roles;
- rota publica;
- rota privada protegida por JWT;
- rota administrativa protegida por JWT e role `admin`;
- recuperacao de senha com token retornado na propria resposta;
- login com Google OAuth;
- controle de sequencia diaria de login (`loginStreak`).

## Tecnologias principais

- Node.js
- NestJS
- TypeScript
- Prisma
- PostgreSQL
- Passport
- JWT
- Google OAuth 2.0
- Jest
- Supertest

## Estrutura principal

```text
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

## Modulos

### AppModule

Arquivo: `src/app.module.ts`

Modulo raiz da aplicacao. Importa:

- `ConfigModule`, configurado como global;
- `PrismaModule`;
- `AuthModule`;
- `FeatureModule`.

Tambem registra `AppController` e `AppService`.

### PrismaModule

Arquivos:

- `src/prisma/prisma.module.ts`
- `src/prisma/prisma.service.ts`

Responsavel por fornecer o `PrismaService` para acesso ao banco PostgreSQL.

O `PrismaService` usa `DATABASE_URL` do ambiente para conectar ao banco.

### AuthModule

Arquivo: `src/auth/auth.module.ts`

Responsavel pelos fluxos de autenticacao. Registra:

- `AuthService`;
- `JwtStrategy`;
- `GoogleStrategy`;
- `JwtModule`;
- `PassportModule`;
- `AuthController`;
- `StatusController`.

O JWT usa a variavel `JWT_SECRET` e esta configurado com expiracao de `60s`.

### FeatureModule

Arquivo: `src/feature/feature.module.ts`

Modulo com rotas de exemplo para demonstrar:

- rota publica;
- rota autenticada;
- rota autenticada com permissao de administrador.

## Banco de dados

Arquivo principal: `prisma/schema.prisma`

### User

Campos principais:

- `id`: identificador unico;
- `name`: nome do usuario;
- `email`: email unico;
- `password`: senha com hash, opcional para usuarios Google;
- `googleId`: identificador unico do Google, opcional;
- `avatar`: imagem do Google, opcional;
- `roles`: lista de permissoes;
- `loginStreak`: sequencia de dias de login;
- `lastLoginAt`: data do ultimo login;
- `createdAt`: data de criacao;
- `updatedAt`: data de atualizacao.

### PasswordResetToken

Campos principais:

- `id`: identificador unico;
- `token`: token unico de recuperacao;
- `email`: email do usuario;
- `expiresAt`: data de expiracao;
- `createdAt`: data de criacao.

O token possui relacao com `User` pelo campo `email`.

## Variaveis de ambiente

O projeto espera as seguintes variaveis no `.env`:

```env
DATABASE_URL=
JWT_SECRET=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_CALLBACK_URL=
```

Nao documentar valores reais de segredo no repositorio.

## Como rodar

Instalar dependencias:

```bash
npm install
```

Gerar Prisma Client:

```bash
npx prisma generate
```

Aplicar migrations:

```bash
npx prisma migrate deploy
```

Rodar em desenvolvimento:

```bash
npm run start:dev
```

Rodar build de producao:

```bash
npm run build
npm run start:prod
```

Por padrao, a API escuta em:

```text
http://localhost:3001
```

## Endpoints

### Status

#### `GET /`

Retorna:

```text
Hello World!
```

#### `GET /status`

Retorna:

```text
OK
```

### Auth

#### `POST /auth/signup`

Cadastra usuario com email e senha.

Body esperado:

```json
{
  "name": "Nome do Usuario",
  "email": "usuario@email.com",
  "password": "senha",
  "roles": ["admin"]
}
```

`roles` e opcional. Quando omitido, o service usa lista vazia.

Resposta de sucesso:

```json
{
  "id": "uuid",
  "name": "Nome do Usuario",
  "email": "usuario@email.com",
  "createdAt": "data",
  "loginStreak": 0
}
```

#### `POST /auth/signin`

Realiza login com email e senha.

Body esperado:

```json
{
  "email": "usuario@email.com",
  "password": "senha"
}
```

Resposta de sucesso:

```json
{
  "accessToken": "jwt",
  "user": {
    "id": "uuid",
    "name": "Nome do Usuario",
    "email": "usuario@email.com",
    "roles": [],
    "createdAt": "data",
    "loginStreak": 1,
    "lastLoginAt": "data"
  }
}
```

#### `POST /auth/forgot-password`

Gera token de recuperacao de senha.

Body esperado:

```json
{
  "email": "usuario@email.com"
}
```

Resposta de sucesso:

```json
{
  "message": "Token de recuperacao gerado com sucesso",
  "resetToken": "token"
}
```

Observacao: para simplificar os testes do TCC, o token e retornado diretamente na resposta. Em um sistema real, ele deveria ser enviado por email.

#### `POST /auth/reset-password`

Altera a senha usando token de recuperacao.

Body esperado:

```json
{
  "token": "token",
  "newPassword": "nova-senha"
}
```

Resposta de sucesso:

```json
{
  "message": "Senha alterada com sucesso"
}
```

#### `GET /auth/google`

Inicia o fluxo de login com Google.

O Passport redireciona o usuario para o Google.

#### `GET /auth/google/callback`

Recebe o retorno do Google e cria ou atualiza o usuario na base.

Quando o login Google termina com sucesso, a API retorna JWT no mesmo formato do login comum.

### Feature

#### `GET /feature/public`

Rota publica.

Retorna:

```text
This is a public feature
```

#### `GET /feature/private`

Rota protegida por JWT.

Header esperado:

```http
Authorization: Bearer TOKEN
```

Retorna:

```text
This is a private feature for user USER_ID
```

#### `GET /feature/admin`

Rota protegida por JWT e role `admin`.

Header esperado:

```http
Authorization: Bearer TOKEN
```

Retorna:

```text
This is an admin route
```

Se o usuario estiver autenticado, mas nao tiver role `admin`, retorna `403`.

## Regras de autenticacao e autorizacao

### JWT

O token JWT contem:

```ts
{
  sub: user.id,
  email: user.email,
  roles: user.roles
}
```

Na validacao, o payload vira:

```ts
{
  userId: payload.sub,
  email: payload.email,
  roles: payload.roles
}
```

Esse objeto fica disponivel em rotas protegidas por meio do request.

### Roles

O decorator `@Roles('admin')` define quais permissoes uma rota exige.

O `JwtAuthGuard` valida:

1. se o JWT e valido;
2. se a rota exige role;
3. se o usuario possui alguma das roles exigidas.

## Fluxo de login diario

Sempre que o usuario faz login com senha ou Google, o service atualiza:

- `lastLoginAt`;
- `loginStreak`.

Regras:

- primeiro login: `loginStreak = 1`;
- novo login no mesmo dia: mantem a sequencia;
- login no dia seguinte: incrementa a sequencia;
- se o usuario pular um dia: reinicia para `1`.

A regra usa dias em UTC.

## Testes existentes

### Testes unitarios

Comando:

```bash
npm test
```

Cobrem principalmente:

- delegacao do `AuthController` para o `AuthService`;
- cadastro;
- email duplicado;
- login;
- senha incorreta;
- recuperacao de senha;
- reset de senha;
- login Google;
- regra de `loginStreak`.

### Teste e2e

Comando:

```bash
npm run test:e2e
```

Atualmente cobre apenas:

- `GET /`

Esse teste confirma que a aplicacao sobe, mas ainda nao valida os fluxos principais de autenticacao.

## Limitacoes conhecidas

Estas limitacoes estao documentadas para manter clareza sobre o estado atual do projeto e evitar mudancas grandes demais para o escopo do TCC.

### 1. Validacao de entrada ainda e simples

Os DTOs existem como classes, mas ainda nao possuem decorators como:

- `@IsEmail()`;
- `@IsString()`;
- `@IsNotEmpty()`;
- `@IsOptional()`;
- `@IsArray()`.

Tambem ainda nao ha `ValidationPipe` global em `src/main.ts`.

Consequencia atual: alguns payloads invalidos podem chegar ao service e causar erro interno. Exemplo observado:

```text
POST /auth/signup sem password -> 500 Internal Server Error
```

O comportamento ideal e retornar:

```text
400 Bad Request
```

Essa e a primeira correcao recomendada, sem alterar a estrutura base do projeto.

### 2. Recuperacao de senha simplificada

O token de reset e retornado na resposta da API.

Isso facilita a demonstracao e os testes do TCC, mas em producao o token deveria ser enviado por email.

### 3. JWT com expiracao curta

O JWT expira em `60s`.

Isso pode ser util para demonstracao de seguranca, mas pode atrapalhar testes manuais longos.

### 4. Google OAuth depende de credenciais externas

O endpoint `GET /auth/google` redireciona para o Google, mas o fluxo completo depende de:

- credenciais validas;
- callback configurado;
- interacao com uma conta Google.

Por isso, ele nao e tao simples de validar em teste automatizado local.

### 5. Teste e2e ainda cobre pouco

O e2e atual testa somente a rota raiz.

Para aumentar confianca sem complexidade excessiva, seria util adicionar testes e2e para:

- signup;
- signin;
- rota privada com token;
- rota admin com role;
- rota admin sem role;
- forgot/reset password.

### 6. README atual precisa de revisao

O arquivo `README.md` contem marcadores de conflito Git:

```text
<<<<<<< HEAD
=======
>>>>>>> origin/master
```

Este documento foi criado separadamente para evitar misturar a documentacao tecnica do projeto com a resolucao desse conflito.

### 7. Lint possui pendencias

Uma checagem com ESLint sem alteracao automatica encontrou pendencias de formatacao e alguns avisos de tipagem insegura.

Como o script `npm run lint` usa `--fix`, qualquer ajuste de lint deve ser feito com cuidado para nao gerar mudancas grandes desnecessarias.

## Principios para proximas correcoes

Como este projeto e para TCC, as correcoes devem seguir estes criterios:

- manter a estrutura atual de modulos, controllers, services e DTOs;
- preferir solucoes nativas do NestJS;
- evitar refatoracoes grandes;
- corrigir um problema por vez;
- manter os nomes e fluxos atuais sempre que possivel;
- adicionar validacoes claras sem transformar o projeto em uma arquitetura mais complexa;
- documentar qualquer comportamento que seja propositalmente simplificado para apresentacao academica.

## Proxima correcao recomendada

Corrigir o erro de validacao no signup:

```text
POST /auth/signup sem password -> 500
```

Caminho simples e alinhado ao NestJS:

1. adicionar `ValidationPipe` global em `src/main.ts`;
2. adicionar decorators de validacao nos DTOs de auth;
3. manter `AuthController` e `AuthService` com a estrutura atual;
4. testar novamente `signup`, `signin`, `forgot-password` e `reset-password`.
