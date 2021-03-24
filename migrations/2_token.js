const EBTC = artifacts.require("EBTC");
const DeCus = artifacts.require("DeCus");
const AssetLib = artifacts.require("AssetLib");
const AssetMeta = artifacts.require("AssetMeta");
const CollateralLib = artifacts.require("CollateralLib");

const { deployWBTC } = require("./helpers");

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

    const wbtc = await deployWBTC(deployer, network);

    await deployer.deploy(AssetMeta, [wbtc.address]);

    // Libs
    await deployer.deploy(AssetLib);
    await deployer.deploy(CollateralLib);
}
