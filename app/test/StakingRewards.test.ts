import { expect } from "chai";
import { ethers } from "hardhat";
import { Signer } from "ethers";
import { ERC20Mock, StakingRewards, ERC20Mock2 } from "../typechain-types";

describe("StakingRewards", function () {
  let owner: Signer;
  let user1: Signer;
  let user2: Signer;
  let tokenA: ERC20Mock;
  let tokenB: ERC20Mock2;
  let stakingRewards: StakingRewards;

  beforeEach(async function () {
    [owner, user1, user2] = await ethers.getSigners();

    tokenA = await ethers.deployContract("ERC20Mock", ["Pool Token", "POOL"]) as ERC20Mock;
    tokenB = await ethers.deployContract("ERC20Mock2", ["Reward Token", "REWARD"]) as ERC20Mock2;

    stakingRewards = await ethers.deployContract("StakingRewards", [await tokenA.getAddress(), await tokenB.getAddress()]) as StakingRewards;

    // Mint some tokens for the users
    await tokenA.mint(await user1.getAddress(), ethers.parseEther("100"));
    await tokenA.mint(await user2.getAddress(), ethers.parseEther("100"));
    await tokenB.mint(await owner.getAddress(), ethers.parseEther("1000"));
  });

  describe("Deposit functionality", function () {
    it("Should allow users to deposit tokens", async function () {
      await tokenA.connect(user1).approve(await stakingRewards.getAddress(), ethers.parseEther("50"));
      await stakingRewards.connect(user1).deposit(ethers.parseEther("50"));

      const user1Stake = await stakingRewards.getStakeBalance(await user1.getAddress());
      expect(user1Stake).to.equal(ethers.parseEther("50"));
    });

    it("Should emit a Deposit event", async function () {
      await tokenA.connect(user1).approve(await stakingRewards.getAddress(), ethers.parseEther("50"));
      await expect(stakingRewards.connect(user1).deposit(ethers.parseEther("50")))
        .to.emit(stakingRewards, "Deposited")
        .withArgs(await user1.getAddress(), ethers.parseEther("50"));
    });
  });

  describe("Withdraw functionality", function () {
    it("Should allow users to withdraw staked tokens", async function () {
      await tokenA.connect(user1).approve(await stakingRewards.getAddress(), ethers.parseEther("50"));
      await stakingRewards.connect(user1).deposit(ethers.parseEther("50"));
      await stakingRewards.connect(user1).withdraw(ethers.parseEther("30"));

      const user1Stake = await stakingRewards.getStakeBalance(await user1.getAddress());
      expect(user1Stake).to.equal(ethers.parseEther("20"));
    });

    it("Should emit a Withdrawn event", async function () {
      await tokenA.connect(user1).approve(await stakingRewards.getAddress(), ethers.parseEther("50"));
      await stakingRewards.connect(user1).deposit(ethers.parseEther("50"));
      await expect(stakingRewards.connect(user1).withdraw(ethers.parseEther("30")))
        .to.emit(stakingRewards, "Withdrawn")
        .withArgs(await user1.getAddress(), ethers.parseEther("30"));
    });
  });

  describe("Reward distribution", function () {
    it("Should distribute rewards correctly", async function () {
      await tokenA.connect(user1).approve(await stakingRewards.getAddress(), ethers.parseEther("50"));
      await tokenA.connect(user2).approve(await stakingRewards.getAddress(), ethers.parseEther("50"));
      await stakingRewards.connect(user1).deposit(ethers.parseEther("50"));
      await stakingRewards.connect(user2).deposit(ethers.parseEther("50"));

      await tokenB.connect(owner).approve(await stakingRewards.getAddress(), ethers.parseEther("100"));
      await stakingRewards.connect(owner).depositReward(ethers.parseEther("100"));

      await stakingRewards.connect(owner).distributeRewards([await user1.getAddress(), await user2.getAddress()], ethers.parseEther("100"));

      const user1Reward = await stakingRewards.getRewardBalance(await user1.getAddress());
      const user2Reward = await stakingRewards.getRewardBalance(await user2.getAddress());

      expect(user1Reward).to.equal(ethers.parseEther("50"));
      expect(user2Reward).to.equal(ethers.parseEther("50"));
    });

    it("Should emit RewardsDistributed event", async function () {
      await tokenA.connect(user1).approve(await stakingRewards.getAddress(), ethers.parseEther("50"));
      await stakingRewards.connect(user1).deposit(ethers.parseEther("50"));
      await tokenB.connect(owner).approve(await stakingRewards.getAddress(), ethers.parseEther("100"));
      await stakingRewards.connect(owner).depositReward(ethers.parseEther("100"));

      await expect(stakingRewards.connect(owner).distributeRewards([await user1.getAddress()], ethers.parseEther("100")))
        .to.emit(stakingRewards, "RewardsDistributed")
        .withArgs(ethers.parseEther("100"), [await user1.getAddress()]);
    });
  });

  describe("Claim reward", function () {
    it("Should allow users to claim rewards", async function () {
      await tokenA.connect(user1).approve(await stakingRewards.getAddress(), ethers.parseEther("50"));
      await stakingRewards.connect(user1).deposit(ethers.parseEther("50"));
      await tokenB.connect(owner).approve(await stakingRewards.getAddress(), ethers.parseEther("100"));
      await stakingRewards.connect(owner).depositReward(ethers.parseEther("100"));

      await stakingRewards.connect(owner).distributeRewards([await user1.getAddress()], ethers.parseEther("100"));

      const initialUser1Balance = BigInt(await tokenB.balanceOf(await user1.getAddress()));
      await stakingRewards.connect(user1).claimReward(ethers.parseEther("50"));

      const finalUser1Balance = BigInt(await tokenB.balanceOf(await user1.getAddress()));
      expect(BigInt(finalUser1Balance.toString()) - BigInt(initialUser1Balance.toString())).to.equal(BigInt(ethers.parseEther("50").toString()));
    });

    it("Should emit RewardClaimed event", async function () {
      await tokenA.connect(user1).approve(await stakingRewards.getAddress(), ethers.parseEther("50"));
      await stakingRewards.connect(user1).deposit(ethers.parseEther("50"));
      await tokenB.connect(owner).approve(await stakingRewards.getAddress(), ethers.parseEther("100"));
      await stakingRewards.connect(owner).depositReward(ethers.parseEther("100"));

      await stakingRewards.connect(owner).distributeRewards([await user1.getAddress()], ethers.parseEther("100"));

      await expect(stakingRewards.connect(user1).claimReward(ethers.parseEther("50")))
        .to.emit(stakingRewards, "RewardClaimed")
        .withArgs(await user1.getAddress(), ethers.parseEther("50"));
    });
  });
});
