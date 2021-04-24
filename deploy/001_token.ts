import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { getContractOrDeploy } from "../test/helper/deploy";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts } = hre;
  const network = hre.network.name;
  const { deployer, wbtcAddr, hbtcAddr } = await getNamedAccounts();

  console.log("Network", network);

  await deployments.deploy("EBTC", {
    from: deployer,
    args: [],
    log: true,
  });

  await deployments.deploy("DeCus", {
    from: deployer,
    args: [],
    log: true,
  });

  const wbtc = await getContractOrDeploy(
    wbtcAddr,
    "WBTC",
    deployments,
    deployer
  );

  let useAsset;
  if (network == "hardhat") {
    const hbtc = await getContractOrDeploy(
      hbtcAddr,
      "HBTC",
      deployments,
      deployer
    );

    await deployments.deploy("OtherCoin", {
      from: deployer,
      args: [],
      log: true,
    });

    useAsset = [wbtc.address, hbtc.address];
  } else {
    useAsset = [wbtc.address];
  }

  await deployments.deploy("AssetMeta", {
    from: deployer,
    args: [useAsset],
    log: true,
  });

  await deployments.deploy("AssetLib", {
    from: deployer,
    args: [],
    log: true,
  });

  await deployments.deploy("CollateralLib", {
    from: deployer,
    args: [],
    log: true,
  });
};

export default func;
func.tags = ["Token"];
