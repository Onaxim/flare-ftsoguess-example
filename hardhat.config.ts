require('dotenv').config();
import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import '@nomicfoundation/hardhat-chai-matchers';
import '@nomicfoundation/hardhat-ethers';
import '@typechain/hardhat';
import 'hardhat-gas-reporter';
import 'solidity-coverage';
import 'hardhat-deploy';

const privateKey1 = process.env.PRIVATE_KEY1 || ""
const privateKey2 = process.env.PRIVATE_KEY2 || ""
const costwoRpc = process.env.COSTWO_RPC


const config: HardhatUserConfig = {
  solidity: "0.7.6",
  networks: {
    costwo: {
      url: costwoRpc,
      accounts: [privateKey1, privateKey2]
    }
  },
  namedAccounts: {
    deployer: {
      default: 0, // here this will by default take the first account as deployer
      1: 0, // similarly on mainnet it will take the first account as deployer. Note though that depending on how hardhat network are configured, the account 0 on one network can be different than on another
      4: '0xD71d4569544ac700f2951c8CCe6fD1a051B55754', // but for rinkeby it will be a specific address
    },
  }
};

export default config;
