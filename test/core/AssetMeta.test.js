const { BN, expectRevert } = require("@openzeppelin/test-helpers");
const { expect } = require("chai");

const WBTC = artifacts.require("WBTC");
const HBTC = artifacts.require("HBTC");
const OtherCoin = artifacts.require("OtherCoin");
const AssetMeta = artifacts.require("AssetMeta");

/* eslint-disable no-unused-expressions */
contract("AssetMeta", (accounts) => {
    // const [owner] = accounts;

    beforeEach(async () => {
        this.wbtc = await WBTC.new();
        this.hbtc = await HBTC.new();
        this.other = await OtherCoin.new();
        this.meta = await AssetMeta.new([this.hbtc.address, this.wbtc.address]);
    });

    it("wbtc", async () => {
        const divisor = new BN(1);
        expect(await this.meta.exists(this.wbtc.address)).to.be.true;
        expect(await this.meta.getSatoshiDivisor(this.wbtc.address)).to.be.bignumber.equal(divisor);
    });

    it("hbtc", async () => {
        const divisor = new BN(10).pow(new BN(10));
        expect(await this.meta.exists(this.hbtc.address)).to.be.true;
        expect(await this.meta.getSatoshiDivisor(this.hbtc.address)).to.be.bignumber.equal(divisor);
    });

    it("other", async () => {
        expect(await this.meta.exists(this.other.address)).to.be.false;
        await expectRevert(
            this.meta.getSatoshiDivisor(this.other.address),
            "not supported collateral asset"
        );
    });
});
