require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();
require("hardhat-deploy");
require("hardhat-deploy-ethers");

const SEPOLIA_RPC_URL = process.env.SEPOLIA_RPC_URL
const PK_1 = process.env.SEPOLIA_PK_1;
const PK_2 = process.env.SEPOLIA_PK_2;
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY;
const COINMARKETCAP_API_KEY = process.env.COINMARKETCAP_API_KEY;

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.20",
  namedAccounts: {
    deployer: {
      default: 0,
      11155111: 0,
    },
    seller:{
      default: 1,
    },
    buyer: {
      default: 2,
    }
  },
  networks: {
    sepolia: {
      url: SEPOLIA_RPC_URL,
      accounts: [PK_1, PK_2],
      chainId: 11155111,
      blockConfirmations: 6
    },
    localhost: {
      url: "http://127.0.0.1:8545/",
      chainId: 31337
    },
    Mumbai: {
      chainId: 80001,
      url: " https://rpc-mumbai.maticvigil.com",
      accounts: [PK_1, PK_2],
      blockConfirmations: 6
    }
  },
  etherscan: {
    apiKey: ETHERSCAN_API_KEY
  },
  gasReporter: {
    currency: 'USD',
    coinmarketcap: COINMARKETCAP_API_KEY,
    token: "ETH",
  },
  //time it waits for test to complete
  mocha: {
    timeout: 300000,
  }
};
