import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ShopService {
  constructor(private readonly prisma: PrismaService) {}

  async getItems() {
    return this.prisma.shopItem.findMany();
  }

  async buyItem(userId: string, shopItemId: string) {
    const item = await this.prisma.shopItem.findUnique({
      where: { id: shopItemId },
    });

    if (!item) {
      throw new NotFoundException('Item not found');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.coins < item.price) {
      throw new BadRequestException('Not enough coins');
    }

    // Process purchase in a transaction
    return this.prisma.$transaction(async (tx) => {
      // Deduct coins
      await tx.user.update({
        where: { id: userId },
        data: { coins: { decrement: item.price } },
      });

      // Check if user already has it
      const existingInventory = await tx.userInventory.findUnique({
        where: {
          userId_shopItemId: {
            userId,
            shopItemId,
          },
        },
      });

      if (existingInventory) {
        return tx.userInventory.update({
          where: { id: existingInventory.id },
          data: { quantity: { increment: 1 } },
        });
      } else {
        return tx.userInventory.create({
          data: {
            userId,
            shopItemId,
            quantity: 1,
          },
        });
      }
    });
  }
}
