import { Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class UsersService {
  private users: CreateUserDto[] = [];

  constructor(private jwtService: JwtService){}

  async create(body: CreateUserDto){

  const hash = await bcrypt.hash(body.password, 10);

    const user: CreateUserDto = {
      username: body.username,
      email: body.email,
      password: hash,
    };

    this.users.push(user);

    return { 
      username: user.username, 
      email: user.email
    };
  }

  async login(body: CreateUserDto) {
    const user = this.users.find((u) => u.email === body.email);

    if (!user) {
      return 'Usuário não encontrado';
    }

    const passwordMatch = await bcrypt.compare(body.password, user.password);

    if (!passwordMatch) {
      return 'Senha incorreta';
    }

    const token = this.jwtService.sign({
      email: user.email,
      username: user.username,
    });

    return {
      access_token: token,
    };
  }
}

