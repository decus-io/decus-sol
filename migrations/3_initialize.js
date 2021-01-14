const EBTC = artifacts.require("EBTC");
const AssetMeta = artifacts.require("AssetMeta");
const KeeperNFT = artifacts.require("KeeperNFT");
const KeeperRegistry = artifacts.require("KeeperRegistry");
const GroupRegistry = artifacts.require("GroupRegistry");
const ReceiptController = artifacts.require("ReceiptController");
const DeCusSystem = artifacts.require("DeCusSystem");


const migration = async (deployer, network, accounts) => {
    const keeper_registry = await KeeperRegistry.deployed();
    keeper_registry.setDependencies(KeeperNFT.address, AssetMeta.address);
    console.log('KeeperRegistry set dependencies');

    const decus_system = await DeCusSystem.deployed();
    decus_system.setDependencies(EBTC.address, GroupRegistry.address, ReceiptController.address);
    console.log('DeCusSystem set dependencies');
}

module.exports = migration

