import { DeploymentsExtension } from "hardhat-deploy/dist/types";
import {
  ethers,
  deployments,
  getNamedAccounts,
  getUnnamedAccounts,
} from "hardhat";

import {
  WBTC,
  HBTC,
  OtherCoin,
  AssetMeta,
  AssetLibMock,
} from "../../build/typechain";

export const getContractOrDeploy = async (
  addr: string,
  name: string,
  deployments: DeploymentsExtension,
  deployer: string
) => {
  let contract;
  if (addr) {
    contract = await ethers.getContractAt(name, addr);
    console.log(`Get ${name} Contract: ${contract.address}`);
  } else {
    contract = await deployments.deploy(name, {
      from: deployer,
      args: [],
      log: true,
    });
    console.log(`Deploy ${name} Contract: ${contract.address}`);
  }

  return contract;
};

export const setup = async () => {
  await deployments.fixture();

  const contracts = {
    wbtc: (await ethers.getContract("WBTC")) as WBTC,
    hbtc: (await ethers.getContract("HBTC")) as HBTC,
    other: (await ethers.getContract("OtherCoin")) as OtherCoin,
    meta: (await ethers.getContract("AssetMeta")) as AssetMeta,
    lib: (await ethers.getContract("AssetLibMock")) as AssetLibMock,
  };

  const { owner } = await getNamedAccounts();
  const users = await getUnnamedAccounts();

  return {
    ...contracts,
    users,
    owner: owner,
  };
};
