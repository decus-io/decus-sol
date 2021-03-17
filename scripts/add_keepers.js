const web3 = require("web3");
const ethers = require("ethers");
const keeperRegistryAbi = require("../build/contracts/KeeperRegistry.json");
const erc20Abi = require("../build/contracts/ERC20.json");

const provider = ethers.getDefaultProvider("kovan", process.env.INFURA_TEST_ID);
const signer = new ethers.Wallet(process.env.PRIVATE_KEY_TEST || "", provider);

const KeeperRegistryAddr = process.env.KEEPER_IMPORT_ADDRESS;
const WBTC = "0x13c39be3d5250bec24b29c3962379e0869893565";

const overrides = {
    gasLimit: 1000000,
    gasPrice: "1000000000",
    value: ethers.utils.parseEther("0"),
};

const wbtc = new ethers.Contract(WBTC, erc20Abi.abi, signer);

const amount = 10000000;
const keeper1 = "0xf09B8dda559292111Af945e91717dA39eEF34Ade";
// const keeper1 = "0x347ba66e4d8Bb18601ba03e2b32cEb22c8A8cBD8";
// const keeper1 = "0x8dEF74F25f5429831044c64C057121E3322133F0";

const approve = async (keeper, amount) => {
    const tx = await wbtc.approve(
        KeeperRegistryAddr,
        amount,
        { from: keeper }
        // overrides
    );
    console.log(tx);
};

approve(keeper1, amount);

// const keeperRegistry = new ethers.Contract(KeeperRegistryAddr, keeperRegistryAbi.abi, signer);

// const addKeeper = async (keeper, amount) => {
//     const tx = await keeperRegistry.addKeeper(keeper, [WBTC], [amount], overrides);
//     console.log(tx);
// };

// addKeeper(keeper1, amount);
