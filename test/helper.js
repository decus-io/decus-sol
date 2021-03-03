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
function sign(privateKey, verifyingContract, recipient, nonce, amount) {
    const domainType = [
        { name: "name", type: "string" },
        { name: "version", type: "string" },
        { name: "chainId", type: "uint256" },
        { name: "verifyingContract", type: "address" },
    ];

    const mintRequestTypes = [
        { name: "recipient", type: "address" },
        { name: "nonce", type: "uint256" },
        { name: "amount", type: "uint256" },
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
        nonce: nonce.toString(),
        amount: amount.toString(),
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

module.exports = {
    advanceTimeAndBlock,
    sign,
};
