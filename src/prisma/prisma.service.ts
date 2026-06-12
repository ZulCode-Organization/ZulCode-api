import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

/**
 * PrismaService encapsula o PrismaClient com o driver adapter PrismaPg.
 *
 * Nota: o PrismaClient é estendido normalmente — this.user, this.passwordResetToken etc.
 * estão disponíveis em runtime. Se o IntelliSense do VS Code não reconhecer essas
 * propriedades, rode `npx prisma generate` e reinicie o Language Server (Ctrl+Shift+P →
 * "TypeScript: Restart TS Server") para forçar a releitura dos tipos gerados.
 */
@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor() {
    const adapter = new PrismaPg(process.env.DATABASE_URL ?? '');
    super({ adapter });
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
