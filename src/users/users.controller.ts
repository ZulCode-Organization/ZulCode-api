import { Controller, Get, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { CurrentUserDto } from '../auth/current-user.dto';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('profile')
  getProfile(@CurrentUser() user: CurrentUserDto) {
    return this.usersService.getProfile(user.sub);
  }

  @Get('inventory')
  getInventory(@CurrentUser() user: CurrentUserDto) {
    return this.usersService.getInventory(user.sub);
  }
}
