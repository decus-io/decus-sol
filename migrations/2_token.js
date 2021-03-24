const EBTC = artifacts.require("EBTC");
const DeCus = artifacts.require("DeCus");
const AssetLib = artifacts.require("AssetLib");
const AssetMeta = artifacts.require("AssetMeta");
const CollateralLib = artifacts.require("CollateralLib");

const externalContracts = require("./external");

// ============ Main Migration ============

const migration = async (deployer, network, accounts) => {
    await Promise.all([deployToken(deployer, network, accounts)]);
};

module.exports = migration;

// ============ Deploy Functions ============

async function deployToken(deployer, network, accounts) {
    // assets
    await deployer.deploy(EBTC);
    await deployer.deploy(DeCus);

    let wbtc;
    if (network === "development" || network === "test") {
        const MockWBTC = artifacts.require("WBTC");
        await deployer.deploy(MockWBTC);
        wbtc = MockWBTC.address;
    } else {
        // mainnet, ropsten, kovan
        wbtc = externalContracts.WBTC[network];
    }
    console.log(`WBTC address: ${wbtc}`);

    await deployer.deploy(AssetMeta, [wbtc]);

    // Libs
    await deployer.deploy(AssetLib);
    await deployer.deploy(CollateralLib);
}
