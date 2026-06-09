import { Controller, Get, Post, Param, UseGuards } from '@nestjs/common';
import { ShopService } from './shop.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { CurrentUserDto } from '../auth/current-user.dto';

@Controller('shop')
@UseGuards(JwtAuthGuard)
export class ShopController {
  constructor(private readonly shopService: ShopService) {}

  @Get('items')
  getItems() {
    return this.shopService.getItems();
  }

  @Post('buy/:id')
  buyItem(@CurrentUser() user: CurrentUserDto, @Param('id') id: string) {
    return this.shopService.buyItem(user.sub, id);
  }
}
