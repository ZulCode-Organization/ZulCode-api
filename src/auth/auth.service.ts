import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { randomBytes, scrypt as _scrypt } from 'crypto';
import { promisify } from 'util';

const scrypt = promisify(_scrypt);

interface User {
  id: number;
  email: string;
  password: string;
}

const users: User[] = [];

@Injectable()
export class AuthService {
  constructor(private readonly jwtService: JwtService) {}

  async signUp(email: string, password: string) {
    const existingUser = users.find((user) => user.email === email);

    if (existingUser) {
      throw new BadRequestException('Email já está em uso');
    }

    const salt = randomBytes(8).toString('hex');
    const hash = (await scrypt(password, salt, 32)) as Buffer;

    const user: User = {
      id: users.length + 1,
      email,
      password: `${salt}.${hash.toString('hex')}`,
    };

    users.push(user);

    const { password: _, ...result } = user;
    return result;
  }

  async signIn(email: string, password: string) {
    const user = users.find((user) => user.email === email);

    if (!user) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    const [salt, storedHash] = user.password.split('.');
    const hash = (await scrypt(password, salt, 32)) as Buffer;

    if (storedHash !== hash.toString('hex')) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    const payload = {
      sub: user.id,
      email: user.email,
    };

    return {
      accessToken: this.jwtService.sign(payload),
    };
  }
}
