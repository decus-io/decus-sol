import { DeploymentsExtension } from "hardhat-deploy/dist/types";
import { ethers, deployments, getNamedAccounts } from "hardhat";

import {
  WBTC,
  HBTC,
  OtherCoin,
  AssetMeta,
  AssetLibMock,
  SignatureValidator,
  ReceiptLibMock,
  ReceiptController,
  KeeperRegistry,
  GroupLibMock,
  GroupRegistry,
  DeCusSystem,
  CollateralLibMock,
  EBTC,
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
    ebtc: (await ethers.getContract("EBTC")) as EBTC,
    other: (await ethers.getContract("OtherCoin")) as OtherCoin,
    meta: (await ethers.getContract("AssetMeta")) as AssetMeta,
    assetLib: (await ethers.getContract("AssetLibMock")) as AssetLibMock,
    collateralLib: (await ethers.getContract(
      "CollateralLibMock"
    )) as CollateralLibMock,
    receiptLib: (await ethers.getContract("ReceiptLibMock")) as ReceiptLibMock,
    receiptController: (await ethers.getContract(
      "ReceiptController"
    )) as ReceiptController,
    keeperRegistry: (await ethers.getContract(
      "KeeperRegistry"
    )) as KeeperRegistry,
    groupLib: (await ethers.getContract("GroupLibMock")) as GroupLibMock,
    groupRegistry: (await ethers.getContract("GroupRegistry")) as GroupRegistry,
    decusSystem: (await ethers.getContract("DeCusSystem")) as DeCusSystem,
    validator: (await ethers.getContract(
      "SignatureValidator"
    )) as SignatureValidator,
  };

  const { deployer } = await getNamedAccounts();
  const users = (await ethers.getSigners()).slice(1);

  return {
    ...contracts,
    users,
    owner: await ethers.getSigner(deployer),
  };
};
