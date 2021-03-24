const ethers = require("ethers");
const systemAbi = require("../build/contracts/DeCusSystem.json");

const network = process.env.NETWORK;
// const provider = ethers.getDefaultProvider(network, process.env.INFURA_PROJECT_ID);
const provider = ethers.getDefaultProvider(network);

const signer = new ethers.Wallet(process.env.PRIVATE_KEY || "", provider);

const SystemAddr = process.env.DECUS_SYSTEM;

const overrides = {
    gasLimit: 1000000,
    gasPrice: "1000000000",
    value: ethers.utils.parseEther("0"),
};

const system = new ethers.Contract(SystemAddr, systemAbi.abi, signer);

const groupId = 1;

const deleteGroup = async (groupIdj) => {
    const tx = await system.deleteGroup(groupId, overrides);
    console.log(`Delete group ${groupId}`);
    console.log(`Hash: ${tx.hash}`);
};

deleteGroup(groupId);
