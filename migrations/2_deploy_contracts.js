const EBTC = artifacts.require("EBTC");
const DeCus = artifacts.require("DeCus");
const AssetLib = artifacts.require("AssetLib");
const AssetMeta = artifacts.require("AssetMeta");
const GroupLib = artifacts.require("GroupLib");
const CollateralLib = artifacts.require("CollateralLib");
const KeeperNFT = artifacts.require("KeeperNFT");
const KeeperRegistry = artifacts.require("KeeperRegistry");
const GroupRegistry = artifacts.require("GroupRegistry");
const ReceiptController = artifacts.require("ReceiptController");
const DeCusSystem = artifacts.require("DeCusSystem");
const SignatureValidator = artifacts.require("SignatureValidator");

const externalContracts = require("./external");

// ============ Main Migration ============

const migration = async (deployer, network, accounts) => {
    await Promise.all([deployToken(deployer, network, accounts)]);
};

module.exports = migration;

// ============ Deploy Functions ============

async function deployToken(deployer, network, accounts) {
    // system
    await deployer.deploy(DeCusSystem, accounts[0]);

    // assets
    await deployer.deploy(EBTC, accounts[0], DeCusSystem.address);
    await deployer.deploy(DeCus, accounts[0]);

    let wbtc;
    if (network === "development" || network === "test") {
        const MockWBTC = artifacts.require("WBTC");
        await deployer.deploy(MockWBTC);
        wbtc = MockWBTC.address;
    } else {
        // mainnet or kovan
        wbtc = externalContracts.WBTC[network];
    }
    console.log(`WBTC address: ${wbtc}`);

    await deployer.deploy(AssetMeta, [wbtc]);

    // Libs
    await deployer.deploy(AssetLib);
    await deployer.deploy(CollateralLib);
    await deployer.deploy(GroupLib);

    // keeper
    await deployer.deploy(KeeperRegistry, accounts[0], DeCusSystem.address);

    await deployer.deploy(KeeperNFT, KeeperRegistry.address);

    // group
    await deployer.deploy(GroupRegistry, accounts[0], DeCusSystem.address);
    await deployer.deploy(ReceiptController, DeCusSystem.address);

    // validator
    await deployer.deploy(SignatureValidator);
}
