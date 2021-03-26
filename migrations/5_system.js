const DeCusSystem = artifacts.require("DeCusSystem");

// ============ Main Migration ============

const migration = async (deployer, network, accounts) => {
    await Promise.all([deployToken(deployer, network, accounts)]);
};

module.exports = migration;

// ============ Deploy Functions ============

async function deployToken(deployer, network, accounts) {
    // system
    await deployer.deploy(DeCusSystem);
}
