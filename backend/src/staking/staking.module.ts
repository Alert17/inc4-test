import { Module } from '@nestjs/common';
import { StakingService } from './staking.service';
import { StakingController } from './staking.controller';
import { DatabaseModule } from '../db/db.module';

@Module({
  imports: [DatabaseModule],
  providers: [StakingService],
  controllers: [StakingController],
})
export class StakingModule {}
