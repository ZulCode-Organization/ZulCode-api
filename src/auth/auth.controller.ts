import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { SignInDto } from './dto/sign-in.dto';
import { CreateUserDto } from './dto/create-user.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signup')
  signUp(@Body() body: CreateUserDto) {
    const { name, email, password, roles } = body;
    
    return this.authService.signUp(name, email, password, roles);
  }

  @Post('signin')
  signIn(@Body() body: SignInDto) {
    const { email, password } = body;
    return this.authService.signIn(email, password);
  }
}
