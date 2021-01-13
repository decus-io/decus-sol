const externalContracts = require('./external');

// Token
const EBTC = artifacts.require('EBTC')
const DeCus = artifacts.require('DeCus')
const AssetMeta = artifacts.require("AssetMeta");

// ============ Main Migration ============

const migration = async (deployer, network, accounts) => {
  await Promise.all([deployToken(deployer, network, accounts)])
}

module.exports = migration

// ============ Deploy Functions ============

async function deployToken(deployer, network, accounts) {
  await deployer.deploy(EBTC, accounts[0], accounts[0]);
  await deployer.deploy(DeCus, accounts[0]);

  let wbtc, hbtc
  if (network == 'mainnet') {
    hbtc = external.HBTC.mainnet;
    wbtc = external.WBTC.mainnet;
  }
  else if (network == 'kovan') {
    hbtc = external.HBTC.kovan;
    wbtc = external.WBTC.kovan;
  }
  else {
    const MockHBTC = artifacts.require('HBTC')
    const MockWBTC = artifacts.require('WBTC')
    hbtc = await deployer.deploy(MockHBTC);
    wbtc = await deployer.deploy(MockWBTC);
  }

  console.log(`HBTC address: ${hbtc.address}`);
  console.log(`WBTC address: ${wbtc.address}`);

  await deployer.deploy(AssetMeta, [wbtc.address, hbtc.address]);
}
