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
  role: string;
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
  role: string;
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
      role: user.role,
    };

    return {
      accessToken: this.jwtService.sign(payload),
    };
  }

  async signUp(
    name: string,
    email: string,
    password: string,
    role: string = 'USER',
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
        role,
      },
    });

    return {
      id: user.id,
      name: user.name,
      email: user.email,
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

    return this.generateAccessToken(user);
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
          role: 'USER',
        },
      });
    }

    if (!user.googleId) {
      user = await this.prisma.user.update({
        where: { id: user.id },
        data: { googleId: googleUser.googleId },
      });
    }

    return this.generateAccessToken(user);
  }
}
