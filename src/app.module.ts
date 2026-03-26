import { Module } from '@nestjs/common';
import { AppController } from 'src/app.controller';
import { UsersService } from './users/users.service';

@Module({
  imports: [],
  controllers: [AppController],
  providers: [UsersService],
})
export class AppModule {}
