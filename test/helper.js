const { BN } = require("@openzeppelin/test-helpers");
const { ethers } = require("ethers");

function advanceTime(time) {
    return new Promise((resolve, reject) => {
        web3.currentProvider.send(
            {
                jsonrpc: "2.0",
                method: "evm_increaseTime",
                params: [time],
                id: new Date().getTime(),
            },
            (err, result) => {
                if (err) {
                    return reject(err);
                }
                return resolve(result);
            }
        );
    });
}

function advanceBlock() {
    return new Promise((resolve, reject) => {
        web3.currentProvider.send(
            {
                jsonrpc: "2.0",
                method: "evm_mine",
                id: new Date().getTime(),
            },
            (err) => {
                if (err) {
                    return reject(err);
                }
                const newBlockHash = web3.eth.getBlock("latest").hash;
                return resolve(newBlockHash);
            }
        );
    });
}

async function advanceTimeAndBlock(targetTime) {
    const currentTimestamp = (await web3.eth.getBlock("latest")).timestamp;

    const diff =
        targetTime > currentTimestamp % (24 * 60 * 60)
            ? targetTime - (currentTimestamp % (24 * 60 * 60))
            : 24 * 60 * 60 + targetTime - (currentTimestamp % (24 * 60 * 60));
    await advanceTime(diff);
    await advanceBlock();

    console.log("latest timestamp", (await web3.eth.getBlock("latest")).timestamp);
}

const sigUtil = require("eth-sig-util");
function sign(privateKey, verifyingContract, recipient, receiptId, amount, txId, height) {
    const domainType = [
        { name: "name", type: "string" },
        { name: "version", type: "string" },
        { name: "chainId", type: "uint256" },
        { name: "verifyingContract", type: "address" },
    ];

    const mintRequestTypes = [
        { name: "recipient", type: "address" },
        { name: "receiptId", type: "uint256" },
        { name: "amount", type: "uint256" },
        { name: "txId", type: "bytes32" },
        { name: "height", type: "uint256" },
    ];

    const domain = {
        name: "DeCus",
        version: "1.0",
        chainId: 1,
        verifyingContract: verifyingContract,
    };

    // The data to sign
    const message = {
        recipient: recipient,
        receiptId: receiptId.toString(),
        amount: amount.toString(),
        txId: txId,
        height: height.toString(),
    };

    const typedData = {
        types: {
            EIP712Domain: domainType,
            MintRequest: mintRequestTypes,
        },
        primaryType: "MintRequest",
        domain: domain,
        message: message,
    };

    return sigUtil.signTypedData_v4(Buffer.from(privateKey, "hex"), { data: typedData });

    // return signer._signTypedData(domain, types, value);
}

function prepareSignature(
    keeperPrivates,
    validatorAddress,
    recipient,
    receiptId,
    amount,
    txId,
    height
) {
    const rList = [];
    const sList = [];

    let vShift = 0;
    let packedV = new BN(0);
    for (let i = 0; i < keeperPrivates.length; i++) {
        const signature = sign(
            keeperPrivates[i],
            validatorAddress,
            recipient,
            receiptId,
            amount,
            txId,
            height
        );

        const sig = ethers.utils.splitSignature(signature);

        rList.push(sig.r);
        sList.push(sig.s);
        // const v = new BN(sig.v);
        packedV = packedV.or(new BN(sig.v).shln(vShift));

        vShift += 8;
    }
    return [rList, sList, packedV];
}

module.exports = {
    advanceTimeAndBlock,
    sign,
    prepareSignature,
};
