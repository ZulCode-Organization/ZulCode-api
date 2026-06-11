import { Controller, Get, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../auth/current-user.decorator';
import { CurrentUserDto } from '../auth/current-user.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decoreator';

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

  @Get('admin')// Uso da rota admin, que só pode ser acessada por usuários com a role 'admin'
  @Roles('admin') //Necessário criar um decorator de Roles e um guard para verificar as roles do usuário
  @UseGuards(JwtAuthGuard)
  getAdminFeature() { // é como se houvesse um array { roles: ['admin'] } 
    return `This is an admin route`;
  }
}
