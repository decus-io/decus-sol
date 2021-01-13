const AssetLib = artifacts.require("AssetLib");
const CollateralLib = artifacts.require("CollateralLib");
const GroupLib = artifacts.require("GroupLib");

const KeeperNFT = artifacts.require("KeeperNFT");
const KeeperRegistry = artifacts.require("KeeperRegistry");
//const GroupRegistry = artifacts.require("GroupRegistry");
//const ReceiptController = artifacts.require("ReceiptController");
//const DeCusSystem = artifacts.require("DeCusSystem");

const libs = [
  AssetLib,
  CollateralLib,
  GroupLib,
]

const migration = async (deployer, network, accounts) => {
    await deployer.deploy(KeeperRegistry, accounts[0], accounts[0]);

    const keeper_registry = await KeeperRegistry.deployed();

    await deployer.deploy(KeeperNFT, keeper_registry.address);
}

module.exports = migration

