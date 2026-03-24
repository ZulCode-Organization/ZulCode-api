import { Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';

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
}
