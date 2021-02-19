const EBTC = artifacts.require("EBTC");
const AssetMeta = artifacts.require("AssetMeta");
const KeeperNFT = artifacts.require("KeeperNFT");
const KeeperRegistry = artifacts.require("KeeperRegistry");
const GroupRegistry = artifacts.require("GroupRegistry");
const ReceiptController = artifacts.require("ReceiptController");
const DeCusSystem = artifacts.require("DeCusSystem");

const externalContracts = require("./external");

const migration = async (deployer, network, accounts) => {
    const keeperRegistry = await KeeperRegistry.deployed();
    keeperRegistry.setDependencies(KeeperNFT.address, AssetMeta.address);
    console.log("KeeperRegistry set dependencies: %s %s", KeeperNFT.address, AssetMeta.address);

    if (network !== "development") {
        const KEEPER_ADMIN_ROLE = web3.utils.soliditySha3("KEEPER_ADMIN_ROLE");
        await keeperRegistry.grantRole(KEEPER_ADMIN_ROLE, externalContracts.AUCTION[network]);
    }

    const decusSystem = await DeCusSystem.deployed();
    decusSystem.setDependencies(
        EBTC.address,
        GroupRegistry.address,
        ReceiptController.address
    );
    console.log(
        "DeCusSystem set dependencies: %s %s %s",
        EBTC.address,
        GroupRegistry.address,
        ReceiptController.address
    );
};

module.exports = migration;
