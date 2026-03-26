import { Module } from '@nestjs/common';
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
})
export class AppModule {}
