import { task } from "hardhat/config";
import "@nomiclabs/hardhat-waffle";
import "@nomiclabs/hardhat-etherscan";
import "@nomiclabs/hardhat-ethers";
import "hardhat-gas-reporter";
import "hardhat-typechain";
import "hardhat-deploy";
import { HardhatUserConfig } from "hardhat/types";

// This is a sample Hardhat task. To learn how to create your own go to
// https://hardhat.org/guides/create-task.html
task("accounts", "Prints the list of accounts", async (args, hre) => {
  const accounts = await hre.ethers.getSigners();

  console.log("Network", hre.network.name);

  for (const account of accounts.slice(0, 10)) {
    console.log(account.address);
  }
});

task("accounts", "Prints the list of accounts", async (args, hre) => {
  const accounts = await hre.ethers.getSigners();

  console.log("Network", hre.network.name);

  for (const account of accounts.slice(0, 10)) {
    console.log(account.address);
  }
});

let config: HardhatUserConfig = {
  solidity: {
    version: "0.8.3",
    settings: {
      optimizer: {
        enabled: true,
        runs: 1000,
      },
    },
  },
  networks: {
    hardhat: {
      accounts: {
        count: 1000,
      },
    },
  },
  paths: {
    artifacts: "./build/artifacts",
    cache: "./build/cache",
    deployments: "./build/deployments",
  },
  typechain: {
    outDir: "./build/typechain/",
    target: "ethers-v5",
  },
  gasReporter: {
    enabled: process.env.REPORT_GAS ? true : false,
    currency: "USD",
    gasPrice: 100,
    coinmarketcap: process.env.CMC_KEY,
  },
  etherscan: {
    apiKey: `${process.env.ETHERSCAN_API_KEY}`,
  },
  mocha: {
    timeout: 200000,
  },
  namedAccounts: {
    deployer: 0,
  },
};

const etherscan_key = process.env.ETHERSCAN_API_KEY;
if (etherscan_key) {
  config = { ...config, etherscan: { apiKey: etherscan_key } };
}

const infuraId = process.env.INFURA_PROJECT_ID;
if (infuraId) {
  const privateKey = `0x${process.env.PRIVATE_KEY}`;
  config.networks = {
    ...config.networks,
    kovan: {
      url: `https://kovan.infura.io/v3/${infuraId}`,
      accounts: [privateKey],
      throwOnTransactionFailures: true,
      throwOnCallFailures: false,
    },
    ropsten: {
      url: `https://ropsten.infura.io/v3/${infuraId}`,
      accounts: [privateKey],
      throwOnTransactionFailures: true,
      throwOnCallFailures: false,
    },
  };
}

export default config;
