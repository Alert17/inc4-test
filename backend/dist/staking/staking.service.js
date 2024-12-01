"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StakingService = void 0;
const common_1 = require("@nestjs/common");
const ethers_1 = require("ethers");
const prisma_service_1 = require("../db/prisma.service");
const config_1 = require("@nestjs/config");
const ABI_json_1 = __importDefault(require("./static/ABI.json"));
let StakingService = class StakingService {
    constructor(prisma, configService) {
        var _a;
        this.prisma = prisma;
        this.configService = configService;
        // Получение URL RPC и адреса контракта из конфигурации
        const RPC_URL = this.configService.get('rpcUrl');
        const CONTRACT_ADDRESS = (_a = this.configService.get('contractAddress')) !== null && _a !== void 0 ? _a : '';
        // Инициализация провайдера и контракта
        this.provider = new ethers_1.ethers.JsonRpcProvider(RPC_URL);
        this.contract = new ethers_1.ethers.Contract(CONTRACT_ADDRESS, ABI_json_1.default, this.provider);
        // Прослушивание событий контракта
        this.listenToEvents();
    }
    listenToEvents() {
        // Прослушивание события RewardsDistributed
        this.contract.on('RewardsDistributed', (totalReward, stakers) => __awaiter(this, void 0, void 0, function* () {
            console.log(`Rewards Distributed: ${totalReward}, Stakers: ${stakers}`);
            try {
                yield this.prisma.statistics.update({
                    where: { id: 1 },
                    data: { totalRewards: { increment: parseFloat(totalReward) } },
                });
            }
            catch (error) {
                console.error('Error updating statistics for RewardsDistributed event', error);
            }
        }));
        // Прослушивание события Deposited
        this.contract.on('Deposited', (user, amount) => __awaiter(this, void 0, void 0, function* () {
            console.log(`Deposited: ${user}, Amount: ${amount}`);
            try {
                yield this.prisma.user.upsert({
                    where: { wallet: user },
                    update: { stake: { increment: parseFloat(amount) } },
                    create: { wallet: user, stake: parseFloat(amount), reward: 0 },
                });
            }
            catch (error) {
                console.error('Error updating user for Deposited event', error);
            }
        }));
        // Прослушивание события Withdrawn
        this.contract.on('Withdrawn', (user, amount) => __awaiter(this, void 0, void 0, function* () {
            console.log(`Withdrawn: ${user}, Amount: ${amount}`);
            try {
                yield this.prisma.user.update({
                    where: { wallet: user },
                    data: { stake: { decrement: parseFloat(amount) } },
                });
            }
            catch (error) {
                console.error('Error updating user for Withdrawn event', error);
            }
        }));
        // Прослушивание события RewardClaimed
        this.contract.on('RewardClaimed', (user, reward) => __awaiter(this, void 0, void 0, function* () {
            console.log(`Reward Claimed: ${user}, Reward: ${reward}`);
            try {
                yield this.prisma.user.update({
                    where: { wallet: user },
                    data: { reward: { decrement: parseFloat(reward) } },
                });
            }
            catch (error) {
                console.error('Error updating user for RewardClaimed event', error);
            }
        }));
    }
    // Метод для распределения наград
    distributeRewards(stakers, totalReward) {
        return __awaiter(this, void 0, void 0, function* () {
            const privateKey = this.configService.get('privateKey') || '';
            const signer = new ethers_1.ethers.Wallet(privateKey, this.provider);
            const contractWithSigner = this.contract.connect(signer);
            try {
                yield contractWithSigner.distributeRewards(stakers, totalReward);
                console.log('Rewards distributed successfully');
            }
            catch (error) {
                console.error('Error distributing rewards', error);
            }
        });
    }
    // Получение статистики
    getStatistics() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const totalStaked = yield this.prisma.user.aggregate({
                    _sum: { stake: true },
                });
                const totalRewards = yield this.prisma.statistics.findUnique({
                    where: { id: 1 },
                    select: { totalRewards: true },
                });
                const totalUsers = yield this.prisma.user.count();
                return {
                    totalStaked: totalStaked._sum.stake || 0,
                    totalRewards: (totalRewards === null || totalRewards === void 0 ? void 0 : totalRewards.totalRewards) || 0,
                    totalUsers,
                };
            }
            catch (error) {
                console.error('Error fetching statistics', error);
                throw error;
            }
        });
    }
};
exports.StakingService = StakingService;
exports.StakingService = StakingService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        config_1.ConfigService])
], StakingService);
