const KeeperRegistry = artifacts.require("KeeperRegistry");

// ============ Main Migration ============

const migration = async (deployer, network, accounts) => {
    await Promise.all([deployToken(deployer, network, accounts)]);
};

module.exports = migration;

// ============ Deploy Functions ============

async function deployToken(deployer, network, accounts) {
    // keeper
    await deployer.deploy(KeeperRegistry);
}
