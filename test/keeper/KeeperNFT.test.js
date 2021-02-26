const { BN, constants, expectEvent } = require("@openzeppelin/test-helpers");
const { ZERO_ADDRESS } = constants;
const { expect } = require("chai");

const KeeperNFT = artifacts.require("KeeperNFT");

/* eslint-disable no-unused-expressions */
/* eslint-disable no-unused-vars */
contract("KeeperNFT", (accounts) => {
    const [owner, minter, user1, user2] = accounts;

    const DEFAULT_ADMIN_ROLE = "0x0000000000000000000000000000000000000000000000000000000000000000";
    const ADMIN_ROLE = web3.utils.soliditySha3("ADMIN_ROLE");

    beforeEach(async () => {
        this.token = await KeeperNFT.new(minter);
    });

    it("role", async () => {
        expect(await this.token.getRoleMember(ADMIN_ROLE, 0)).to.equal(minter);

        expect(await this.token.getRoleAdmin(ADMIN_ROLE)).to.equal(DEFAULT_ADMIN_ROLE);
    });

    describe("add", () => {
        const btcPubkey = "pubkeypubkeypubkey";
        const tokenId = new BN("0");

        it("add keeper", async () => {
            const receipt = await this.token.mint(user1);
            expectEvent(receipt, "Transfer", { from: ZERO_ADDRESS, to: user1, tokenId: tokenId });

            expect(await this.token.balanceOf(user1)).to.be.bignumber.equal("1");
            expect(await this.token.ownerOf(tokenId)).to.equal(user1);
        });
    });

    describe("nft transfer", () => {
        const btcPubkey = "pubkeypubkeypubkey";
        const btcPubkey2 = "pubkeypubkeypubkey2";
        const tokenId = new BN("0");

        beforeEach(async () => {
            await this.token.mint(user1);
        });

        it("tokenid", async () => {
            expect(await this.token.balanceOf(user1)).to.be.bignumber.equal("1");
            expect(await this.token.ownerOf(tokenId)).to.equal(user1);

            await this.token.approve(user2, tokenId, { from: user1 });
            await this.token.transferFrom(user1, user2, tokenId, { from: user1 });

            expect(await this.token.balanceOf(user1)).to.be.bignumber.equal("0");
            expect(await this.token.ownerOf(tokenId)).to.equal(user2);
        });
    });

    describe("role transfer", () => {
        // TODO:
    });

    describe("owner transfer", () => {
        // TODO:
    });
});
