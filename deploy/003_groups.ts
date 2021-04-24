import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts } = hre;
  const { deployer } = await getNamedAccounts();

  await deployments.deploy("GroupLib", {
    from: deployer,
    args: [],
    log: true,
  });

  await deployments.deploy("GroupRegistry", {
    from: deployer,
    args: [],
    log: true,
  });

  await deployments.deploy("ReceiptController", {
    from: deployer,
    args: [],
    log: true,
  });
};

export default func;
func.tags = ["Group"];
