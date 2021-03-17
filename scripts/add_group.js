const ethers = require("ethers");
const systemAbi = require("../build/contracts/DeCusSystem.json");

const provider = ethers.getDefaultProvider("kovan", process.env.INFURA_TEST_ID);
const signer = new ethers.Wallet(process.env.PRIVATE_KEY_TEST || "", provider);

const SystemAddr = "0x47145b0ce61f8005f1bf16d2224eE160Ec54e323";
// const keepers = ["0xf09B8dda559292111Af945e91717dA39eEF34Ade","0x347ba66e4d8bb200000000000000000000000000","0x8dEF74F25f5429831044c64C057121E3322133F0"]
const keepers = [1, 2, 3];
const btcAddr = "2N2NDby9imzgSTHax1uacWUihdCfW35Ld5W";

const overrides = {
    gasLimit: 1000000,
    gasPrice: "1000000000",
    value: ethers.utils.parseEther("0"),
};

const system = new ethers.Contract(SystemAddr, systemAbi.abi, signer);

const addGroup = async (keepers, btcAddr, amount) => {
    const tx = await system.addGroup(keepers, btcAddr, amount, overrides);
    console.log(tx);
};

const amount = 10000000;

addGroup(keepers, btcAddr, amount);
