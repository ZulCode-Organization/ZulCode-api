import { Module } from '@nestjs/common';
<<<<<<< HEAD
<<<<<<< HEAD
import { JwtModule } from '@nestjs/jwt'
import { AppController } from './app.controller';
import { UsersService } from './users/users.service';

@Module({
  imports: [
    JwtModule.register({
      secret: 'senha-secreta',
      signOptions: { expiresIn: '1h'}, 
    }),
  ],
  controllers: [AppController],
  providers: [UsersService],
=======

@Module({
  imports: [],
  controllers: [],
  providers: [],
>>>>>>> c62b21e95afd1b1bf4982f590e2e86ae52fa35d3
=======
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { ConfigModule } from '@nestjs/config';
import { FeatureModule } from './feature/feature.module';

@Module({
  imports: [
    AuthModule,
    ConfigModule.forRoot({ isGlobal: true }),
    FeatureModule,
  ],
  controllers: [AppController],
  providers: [AppService],
>>>>>>> origin/master
})
export class AppModule {}
