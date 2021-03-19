const web3 = require("web3");
const ethers = require("ethers");
const abiJson = require("../build/contracts/KeeperRegistry.json");

const provider = ethers.getDefaultProvider("kovan", process.env.INFURA_PROJECT_ID);
const signer = new ethers.Wallet(process.env.PRIVATE_KEY || "", provider);

// const overrides = {
//     gasLimit: 1000000,
//     gasPrice: "1000000000",
//     value: ethers.utils.parseEther("0"),
// };

const contract = new ethers.Contract(process.env.KEEPER_REGISTRY, abiJson.abi, signer);

const KEEPER_ADMIN_ROLE = web3.utils.soliditySha3("KEEPER_ADMIN_ROLE");

// const assign = async () => {
//     const tx = await contract.grantRole(KEEPER_ADMIN_ROLE, process.env.AUCTION_ADDRESS, overrides);
//     console.log(tx);
// };

// assign();

const verify = async () => {
    const tx = await contract.hasRole(
        KEEPER_ADMIN_ROLE,
        process.env.AUCTION_ADDRESS
        // overrides
    );
    console.log(tx);
};

verify();
