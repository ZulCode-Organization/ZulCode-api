import { Body, Controller, Post } from '@nestjs/common';
import { UsersService } from './users/users.service';

@Controller()
export class UsersService {
  // Isso é injeção de dependência.
  //Nest cria automaticamente o UsersService e entrega para o controller.
  constructor(private readonly usersService: UsersService) {}

  @Post('register')
  register(@Body() body) {
    console.log(body);
    return this.usersService.create(body);
  }
}
