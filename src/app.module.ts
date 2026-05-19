import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { AppController } from './app.controller';
import { FeatureModule } from './feature/feature.module';

@Module({
  // O módulo ficará disponívelo para toda a aplicação, pois é o módulo raiz(isGloblal: true).
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    AuthModule,
    FeatureModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
