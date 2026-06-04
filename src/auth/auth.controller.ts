import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { AuthService } from './auth.service';
import { SignInDto } from './dto/sign-in.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { GoogleAuthGuard } from './google-auth.guard';
import { GoogleUser } from './google.strategy';

type GoogleRequest = Request & {
  user: GoogleUser;
};

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

  @Post('forgot-password')
  forgotPassword(@Body() body: ForgotPasswordDto) {
    const { email } = body;
    return this.authService.forgotPassword(email);
  }

  @Post('reset-password')
  resetPassword(@Body() body: ResetPasswordDto) {
    const { token, newPassword } = body;
    return this.authService.resetPassword(token, newPassword);
  }

  @Get('google')
  @UseGuards(GoogleAuthGuard)
  googleAuth() {
    // O Passport redireciona automaticamente para o Google.
  }

  @Get('google/callback')
  @UseGuards(GoogleAuthGuard)
  googleAuthCallback(@Req() req: GoogleRequest) {
    return this.authService.googleLogin(req.user);
  }
}
