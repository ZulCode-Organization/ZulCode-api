import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        role: true,
        xp: true,
        coins: true,
        hearts: true,
        streak: true,
        lastActive: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async getInventory(userId: string) {
    const inventory = await this.prisma.userInventory.findMany({
      where: { userId },
      include: {
        shopItem: true,
      },
    });
    return inventory;
  }

  async addXp(userId: string, amount: number) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { xp: { increment: amount } },
    });
  }

  async addCoins(userId: string, amount: number) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { coins: { increment: amount } },
    });
  }

  async updateHearts(userId: string, amount: number) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { hearts: Math.max(0, amount) }, // Can't go below 0
    });
  }
}
