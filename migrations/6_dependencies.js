const EBTC = artifacts.require("EBTC");
const AssetMeta = artifacts.require("AssetMeta");
const KeeperRegistry = artifacts.require("KeeperRegistry");
const GroupRegistry = artifacts.require("GroupRegistry");
const ReceiptController = artifacts.require("ReceiptController");
const DeCusSystem = artifacts.require("DeCusSystem");

const MINTER_ROLE = web3.utils.soliditySha3("MINTER_ROLE");
const KEEPER_ADMIN_ROLE = web3.utils.soliditySha3("KEEPER_ADMIN_ROLE");
const GROUP_ADMIN_ROLE = web3.utils.soliditySha3("GROUP_ADMIN_ROLE");
const RECEIPT_ADMIN_ROLE = web3.utils.soliditySha3("GROUP_ADMIN_ROLE");

const migration = async (deployer, network, accounts) => {
    const decusSystem = await DeCusSystem.deployed();

    // tokens
    const ebtc = await EBTC.deployed();
    await ebtc.grantRole(MINTER_ROLE, decusSystem.address);

    // keeper
    const keeperRegistry = await KeeperRegistry.deployed();
    keeperRegistry.setDependencies(AssetMeta.address);
    await keeperRegistry.grantRole(KEEPER_ADMIN_ROLE, decusSystem.address);
    console.log("KeeperRegistry set dependencies: %s", AssetMeta.address);

    // group
    const groupRegistry = await GroupRegistry.deployed();
    await groupRegistry.grantRole(GROUP_ADMIN_ROLE, decusSystem.address);

    // receipt
    const receiptController = await ReceiptController.deployed();
    await receiptController.grantRole(RECEIPT_ADMIN_ROLE, decusSystem.address);

    // decus system
    decusSystem.setDependencies(
        EBTC.address,
        KeeperRegistry.address,
        GroupRegistry.address,
        ReceiptController.address
    );
    console.log(
        "DeCusSystem set dependencies: %s %s %s %s %s",
        EBTC.address,
        KeeperRegistry.address,
        GroupRegistry.address,
        ReceiptController.address
    );
};

module.exports = migration;
