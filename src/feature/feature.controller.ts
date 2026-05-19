import { Controller, Get, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../auth/current-user.decorator';
import { CurrentUserDto } from '../auth/current-user.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('feature')
export class FeatureController {
  @Get('public')
  getPublicFeature() {
    return 'This is a public feature';
  }

  @Get('private')
  @UseGuards(JwtAuthGuard)
  getPrivateFeature(@CurrentUser() user: CurrentUserDto) {
    return `This is a private feature for user ${user.userId}`;
  }
}
