import { Controller, Body, Post } from '@nestjs/common';
import { AuthService } from './auth.service';

class AuthDto {
  email: string;
  password: string;
}

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signup')
  signUp(@Body() body: AuthDto) {
    const { email, password } = body;
    return this.authService.signUp(email, password);
  }
  @Post('signin')
  signIn(@Body() body: AuthDto) {
    const { email, password } = body;
    return this.authService.signIn(email, password);
  }
}
