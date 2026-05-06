import { Body, Controller, Post } from '@nestjs/common';
<<<<<<< HEAD
import { UsersService } from './users/users.service';
import { CreateUserDto } from './users/dto/create-user.dto';
=======
import { UsersService } from './users.service';
import { CreateUserDto } from './auth/dto/create-user.dto';
>>>>>>> origin/master

@Controller()
export class AppController {
  // Isso é injeção de dependência.
  //Nest cria automaticamente o UsersService e entrega para o controller.
  constructor(private readonly usersService: UsersService) {}

  @Post('register')
  register(@Body() body: CreateUserDto) {
    return this.usersService.create(body);
  }

  @Post('login')
  login(@Body() body: CreateUserDto) {
    return this.usersService.login(body);
  }
}
