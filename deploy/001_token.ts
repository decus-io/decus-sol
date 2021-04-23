import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { ethers } from "hardhat";
import { DeploymentsExtension } from "hardhat-deploy/dist/types";
import { getWbtcAddress } from "../scripts/external";
import { WBTC } from "../build/typechain";

async function getWBTC(
  deployments: DeploymentsExtension,
  network: string,
  deployer: string
) {
  const wbtcAddr = getWbtcAddress(network);

  let wbtc;
  if (wbtcAddr) {
    wbtc = (await ethers.getContractAt("WBTC", wbtcAddr)) as WBTC;
  } else {
    wbtc = await deployments.deploy("WBTC", {
      from: deployer,
      args: [],
      log: true,
    });
  }

  console.log(`WBTC address: ${wbtc.address}`);
  return wbtc;
}

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts } = hre;

  const network = hre.network.name;
  console.log("Network", network);
  const { deploy, execute } = deployments;
  const { deployer, faucetSigner } = await getNamedAccounts();

  await deploy("EBTC", {
    from: deployer,
    args: [],
    log: true,
  });

  await deploy("DeCus", {
    from: deployer,
    args: [],
    log: true,
  });

  const wbtc = await getWBTC(deployments, network, deployer);

  await deploy("AssetMeta", {
    from: deployer,
    args: [[wbtc.address]],
    log: true,
  });

  await deploy("AssetLib", {
    from: deployer,
    args: [],
    log: true,
  });

  await deploy("AssetLibMock", {
    from: deployer,
    args: [],
    log: true,
  });

  await deploy("CollateralLib", {
    from: deployer,
    args: [],
    log: true,
  });

  if (network == "mainnet") {
    return;
  }

  await deploy("HBTC", {
    from: deployer,
    args: [],
    log: true,
  });

  await deploy("OtherCoin", {
    from: deployer,
    args: [],
    log: true,
  });
};
export default func;
func.tags = ["Token"];
