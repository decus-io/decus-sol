import { ethers } from "hardhat";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts } = hre;
  const { deployer } = await getNamedAccounts();

  const MINTER_ROLE = ethers.utils.id("MINTER_ROLE");
  const KEEPER_ADMIN_ROLE = ethers.utils.id("KEEPER_ADMIN_ROLD");
  const GROUP_ADMIN_ROLE = ethers.utils.id("GROUP_ADMIN_ROLD");
  const RECEIPT_ADMIN_ROLE = ethers.utils.id("RECEIPT_ADMIN_ROLD");

  const system = await deployments.get("DeCusSystem");
  const ebtc = await deployments.get("EBTC");
  const assetMeta = await deployments.get("AssetMeta");
  const keeperRegistry = await deployments.get("KeeperRegistry");
  const groupRegistry = await deployments.get("GroupRegistry");
  const receiptController = await deployments.get("ReceiptController");

  // tokens
  await deployments.execute(
    "EBTC",
    {
      from: deployer,
      log: true,
    },
    "grantRole",
    MINTER_ROLE,
    system.address
  );

  // keeper
  await deployments.execute(
    "KeeperRegistry",
    { from: deployer, log: true },
    "setDependencies",
    assetMeta.address
  );
  await deployments.execute(
    "KeeperRegistry",
    {
      from: deployer,
      log: true,
    },
    "grantRole",
    KEEPER_ADMIN_ROLE,
    system.address
  );
  console.log("KeeperRegistry set dependencies: %s", assetMeta.address);

  // group
  await deployments.execute(
    "GroupRegistry",
    {
      from: deployer,
      log: true,
    },
    "grantRole",
    GROUP_ADMIN_ROLE,
    system.address
  );

  // system
  await deployments.execute(
    "DeCusSystem",
    { from: deployer, log: true },
    "setDependencies",
    ebtc.address,
    keeperRegistry.address,
    groupRegistry.address,
    receiptController.address
  );
};

export default func;
func.tags = ["Dependency"];
