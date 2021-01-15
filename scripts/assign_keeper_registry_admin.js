const web3 = require('web3');
const ethers = require('ethers');
const abi_json = require('../build/contracts/KeeperRegistry.json');


const provider = ethers.getDefaultProvider('kovan', process.env.INFURA_TEST_ID);
const signer = new ethers.Wallet(process.env.PRIVATE_KEY_TEST || '', provider);

const overrides = {
    gasLimit: 1000000,
    gasPrice: '1000000000',
    value: ethers.utils.parseEther('0'),
};

const contract = new ethers.Contract(
    '0x8902C95479Aa5c458E2E75010AD140a7C5046425',
    abi_json.abi,
    signer
);

const KEEPER_ADMIN_ROLE = web3.utils.soliditySha3('KEEPER_ADMIN_ROLE');

const assign = async () => {
  const tx = await contract.grantRole(KEEPER_ADMIN_ROLE, '0x044Bc5A48B8daBc2197eA33b5076572275E7aCCd', overrides);
  console.log(tx);
}

const verify = async () => {
  const tx = await contract.hasRole(KEEPER_ADMIN_ROLE, '0x044Bc5A48B8daBc2197eA33b5076572275E7aCCd', overrides);
  console.log(tx);
}

//assign();

verify();
