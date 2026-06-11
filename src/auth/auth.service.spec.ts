import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { AuthService } from './auth.service';

const createdAt = new Date('2026-06-01T12:00:00.000Z');

const user = {
  id: 'user-1',
  name: 'Test User',
  email: 'test@acme.com',
  password:
    'salt.745731af4484f323968969eda289aeee005b5903ac561e64a5aca121797bf773',
  googleId: null,
  avatar: null,
  roles: ['admin'],
  loginStreak: 0,
  lastLoginAt: null,
  createdAt,
  updatedAt: createdAt,
};

describe('AuthService', () => {
  let service: AuthService;
  let prisma: {
    user: {
      findUnique: jest.Mock;
      findFirst: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
    };
    passwordResetToken: {
      findUnique: jest.Mock;
      create: jest.Mock;
      delete: jest.Mock;
    };
  };
  let jwtService: { sign: jest.Mock };

  beforeEach(async () => {
    prisma = {
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
    jwtService = {
      sign: jest.fn().mockReturnValue('signed-token'),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: JwtService, useValue: jwtService },
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('creates a user with the account creation date and zero login streak', async () => {
    prisma.user.findUnique.mockResolvedValue(null);
    prisma.user.create.mockResolvedValue(user);

    const result = await service.signUp(
      user.name,
      user.email,
      'password',
      user.roles,
    );

    expect(prisma.user.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        name: user.name,
        email: user.email,
        roles: user.roles,
      }),
    });
    expect(result).toEqual({
      id: user.id,
      name: user.name,
      email: user.email,
      createdAt,
      loginStreak: 0,
    });
  });

  it('does not create a user with a duplicated email', async () => {
    prisma.user.findUnique.mockResolvedValue(user);

    await expect(
      service.signUp(user.name, user.email, 'password'),
    ).rejects.toThrow(BadRequestException);
  });

  it('signs in and starts the daily login streak on first login', async () => {
    jest.useFakeTimers().setSystemTime(new Date('2026-06-09T10:00:00.000Z'));
    prisma.user.findUnique.mockResolvedValue(user);
    prisma.user.update.mockResolvedValue({
      ...user,
      loginStreak: 1,
      lastLoginAt: new Date('2026-06-09T10:00:00.000Z'),
    });

    const result = await service.signIn(user.email, 'password');

    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: user.id },
      data: {
        loginStreak: 1,
        lastLoginAt: new Date('2026-06-09T10:00:00.000Z'),
      },
    });
    expect(jwtService.sign).toHaveBeenCalledWith({
      sub: user.id,
      email: user.email,
      roles: user.roles,
    });
    expect(result).toEqual({
      accessToken: 'signed-token',
      user: expect.objectContaining({
        id: user.id,
        createdAt,
        loginStreak: 1,
        lastLoginAt: new Date('2026-06-09T10:00:00.000Z'),
      }),
    });
    jest.useRealTimers();
  });

  it('keeps the login streak unchanged when logging in again on the same day', async () => {
    jest.useFakeTimers().setSystemTime(new Date('2026-06-09T20:00:00.000Z'));
    prisma.user.findUnique.mockResolvedValue({
      ...user,
      loginStreak: 3,
      lastLoginAt: new Date('2026-06-09T08:00:00.000Z'),
    });
    prisma.user.update.mockResolvedValue({
      ...user,
      loginStreak: 3,
      lastLoginAt: new Date('2026-06-09T20:00:00.000Z'),
    });

    await service.signIn(user.email, 'password');

    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: user.id },
      data: {
        loginStreak: 3,
        lastLoginAt: new Date('2026-06-09T20:00:00.000Z'),
      },
    });
    jest.useRealTimers();
  });

  it('increments the login streak when the previous login was yesterday', async () => {
    jest.useFakeTimers().setSystemTime(new Date('2026-06-09T10:00:00.000Z'));
    prisma.user.findUnique.mockResolvedValue({
      ...user,
      loginStreak: 3,
      lastLoginAt: new Date('2026-06-08T10:00:00.000Z'),
    });
    prisma.user.update.mockResolvedValue({
      ...user,
      loginStreak: 4,
      lastLoginAt: new Date('2026-06-09T10:00:00.000Z'),
    });

    await service.signIn(user.email, 'password');

    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: user.id },
      data: {
        loginStreak: 4,
        lastLoginAt: new Date('2026-06-09T10:00:00.000Z'),
      },
    });
    jest.useRealTimers();
  });

  it('resets the login streak when the user skipped a day', async () => {
    jest.useFakeTimers().setSystemTime(new Date('2026-06-09T10:00:00.000Z'));
    prisma.user.findUnique.mockResolvedValue({
      ...user,
      loginStreak: 3,
      lastLoginAt: new Date('2026-06-07T10:00:00.000Z'),
    });
    prisma.user.update.mockResolvedValue({
      ...user,
      loginStreak: 1,
      lastLoginAt: new Date('2026-06-09T10:00:00.000Z'),
    });

    await service.signIn(user.email, 'password');

    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: user.id },
      data: {
        loginStreak: 1,
        lastLoginAt: new Date('2026-06-09T10:00:00.000Z'),
      },
    });
    jest.useRealTimers();
  });

  it('rejects invalid sign in credentials', async () => {
    prisma.user.findUnique.mockResolvedValue(null);

    await expect(service.signIn(user.email, 'password')).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('creates a password reset token', async () => {
    prisma.user.findUnique.mockResolvedValue(user);
    prisma.passwordResetToken.create.mockResolvedValue({
      id: 'reset-1',
      token: 'reset-token',
      email: user.email,
      expiresAt: new Date(),
      createdAt: new Date(),
    });

    const result = await service.forgotPassword(user.email);

    expect(prisma.passwordResetToken.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ email: user.email }),
    });
    expect(result).toEqual({
      message: 'Token de recuperacao gerado com sucesso',
      resetToken: expect.any(String),
    });
  });

  it('resets the password and deletes the used token', async () => {
    prisma.passwordResetToken.findUnique.mockResolvedValue({
      id: 'reset-1',
      token: 'reset-token',
      email: user.email,
      expiresAt: new Date(Date.now() + 60_000),
    });
    prisma.user.findUnique.mockResolvedValue(user);
    prisma.user.update.mockResolvedValue(user);
    prisma.passwordResetToken.delete.mockResolvedValue({ id: 'reset-1' });

    const result = await service.resetPassword('reset-token', 'new-password');

    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: user.id },
      data: { password: expect.any(String) },
    });
    expect(prisma.passwordResetToken.delete).toHaveBeenCalledWith({
      where: { id: 'reset-1' },
    });
    expect(result).toEqual({ message: 'Senha alterada com sucesso' });
  });

  it('creates and signs in a Google user', async () => {
    jest.useFakeTimers().setSystemTime(new Date('2026-06-09T10:00:00.000Z'));
    prisma.user.findFirst.mockResolvedValue(null);
    prisma.user.create.mockResolvedValue({
      ...user,
      password: null,
      googleId: 'google-1',
      avatar: 'https://example.com/avatar.png',
    });
    prisma.user.update.mockResolvedValue({
      ...user,
      password: null,
      googleId: 'google-1',
      avatar: 'https://example.com/avatar.png',
      loginStreak: 1,
      lastLoginAt: new Date('2026-06-09T10:00:00.000Z'),
    });

    const result = await service.googleLogin({
      googleId: 'google-1',
      email: user.email,
      name: user.name,
      avatar: 'https://example.com/avatar.png',
    });

    expect(prisma.user.create).toHaveBeenCalledWith({
      data: {
        name: user.name,
        email: user.email,
        googleId: 'google-1',
        avatar: 'https://example.com/avatar.png',
        roles: [],
      },
    });
    expect(result.accessToken).toBe('signed-token');
    expect(result.user.loginStreak).toBe(1);
    jest.useRealTimers();
  });
});
