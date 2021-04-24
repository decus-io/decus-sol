import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts } = hre;

  const network = hre.network.name;
  const { deployer } = await getNamedAccounts();

  if (network == "hardhat") {
    await deployments.deploy("AssetLibMock", {
      from: deployer,
      args: [],
      log: true,
    });

    await deployments.deploy("CollateralLibMock", {
      from: deployer,
      args: [],
      log: true,
    });

    await deployments.deploy("GroupLibMock", {
      from: deployer,
      args: [],
      log: true,
    });
    await deployments.deploy("ReceiptLibMock", {
      from: deployer,
      args: [],
      log: true,
    });
  }
};
export default func;
func.tags = ["Mocks"];
