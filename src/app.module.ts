import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { FeatureModule } from './feature/feature.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  // O módulo ficará disponívelo para toda a aplicação, pois é o módulo raiz(isGloblal: true).
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    FeatureModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
