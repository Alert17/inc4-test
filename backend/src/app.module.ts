import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import configuration from './config';
import { StakingModule } from './staking/staking.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [configuration],
      isGlobal: true, // делает конфигурацию доступной во всей программе
    }),
    StakingModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
