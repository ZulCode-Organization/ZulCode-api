import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { randomBytes, randomUUID, scrypt as _scrypt } from 'crypto';
import { promisify } from 'util';
import { PrismaService } from '../prisma/prisma.service';

const scrypt = promisify(_scrypt);

type JwtPayload = {
  sub: string;
  email: string;
  roles: string[];
};

type GoogleUser = {
  googleId: string;
  email: string;
  name: string;
  avatar?: string;
};

type User = {
  id: string;
  name: string;
  email: string;
  password?: string | null;
  googleId?: string | null;
  avatar?: string | null;
  roles: string[];
  loginStreak: number;
  lastLoginAt?: Date | null;
  createdAt: Date;
};

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  private generateAccessToken(user: User) {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      roles: user.roles,
    };

    return {
      accessToken: this.jwtService.sign(payload),
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        roles: user.roles,
        createdAt: user.createdAt,
        loginStreak: user.loginStreak,
        lastLoginAt: user.lastLoginAt,
      },
    };
  }

  private getUtcDayNumber(date: Date) {
    return Math.floor(
      Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()) /
        86_400_000,
    );
  }

  private async recordDailyLogin(user: User, now = new Date()) {
    const lastLoginDay = user.lastLoginAt
      ? this.getUtcDayNumber(user.lastLoginAt)
      : null;
    const currentDay = this.getUtcDayNumber(now);

    let loginStreak = 1;
    if (lastLoginDay === currentDay) {
      loginStreak = Math.max(user.loginStreak, 1);
    } else if (lastLoginDay === currentDay - 1) {
      loginStreak = user.loginStreak + 1;
    }

    return this.prisma.user.update({
      where: { id: user.id },
      data: {
        loginStreak,
        lastLoginAt: now,
      },
    });
  }

  async signUp(
    name: string,
    email: string,
    password: string,
    roles: string[] = [],
  ) {
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new BadRequestException('Email ja esta em uso');
    }

    const salt = randomBytes(8).toString('hex');
    const hash = (await scrypt(password, salt, 32)) as Buffer;

    const user = await this.prisma.user.create({
      data: {
        name,
        email,
        password: `${salt}.${hash.toString('hex')}`,
        roles,
      },
    });

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      createdAt: user.createdAt,
      loginStreak: user.loginStreak,
    };
  }

  async signIn(email: string, password: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user || !user.password) {
      throw new UnauthorizedException('Credenciais invalidas');
    }

    const [salt, storedHash] = user.password.split('.');
    const hash = (await scrypt(password, salt, 32)) as Buffer;

    if (storedHash !== hash.toString('hex')) {
      throw new UnauthorizedException('Credenciais invalidas');
    }

    const loggedUser = await this.recordDailyLogin(user);

    return this.generateAccessToken(loggedUser);
  }

  async forgotPassword(email: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new BadRequestException('Usuario nao encontrado');
    }

    const token = randomUUID();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    // Em um projeto real, esse token seria enviado por email.
    // Aqui retornamos ele na resposta para facilitar os testes do TCC.
    await this.prisma.passwordResetToken.create({
      data: {
        token,
        email,
        expiresAt,
      },
    });

    return {
      message: 'Token de recuperacao gerado com sucesso',
      resetToken: token,
    };
  }

  async resetPassword(token: string, newPassword: string) {
    const resetToken = await this.prisma.passwordResetToken.findUnique({
      where: { token },
    });

    if (!resetToken) {
      throw new BadRequestException('Token invalido');
    }

    if (resetToken.expiresAt < new Date()) {
      throw new BadRequestException('Token expirado');
    }

    const user = await this.prisma.user.findUnique({
      where: { email: resetToken.email },
    });

    if (!user) {
      throw new BadRequestException('Usuario nao encontrado');
    }

    const salt = randomBytes(8).toString('hex');
    const hash = (await scrypt(newPassword, salt, 32)) as Buffer;

    await this.prisma.user.update({
      where: { id: user.id },
      data: { password: `${salt}.${hash.toString('hex')}` },
    });

    await this.prisma.passwordResetToken.delete({
      where: { id: resetToken.id },
    });

    return {
      message: 'Senha alterada com sucesso',
    };
  }

  async googleLogin(googleUser: GoogleUser) {
    let user = await this.prisma.user.findFirst({
      where: {
        OR: [{ googleId: googleUser.googleId }, { email: googleUser.email }],
      },
    });

    if (!user) {
      user = await this.prisma.user.create({
        data: {
          name: googleUser.name,
          email: googleUser.email,
          googleId: googleUser.googleId,
          avatar: googleUser.avatar,
          roles: [],
        },
      });
    }

    if (!user.googleId) {
      user = await this.prisma.user.update({
        where: { id: user.id },
        data: { googleId: googleUser.googleId },
      });
    }

    const loggedUser = await this.recordDailyLogin(user);

    return this.generateAccessToken(loggedUser);
  }
}
