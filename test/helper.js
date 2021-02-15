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

module.exports = {
    advanceTimeAndBlock,
};
