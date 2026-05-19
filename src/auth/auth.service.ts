import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { randomBytes, scrypt as _scrypt, randomUUID } from 'crypto';
import { promisify } from 'util';


const scrypt = promisify(_scrypt);

type JwtPayload = {
  sub: string;
  email: string;
};


interface User {
  id: string;
  name: string;
  email: string;
  password: string;
}

const users: User[] = [];

@Injectable()
export class AuthService {
  constructor(private readonly jwtService: JwtService) {}

  async signUp(name: string, email: string, password: string) {
    const existingUser = users.find((user) => user.email === email);

    if (existingUser) {
      throw new BadRequestException('Email já está em uso');
    }

    const salt = randomBytes(8).toString('hex');
    const hash = (await scrypt(password, salt, 32)) as Buffer;

    const user: User = {
      id: randomUUID(),
      name,
      email,
      password: `${salt}.${hash.toString('hex')}`,
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

    if (!user) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    const [salt, storedHash] = user.password.split('.');
    const hash = (await scrypt(password, salt, 32)) as Buffer;

    if (storedHash !== hash.toString('hex')) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
    };

    return {
      // Transforma o payload em um token JWT usando a chave secreta configurada no JwtModule.
      accessToken: this.jwtService.sign(payload),
    };
  }
}
