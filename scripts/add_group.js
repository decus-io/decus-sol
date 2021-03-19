const ethers = require("ethers");
const systemAbi = require("../build/contracts/DeCusSystem.json");

const provider = ethers.getDefaultProvider("kovan", process.env.INFURA_TEST_ID);
const signer = new ethers.Wallet(process.env.PRIVATE_KEY || "", provider);

const SystemAddr = "0x94662fe0F7F040D52aC5b1aD73BF4d343A3ef9D8";
const keepers = [1, 2, 3];
const btcAddr = "2N2NDby9imzgSTHax1uacWUihdCfW35Ld5W";

const overrides = {
    // gasLimit: 1000000,
    // gasPrice: "1000000000",
    // value: ethers.utils.parseEther("0"),
};

const system = new ethers.Contract(SystemAddr, systemAbi.abi, signer);

const addGroup = async (keepers, btcAddr, amount) => {
    const tx = await system.addGroup(keepers, btcAddr, amount, overrides);
    console.log(`Add group ${keepers} ${btcAddr} ${amount} ${tx.hash}`);
};

const amount = 10000000;

addGroup(keepers, btcAddr, amount);
