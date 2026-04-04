import { Module } from '@nestjs/common';
import { AppController } from 'src/app.controller';
import { UsersService } from './users/users.service';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [AppController],
  providers: [UsersService],
})
export class AppModule {}
