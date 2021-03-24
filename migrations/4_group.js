const GroupLib = artifacts.require("GroupLib");
const GroupRegistry = artifacts.require("GroupRegistry");
const ReceiptController = artifacts.require("ReceiptController");

// ============ Main Migration ============

const migration = async (deployer, network, accounts) => {
    await Promise.all([deployToken(deployer, network, accounts)]);
};

module.exports = migration;

// ============ Deploy Functions ============

async function deployToken(deployer, network, accounts) {
    // Libs
    await deployer.deploy(GroupLib);

    // group
    await deployer.deploy(GroupRegistry);

    // receipt
    await deployer.deploy(ReceiptController);
}
