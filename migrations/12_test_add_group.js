const DeCusSystem = artifacts.require("DeCusSystem");

const migration = async (deployer, network, accounts) => {
    // add keepers
    const keepers = [accounts[0], accounts[1], accounts[2]];
    const amount = 100000;
    const required = 2;
    const btcAddr = "2N2NDby9imzgSTHax1uacWUihdCfW35Ld5W";

    const overrides = {
        // gasLimit: 1000000,
        // gasPrice: "1000000000",
        // value: ethers.utils.parseEther("0"),
        from: accounts[0],
    };

    // add group
    const system = await DeCusSystem.deployed();

    const tx = await system.addGroup(required, amount, btcAddr, keepers, overrides);
    console.log(`Hash: ${tx.hash}`);
};

module.exports = migration;
