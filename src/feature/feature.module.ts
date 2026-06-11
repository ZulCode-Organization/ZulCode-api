import { Module } from '@nestjs/common';
import { FeatureController } from './feature.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [FeatureController],
})
export class FeatureModule {}
