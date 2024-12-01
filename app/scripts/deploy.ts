import { ethers } from "hardhat";

async function main() {
  const [owner] = await ethers.getSigners();

  console.log("Deploying contracts with the account:", owner.address);

  const tokenA = await ethers.deployContract("ERC20Mock", ["Pool77", "POOL76"], {
    gasPrice: ethers.parseUnits("10", "gwei")
  });

  await tokenA.waitForDeployment();

  const tokenB = await ethers.deployContract("ERC20Mock2", ["Reward77", "REWW76"], {
    gasPrice: ethers.parseUnits("10", "gwei")
  });

  await tokenB.waitForDeployment();

  console.log("Pool Token deployed to:", await tokenA.getAddress());
  console.log("Reward Token deployed to:", await tokenB.getAddress());

  const stakingRewards = await ethers.deployContract("StakingRewards", [await tokenA.getAddress(), await tokenB.getAddress()]);

  await stakingRewards.waitForDeployment();

  console.log("StakingRewards contract deployed to:", await stakingRewards.getAddress());
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
