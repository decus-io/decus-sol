const KeeperRegistry = artifacts.require("KeeperRegistry");
const { getWBTC } = require("./helpers");

const migration = async (deployer, network, accounts) => {
    // add keepers
    const wbtc = await getWBTC(network);
    const keepers = [accounts[0], accounts[1], accounts[2]];
    const amount = 100000;

    for (const keeper of keepers) {
        const keeperRegistry = await KeeperRegistry.deployed();

        const overrides = {
            // gasLimit: 1000000,
            // gasPrice: "1000000000",
            // value: ethers.utils.parseEther("0"),
            from: keeper,
        };
        const approveTx = await wbtc.approve(keeperRegistry.address, "1000000000000", overrides);
        console.log(`${keeper} approve at ${approveTx}`);

        const tx = await keeperRegistry.addKeeper(keeper, [wbtc.address], [amount], overrides);
        console.log(`${keeper} added at ${tx}`);
    }
};

module.exports = migration;
