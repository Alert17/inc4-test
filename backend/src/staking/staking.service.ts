import { Injectable } from '@nestjs/common';
import { ethers } from 'ethers';
import { PrismaService } from '../db/prisma.service';
import { ConfigService } from '@nestjs/config';
import ABI from './static/ABI.json';

@Injectable()
export class StakingService {
  private provider: ethers.JsonRpcProvider;
  private contract: ethers.Contract;

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {
    // Получение URL RPC и адреса контракта из конфигурации
    const RPC_URL = this.configService.get<string>('rpcUrl');
    const CONTRACT_ADDRESS = this.configService.get<string>('contractAddress') ?? '';

    // Инициализация провайдера и контракта
    this.provider = new ethers.JsonRpcProvider(RPC_URL);
    this.contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, this.provider);

    // Прослушивание событий контракта
    this.listenToEvents();
  }

  private listenToEvents() {
    // Прослушивание события RewardsDistributed
    this.contract.on('RewardsDistributed', async (totalReward, stakers) => {
      console.log(`Rewards Distributed: ${totalReward}, Stakers: ${stakers}`);
      try {
        await this.prisma.statistics.update({
          where: { id: 1 },
          data: { totalRewards: { increment: parseFloat(totalReward) } },
        });
      } catch (error) {
        console.error('Error updating statistics for RewardsDistributed event', error);
      }
    });

    // Прослушивание события Deposited
    this.contract.on('Deposited', async (user, amount) => {
      console.log(`Deposited: ${user}, Amount: ${amount}`);
      try {
        await this.prisma.user.upsert({
          where: { wallet: user },
          update: { stake: { increment: parseFloat(amount) } },
          create: { wallet: user, stake: parseFloat(amount), reward: 0 },
        });
      } catch (error) {
        console.error('Error updating user for Deposited event', error);
      }
    });

    // Прослушивание события Withdrawn
    this.contract.on('Withdrawn', async (user, amount) => {
      console.log(`Withdrawn: ${user}, Amount: ${amount}`);
      try {
        await this.prisma.user.update({
          where: { wallet: user },
          data: { stake: { decrement: parseFloat(amount) } },
        });
      } catch (error) {
        console.error('Error updating user for Withdrawn event', error);
      }
    });

    // Прослушивание события RewardClaimed
    this.contract.on('RewardClaimed', async (user, reward) => {
      console.log(`Reward Claimed: ${user}, Reward: ${reward}`);
      try {
        await this.prisma.user.update({
          where: { wallet: user },
          data: { reward: { decrement: parseFloat(reward) } },
        });
      } catch (error) {
        console.error('Error updating user for RewardClaimed event', error);
      }
    });
  }

  // Метод для распределения наград
  async distributeRewards(stakers: string[], totalReward: number) {
    const privateKey = this.configService.get<string>('privateKey') || '';
    const signer = new ethers.Wallet(privateKey, this.provider);
    const contractWithSigner = this.contract.connect(signer);

    try {
      await (contractWithSigner as any).distributeRewards(stakers, totalReward);
      console.log('Rewards distributed successfully');
    } catch (error) {
      console.error('Error distributing rewards', error);
    }
  }

  // Получение статистики
  async getStatistics() {
    try {
      const totalStaked = await this.prisma.user.aggregate({
        _sum: { stake: true },
      });
      const totalRewards = await this.prisma.statistics.findUnique({
        where: { id: 1 },
        select: { totalRewards: true },
      });
      const totalUsers = await this.prisma.user.count();

      return {
        totalStaked: totalStaked._sum.stake || 0,
        totalRewards: totalRewards?.totalRewards || 0,
        totalUsers,
      };
    } catch (error) {
      console.error('Error fetching statistics', error);
      throw error;
    }
  }
}
