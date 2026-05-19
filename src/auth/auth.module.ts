import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';
import { ConfigService } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from './jwt.strategy';

@Module({
  imports: [
    ConfigModule,
    PassportModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        // chave de criptografia do JWT, que iremos pegar do .env usando o ConfigService.
        secret: config.get('JWT_SECRET') ?? 'senha-secreta',
        signOptions: { expiresIn: '60s' },
      }),
    }),
  ],
  providers: [AuthService, JwtStrategy],
  exports: [JwtStrategy, JwtModule],
  controllers: [AuthController],
})
export class AuthModule {}
