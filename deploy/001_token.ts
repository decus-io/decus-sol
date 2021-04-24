import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { getContractOrDeploy } from "../test/utils/deploy";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts } = hre;

  const network = hre.network.name;
  console.log("Network", network);
  const { deploy, execute } = deployments;
  const { deployer, wbtcAddr, hbtcAddr } = await getNamedAccounts();

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

    await deploy("OtherCoin", {
      from: deployer,
      args: [],
      log: true,
    });

    useAsset = [wbtc.address, hbtc.address];
  } else {
    useAsset = [wbtc.address];
  }

  await deploy("AssetMeta", {
    from: deployer,
    args: [useAsset],
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
};
export default func;
func.tags = ["Token"];
