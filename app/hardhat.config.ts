import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";

require('dotenv').config();

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.0",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    airdaoTest: {
      url: "https://network.ambrosus-test.io",
      chainId: 22040,
      accounts: [`0x${process.env.PRIVATE_KEY}`],
      gas: 500000,
      gasPrice: 20000000000,
    },
  }
};

export default config;
