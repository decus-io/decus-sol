const ethers = require("ethers");
const keeperRegistryAbi = require("../build/contracts/KeeperRegistry.json");
const external = require("../migrations/external");

const network = process.env.NETWORK;

const WBTC = external.WBTC[network];
console.log(network, WBTC);

const provider = ethers.getDefaultProvider(network);
const signer = new ethers.Wallet(process.env.PRIVATE_KEY || "", provider);

const KeeperRegistryAddr = process.env.KEEPER_REGISTRY;

const overrides = {
    // gasLimit: 1000000,
    // gasPrice: "1000000000",
    // value: ethers.utils.parseEther("0"),
};

// const erc20Abi = require("../build/contracts/ERC20.json");
// const wbtc = new ethers.Contract(WBTC, erc20Abi.abi, signer);
// const approve = async (amount) => {
//     const keeper = await signer.getAddress();
//     const tx = await wbtc.approve(
//         KeeperRegistryAddr,
//         amount,
//         { from: keeper }
//         // overrides
//     );
//     console.log(`${keeper} approve at ${tx.hash}`);
// };

// approve("1000000000000");

const amount = 10000000;
const keeperRegistry = new ethers.Contract(KeeperRegistryAddr, keeperRegistryAbi.abi, signer);

const addKeeper = async (amount) => {
    const keeper = await signer.getAddress();
    const tx = await keeperRegistry.addKeeper(keeper, [WBTC], [amount], overrides);
    console.log(`${keeper} added at ${tx.hash}`);
};

addKeeper(amount);
