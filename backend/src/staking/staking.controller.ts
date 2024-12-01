import { Controller, Get, Post, Body } from '@nestjs/common';
import { StakingService } from './staking.service';

@Controller('staking')
export class StakingController {
  constructor(private readonly stakingService: StakingService) {}

  // Метод для распределения наград с правильной типизацией параметров
  @Post('distribute-rewards')
  async distributeRewards(
    @Body() body: { stakers: string[]; totalReward: number } // Типизация для объекта в body
  ): Promise<{ message: string }> {
    const { stakers, totalReward } = body; 
    await this.stakingService.distributeRewards(stakers, totalReward);
    return { message: 'Rewards distributed successfully' };
  }

  // Метод для получения статистики
  @Get('statistics')
  async getStatistics(): Promise<{ totalStaked: number; totalRewards: number; totalUsers: number }> {
    return this.stakingService.getStatistics();
  }
}
