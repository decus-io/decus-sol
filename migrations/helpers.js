const WBTC = artifacts.require("WBTC");

const externalContracts = require("./external");

async function deployWBTC(deployer, network) {
    let wbtc;
    if (network === "development" || network === "test") {
        wbtc = await deployer.deploy(WBTC);
    } else {
        // mainnet, ropsten, kovan
        wbtc = await WBTC.at(externalContracts.WBTC[network]);
    }
    console.log(`WBTC address: ${wbtc.address}`);
    return wbtc;
}

async function getWBTC(network) {
    let wbtc;
    if (network === "development" || network === "test") {
        wbtc = await WBTC.deployed();
    } else {
        // mainnet, ropsten, kovan
        wbtc = await WBTC.at(externalContracts.WBTC[network]);
    }
    return wbtc;
}

module.exports = {
    deployWBTC,
    getWBTC,
};
