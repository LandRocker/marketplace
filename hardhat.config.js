require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();
require("@openzeppelin/hardhat-upgrades");
require("solidity-coverage");
require("@nomicfoundation/hardhat-chai-matchers");
require("hardhat-laika");
require("hardhat-gas-reporter");

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  networks: {
    localhost: { url: "http://127.0.0.1:8545" },

    hardhat: {
      chainId: 31337, // This is required for the Chainlink Aggregator to work properly
    },

    goerli: {
      url: `https://eth-goerli.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`,
      accounts: [process.env.PRIVATE_KEY],
    },
    laika: {
      url: "https://rpc.laika.trustlines.foundation",
      accounts: [process.env.PRIVATE_KEY],
    },

    bsctest: {
      url: `https://rpc.ankr.com/bsc_testnet_chapel/${process.env.ANKR_KEY}`,
      accounts: [process.env.PRIVATE_KEY],
    },
    amoy: {
      url: `https://polygon-amoy.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`,
      accounts: [process.env.PRIVATE_KEY],
    },
    mumbai: {
      url: `https://polygon-mumbai.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`,
      accounts: [process.env.PRIVATE_KEY],
    },
    mainnet: {
      url: `https://polygon-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`,
      accounts: [process.env.PRIVATE_KEY],
    },
    // skale: {
    //   url: process.env.SKALE_ENDPOINT,
    //   accounts: [process.env.PRIVATE_KEY],
    // },
  },
  // customChains: [
  //   {
  //     network: "skale",
  //     chainId: parseInt(process.env.CHAIN_ID),
  //     urls: {
  //       apiURL: process.env.API_URL,
  //       browserURL: process.env.BLOCKEXPLORER_URL,
  //     },
  //   },
  // ],

  solidity: {
    version: "0.8.6",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
  },

  mocha: { timeout: 40000000 },

  gasReporter: {
    enabled: true,
    currency: "USD",
    outputFile: "gas-report.txt",
    gasPriceApi: "https://api.bscscan.com/api?module=proxy&action=eth_gasPrice",
    token: "BNB",
  },

  etherscan: {
    apiKey: `${process.env.POLYGON_SCAN_KEY}`,
  },
};
