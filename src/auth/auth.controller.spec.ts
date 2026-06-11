import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: {
    signUp: jest.Mock;
    signIn: jest.Mock;
    forgotPassword: jest.Mock;
    resetPassword: jest.Mock;
    googleLogin: jest.Mock;
  };

  beforeEach(async () => {
    authService = {
      signUp: jest.fn(),
      signIn: jest.fn(),
      forgotPassword: jest.fn(),
      resetPassword: jest.fn(),
      googleLogin: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: authService }],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  it('delegates signup to AuthService', () => {
    const body = {
      name: 'Test User',
      email: 'test@acme.com',
      password: 'password',
      roles: ['admin'],
    };
    authService.signUp.mockReturnValue({ id: 'user-1' });

    expect(controller.signUp(body)).toEqual({ id: 'user-1' });
    expect(authService.signUp).toHaveBeenCalledWith(
      body.name,
      body.email,
      body.password,
      body.roles,
    );
  });

  it('delegates signin to AuthService', () => {
    const body = { email: 'test@acme.com', password: 'password' };
    authService.signIn.mockReturnValue({ accessToken: 'token' });

    expect(controller.signIn(body)).toEqual({ accessToken: 'token' });
    expect(authService.signIn).toHaveBeenCalledWith(body.email, body.password);
  });

  it('delegates forgot password to AuthService', () => {
    authService.forgotPassword.mockReturnValue({ resetToken: 'token' });

    expect(controller.forgotPassword({ email: 'test@acme.com' })).toEqual({
      resetToken: 'token',
    });
    expect(authService.forgotPassword).toHaveBeenCalledWith('test@acme.com');
  });

  it('delegates reset password to AuthService', () => {
    const body = { token: 'token', newPassword: 'new-password' };
    authService.resetPassword.mockReturnValue({
      message: 'Senha alterada com sucesso',
    });

    expect(controller.resetPassword(body)).toEqual({
      message: 'Senha alterada com sucesso',
    });
    expect(authService.resetPassword).toHaveBeenCalledWith(
      body.token,
      body.newPassword,
    );
  });

  it('delegates Google callback to AuthService', () => {
    const googleUser = {
      googleId: 'google-1',
      email: 'test@acme.com',
      name: 'Test User',
      avatar: 'https://example.com/avatar.png',
    };
    authService.googleLogin.mockReturnValue({ accessToken: 'token' });

    expect(
      controller.googleAuthCallback({ user: googleUser } as never),
    ).toEqual({ accessToken: 'token' });
    expect(authService.googleLogin).toHaveBeenCalledWith(googleUser);
  });
});
