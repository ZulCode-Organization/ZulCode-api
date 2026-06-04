import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { randomBytes, randomUUID, scrypt as _scrypt } from 'crypto';
import { promisify } from 'util';

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

interface User {
  id: string;
  name: string;
  email: string;
  password?: string;
  googleId?: string;
  avatar?: string;
  roles: string[];
}

interface PasswordResetToken {
  token: string;
  email: string;
  expiresAt: Date;
}

const users: User[] = [];
const passwordResetTokens: PasswordResetToken[] = [];

@Injectable()
export class AuthService {
  constructor(private readonly jwtService: JwtService) {}

  private generateAccessToken(user: User) {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      roles: user.roles,
    };

    return {
      accessToken: this.jwtService.sign(payload),
    };
  }

  async signUp(
    name: string,
    email: string,
    password: string,
    roles: string[] = [],
  ) {
    const existingUser = users.find((user) => user.email === email);

    if (existingUser) {
      throw new BadRequestException('Email ja esta em uso');
    }

    const salt = randomBytes(8).toString('hex');
    const hash = (await scrypt(password, salt, 32)) as Buffer;

    const user: User = {
      id: randomUUID(),
      name,
      email,
      password: `${salt}.${hash.toString('hex')}`,
      roles: [...roles],
    };

    users.push(user);

    return {
      id: user.id,
      name: user.name,
      email: user.email,
    };
  }

  async signIn(email: string, password: string) {
    const user = users.find((user) => user.email === email);

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

  forgotPassword(email: string) {
    const user = users.find((user) => user.email === email);

    if (!user) {
      throw new BadRequestException('Usuario nao encontrado');
    }

    const token = randomUUID();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    // Em um projeto real, esse token seria enviado por email.
    // Aqui retornamos ele na resposta para facilitar os testes do TCC.
    passwordResetTokens.push({
      token,
      email,
      expiresAt,
    });

    return {
      message: 'Token de recuperacao gerado com sucesso',
      resetToken: token,
    };
  }

  async resetPassword(token: string, newPassword: string) {
    const resetToken = passwordResetTokens.find(
      (resetToken) => resetToken.token === token,
    );

    if (!resetToken) {
      throw new BadRequestException('Token invalido');
    }

    if (resetToken.expiresAt < new Date()) {
      throw new BadRequestException('Token expirado');
    }

    const user = users.find((user) => user.email === resetToken.email);

    if (!user) {
      throw new BadRequestException('Usuario nao encontrado');
    }

    const salt = randomBytes(8).toString('hex');
    const hash = (await scrypt(newPassword, salt, 32)) as Buffer;

    user.password = `${salt}.${hash.toString('hex')}`;

    const tokenIndex = passwordResetTokens.indexOf(resetToken);
    passwordResetTokens.splice(tokenIndex, 1);

    return {
      message: 'Senha alterada com sucesso',
    };
  }

  googleLogin(googleUser: GoogleUser) {
    let user = users.find(
      (user) =>
        user.googleId === googleUser.googleId || user.email === googleUser.email,
    );

    if (!user) {
      user = {
        id: randomUUID(),
        name: googleUser.name,
        email: googleUser.email,
        googleId: googleUser.googleId,
        avatar: googleUser.avatar,
        roles: [],
      };

      users.push(user);
    }

    if (!user.googleId) {
      user.googleId = googleUser.googleId;
    }

    return this.generateAccessToken(user);
  }
}
