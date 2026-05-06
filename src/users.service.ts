import { Injectable } from '@nestjs/common';
import { CreateUserDto } from './auth/dto/create-user.dto';

@Injectable()
export class UsersService {
  private users: CreateUserDto[] = [];

  create(body: CreateUserDto) {
    const user = {
      username: body.username,
      email: body.email,
      password: body.password,
    };

    this.users.push(user);

    return user;
  }
  login(body: CreateUserDto) {
    const user = this.users.find((u) => u.email === body.email);

    if (!user) {
      return 'Usuário não encontrado';
    }

    if (user.password !== body.password) {
      return 'Senha incorreta';
    }

    return 'Login realizado com sucesso';
  }
}
