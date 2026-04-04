import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { randomBytes, scrypt as _scrypt } from 'crypto';
import { promisify } from 'util';

const scrypt = promisify(_scrypt);

interface User {
  email: string;
  password: string; // Armazenar o hash da senha
}
const users: User[] = [];

@Injectable()
export class AuthService {
  async signUp(email: string, password: string) {
    // Implementation for signing up a new user
    const existingUser = users.find((user) => user.email === email);
    if (existingUser) {
      throw new BadRequestException('Usuário já existe');
    }

    const salt = randomBytes(8).toString('hex');
    const hash = (await scrypt(password, salt, 32)) as Buffer;
    const saltAndHash = `${salt}.${hash.toString('hex')}`;

    const user = {
      email,
      password: saltAndHash,
    };

    users.push(user);

    console.log('Usuário criado com sucesso:', user);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _, ...result } = user; // Exclui a senha do resultado
    return result;
  }

  async signIn(email: string, password: string) {
    // Implementation for signing in an existing user
    const user = users.find((user) => user.email === email);
    if (!user) {
      throw new UnauthorizedException('Usuário não encontrado');
    }

    const [salt, storedHash] = user.password.split('.');
    const hash = (await scrypt(password, salt, 32)) as Buffer;
    if (storedHash !== hash.toString('hex')) {
      throw new UnauthorizedException('Senha incorreta');
    }

    console.log('Usuário autenticado com sucesso:', user);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _, ...result } = user; // Exclui a senha do resultado
    return result;
  }
}
