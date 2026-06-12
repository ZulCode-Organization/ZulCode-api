import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { PrismaService } from './../src/prisma/prisma.service';

/**
 * Mock do PrismaService para testes e2e.
 * Os testes não precisam de banco real — o mock simula as respostas esperadas.
 */
const prismaMock = {
  user: {
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  passwordResetToken: {
    findUnique: jest.fn(),
    create: jest.fn(),
    delete: jest.fn(),
  },
};

describe('ZulCode API (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue(prismaMock)
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, forbidNonWhitelisted: false, transform: true }),
    );
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ─── Status ────────────────────────────────────────────────────────────────

  describe('GET /', () => {
    it('deve retornar Hello World! com status 200', () => {
      return request(app.getHttpServer())
        .get('/')
        .expect(200)
        .expect('Hello World!');
    });
  });

  describe('GET /status', () => {
    it('deve retornar OK com status 200', () => {
      return request(app.getHttpServer())
        .get('/status')
        .expect(200)
        .expect('OK');
    });
  });

  // ─── Feature pública ───────────────────────────────────────────────────────

  describe('GET /feature/public', () => {
    it('deve retornar rota pública sem autenticação', () => {
      return request(app.getHttpServer())
        .get('/feature/public')
        .expect(200)
        .expect('This is a public feature');
    });
  });

  // ─── Feature privada ───────────────────────────────────────────────────────

  describe('GET /feature/private', () => {
    it('deve retornar 401 sem token JWT', () => {
      return request(app.getHttpServer())
        .get('/feature/private')
        .expect(401);
    });
  });

  // ─── Feature admin ─────────────────────────────────────────────────────────

  describe('GET /feature/admin', () => {
    it('deve retornar 401 sem token JWT', () => {
      return request(app.getHttpServer())
        .get('/feature/admin')
        .expect(401);
    });
  });

  // ─── Signup ────────────────────────────────────────────────────────────────

  describe('POST /auth/signup', () => {
    it('deve retornar 400 com body vazio (ValidationPipe)', () => {
      return request(app.getHttpServer())
        .post('/auth/signup')
        .send({})
        .expect(400);
    });

    it('deve retornar 400 com email inválido', () => {
      return request(app.getHttpServer())
        .post('/auth/signup')
        .send({ name: 'Teste', email: 'nao-e-email', password: '123456' })
        .expect(400);
    });

    it('deve retornar 400 sem o campo password', () => {
      return request(app.getHttpServer())
        .post('/auth/signup')
        .send({ name: 'Teste', email: 'teste@email.com' })
        .expect(400);
    });

    it('deve cadastrar usuário válido e retornar 201', async () => {
      const novoUsuario = {
        id: 'uuid-teste',
        name: 'Teste',
        email: 'teste@email.com',
        createdAt: new Date(),
        loginStreak: 0,
      };
      prismaMock.user.findUnique.mockResolvedValue(null); // email não existe ainda
      prismaMock.user.create.mockResolvedValue(novoUsuario);

      return request(app.getHttpServer())
        .post('/auth/signup')
        .send({ name: 'Teste', email: 'teste@email.com', password: 'senha123' })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body).toHaveProperty('email', 'teste@email.com');
          expect(res.body).not.toHaveProperty('password'); // senha nunca exposta
        });
    });

    it('deve retornar 400 se email já estiver em uso', async () => {
      prismaMock.user.findUnique.mockResolvedValue({ id: 'existente' });

      return request(app.getHttpServer())
        .post('/auth/signup')
        .send({ name: 'Teste', email: 'existente@email.com', password: 'senha123' })
        .expect(400);
    });
  });

  // ─── Signin ────────────────────────────────────────────────────────────────

  describe('POST /auth/signin', () => {
    it('deve retornar 400 com body vazio (ValidationPipe)', () => {
      return request(app.getHttpServer())
        .post('/auth/signin')
        .send({})
        .expect(400);
    });

    it('deve retornar 400 com email inválido', () => {
      return request(app.getHttpServer())
        .post('/auth/signin')
        .send({ email: 'nao-e-email', password: '123' })
        .expect(400);
    });

    it('deve retornar 401 com credenciais inválidas', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null); // usuário não encontrado

      return request(app.getHttpServer())
        .post('/auth/signin')
        .send({ email: 'inexistente@email.com', password: 'wrongpass' })
        .expect(401);
    });
  });

  // ─── Forgot password ───────────────────────────────────────────────────────

  describe('POST /auth/forgot-password', () => {
    it('deve retornar 400 com body vazio', () => {
      return request(app.getHttpServer())
        .post('/auth/forgot-password')
        .send({})
        .expect(400);
    });

    it('deve retornar 400 com email inválido', () => {
      return request(app.getHttpServer())
        .post('/auth/forgot-password')
        .send({ email: 'nao-e-email' })
        .expect(400);
    });

    it('deve retornar 400 se usuário não encontrado', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);

      return request(app.getHttpServer())
        .post('/auth/forgot-password')
        .send({ email: 'inexistente@email.com' })
        .expect(400);
    });

    it('deve retornar token de recuperação para email válido', async () => {
      prismaMock.user.findUnique.mockResolvedValue({
        id: 'uuid-teste',
        email: 'usuario@email.com',
      });
      prismaMock.passwordResetToken.create.mockResolvedValue({});

      return request(app.getHttpServer())
        .post('/auth/forgot-password')
        .send({ email: 'usuario@email.com' })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('resetToken');
          expect(res.body).toHaveProperty('message');
        });
    });
  });

  // ─── Reset password ────────────────────────────────────────────────────────

  describe('POST /auth/reset-password', () => {
    it('deve retornar 400 com body vazio', () => {
      return request(app.getHttpServer())
        .post('/auth/reset-password')
        .send({})
        .expect(400);
    });

    it('deve retornar 400 com token inválido', async () => {
      prismaMock.passwordResetToken.findUnique.mockResolvedValue(null);

      return request(app.getHttpServer())
        .post('/auth/reset-password')
        .send({ token: 'token-invalido', newPassword: 'novaSenha123' })
        .expect(400);
    });
  });
});
