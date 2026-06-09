import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { AppController } from './app.controller';
import { FeatureModule } from './feature/feature.module';
import { PrismaModule } from './prisma/prisma.module';
import { UsersModule } from './users/users.module';
import { ShopModule } from './shop/shop.module';
import { CoursesModule } from './courses/courses.module';

@Module({
  // O módulo ficará disponívelo para toda a aplicação, pois é o módulo raiz(isGloblal: true).
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    FeatureModule,
    UsersModule,
    ShopModule,
    CoursesModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
