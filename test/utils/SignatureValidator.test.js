const { BN, expectRevert } = require("@openzeppelin/test-helpers");
const { expect } = require("chai");
const { ethers, providers, BigNumber } = require("ethers");

const SignatureValidator = artifacts.require("SignatureValidator");

/* eslint-disable no-unused-expressions */
contract("SignatureValidator", (accounts) => {
    beforeEach(async () => {
        const web3Provider = new providers.Web3Provider(web3.currentProvider);
        this.recipient = web3Provider.getSigner(accounts[0]);
        this.keeper1 = web3Provider.getSigner(accounts[1]);
        this.keeper2 = web3Provider.getSigner(accounts[2]);
        this.validator = await SignatureValidator.new();
    });

    it("reverted with invalid signature", async () => {
        const amount = BigNumber.from(10);
        const keepers = [this.keeper1, this.keeper2];
        const keeperAddrs = [this.keeper1._address, this.keeper2._address];
        const nonces = [BigNumber.from(42), BigNumber.from(130)];
        const rList = [];
        const sList = [];
        let vShift = 0;
        let packedV = BigNumber.from(0);

        for (let i = 0; i < keepers.length; i++) {
            let payload = ethers.utils.defaultAbiCoder.encode(
                ["address", "uint256", "uint256"],
                [this.recipient._address, nonces[i], amount]
            );
            payload = ethers.utils.keccak256(payload);
            const signature = await keepers[0].signMessage(ethers.utils.arrayify(payload));
            const sig = ethers.utils.splitSignature(signature);

            rList.push(sig.r);
            sList.push(sig.s);
            packedV = packedV.or(BigNumber.from(sig.v).shl(vShift));

            vShift += 8;
        }

        await expectRevert(
            this.validator.batchValidate(
                this.recipient._address,
                amount,
                keeperAddrs,
                nonces,
                rList,
                sList,
                packedV
            ),
            "invalid signature"
        );
    });

    it("batch validate and update last nonces", async () => {
        const amount = BigNumber.from(10);
        const keepers = [this.keeper1, this.keeper2];
        const keeperAddrs = [this.keeper1._address, this.keeper2._address];
        const nonces = [BigNumber.from(42), BigNumber.from(130)];
        const rList = [];
        const sList = [];
        let vShift = 0;
        let packedV = BigNumber.from(0);

        for (let i = 0; i < keepers.length; i++) {
            let payload = ethers.utils.defaultAbiCoder.encode(
                ["address", "uint256", "uint256"],
                [this.recipient._address, nonces[i], amount]
            );
            payload = ethers.utils.keccak256(payload);
            const signature = await keepers[i].signMessage(ethers.utils.arrayify(payload));
            const sig = ethers.utils.splitSignature(signature);

            rList.push(sig.r);
            sList.push(sig.s);
            packedV = packedV.or(BigNumber.from(sig.v).shl(vShift));

            vShift += 8;
        }

        await this.validator.batchValidate(
            this.recipient._address,
            amount,
            keeperAddrs,
            nonces,
            rList,
            sList,
            packedV
        );

        for (let i = 0; i < keepers.length; i++) {
            expect(await this.validator.lastNonces(keeperAddrs[i])).to.be.bignumber.equal(
                new BN(nonces[i].toString())
            );
        }
    });

    it("reverted with nonce outdated", async () => {
        const amount = BigNumber.from(10);
        const keepers = [this.keeper1, this.keeper2];
        const keeperAddrs = [this.keeper1._address, this.keeper2._address];
        const nonces = [BigNumber.from(42), BigNumber.from(130)];
        const rList = [];
        const sList = [];
        let vShift = 0;
        let packedV = BigNumber.from(0);

        for (let i = 0; i < keepers.length; i++) {
            let payload = ethers.utils.defaultAbiCoder.encode(
                ["address", "uint256", "uint256"],
                [this.recipient._address, nonces[i], amount]
            );
            payload = ethers.utils.keccak256(payload);
            const signature = await keepers[i].signMessage(ethers.utils.arrayify(payload));
            const sig = ethers.utils.splitSignature(signature);

            rList.push(sig.r);
            sList.push(sig.s);
            packedV = packedV.or(BigNumber.from(sig.v).shl(vShift));

            vShift += 8;
        }

        await this.validator.batchValidate(
            this.recipient._address,
            amount,
            keeperAddrs,
            nonces,
            rList,
            sList,
            packedV
        );

        await expectRevert(
            this.validator.batchValidate(
                this.recipient._address,
                amount,
                keeperAddrs,
                nonces,
                rList,
                sList,
                packedV
            ),
            "nonce outdated"
        );
    });
});
