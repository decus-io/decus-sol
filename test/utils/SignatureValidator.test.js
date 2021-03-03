const { BN, expectRevert } = require("@openzeppelin/test-helpers");
const { expect } = require("chai");
const { ethers, providers, BigNumber } = require("ethers");
const { sign } = require("../helper.js");

const SignatureValidator = artifacts.require("SignatureValidator");

/* eslint-disable no-unused-expressions */
contract("SignatureValidator", (accounts) => {
    beforeEach(async () => {
        const web3Provider = new providers.Web3Provider(web3.currentProvider);
        this.recipient = web3Provider.getSigner(accounts[0]);
        this.keepers = [
            "0xadB55751AE2d025822A35CA4338853edC920Afaa",
            "0xd0F5AcAa0FDC4E9F9984D72757CF506Cf482D0fA",
        ];
        this.keeperPrivates = [
            "33b878c049feb985af2ff139843a74c87ad1a815dcaaac34c161c1b3473d52a1",
            "54cf6ecdcebdb5bb1ef61c1d87fcd01b75a2a73f8ce7aa64273b50019d1cde84",
        ];
        this.validator = await SignatureValidator.new();
    });

    it("reverted with invalid signature", async () => {
        const amount = BigNumber.from(10);
        const nonces = [BigNumber.from(42), BigNumber.from(130)];
        const rList = [];
        const sList = [];
        let vShift = 0;
        let packedV = BigNumber.from(0);

        for (let i = 0; i < this.keepers.length; i++) {
            let signature = await sign(
                this.keeperPrivates[i],
                this.validator.address,
                this.recipient._address,
                nonces[i],
                amount
            );

            if (i === 1) {
                signature =
                    "0x4355c47d63924e8a72e509b65029052eb6c299d53a04e167c5775fd466751c9d07299936d304c153f6443dfa05f40ff007d72911b6f72307f996231605b915621c";
            }
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
                this.keepers,
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
        const nonces = [BigNumber.from(42), BigNumber.from(130)];
        const rList = [];
        const sList = [];
        let vShift = 0;
        let packedV = BigNumber.from(0);

        for (let i = 0; i < this.keepers.length; i++) {
            const signature = await sign(
                this.keeperPrivates[i],
                this.validator.address,
                this.recipient._address,
                nonces[i],
                amount
            );
            const sig = ethers.utils.splitSignature(signature);

            rList.push(sig.r);
            sList.push(sig.s);
            packedV = packedV.or(BigNumber.from(sig.v).shl(vShift));

            vShift += 8;
        }

        await this.validator.batchValidate(
            this.recipient._address,
            amount,
            this.keepers,
            nonces,
            rList,
            sList,
            packedV
        );

        for (let i = 0; i < this.keepers.length; i++) {
            expect(await this.validator.lastNonces(this.keepers[i])).to.be.bignumber.equal(
                new BN(nonces[i].toString())
            );
        }
    });

    it("reverted with nonce outdated", async () => {
        const amount = BigNumber.from(10);
        const nonces = [BigNumber.from(42), BigNumber.from(130)];
        const rList = [];
        const sList = [];
        let vShift = 0;
        let packedV = BigNumber.from(0);

        for (let i = 0; i < this.keepers.length; i++) {
            const signature = await sign(
                this.keeperPrivates[i],
                this.validator.address,
                this.recipient._address,
                nonces[i],
                amount
            );
            const sig = ethers.utils.splitSignature(signature);

            rList.push(sig.r);
            sList.push(sig.s);
            packedV = packedV.or(BigNumber.from(sig.v).shl(vShift));

            vShift += 8;
        }

        await this.validator.batchValidate(
            this.recipient._address,
            amount,
            this.keepers,
            nonces,
            rList,
            sList,
            packedV
        );

        await expectRevert(
            this.validator.batchValidate(
                this.recipient._address,
                amount,
                this.keepers,
                nonces,
                rList,
                sList,
                packedV
            ),
            "nonce outdated"
        );
    });
});
