const { BN } = require("@openzeppelin/test-helpers");
const { expect } = require("chai");

const WBTC = artifacts.require("WBTC");
const HBTC = artifacts.require("HBTC");
// const OtherCoin = artifacts.require("OtherCoin");
const AssetMeta = artifacts.require("AssetMeta");
const CollateralLibMock = artifacts.require("CollateralLibMock");

/* eslint-disable no-unused-expressions */
contract("CollateralLib", (accounts) => {
    // const [owner] = accounts;

    beforeEach(async () => {
        this.wbtc = await WBTC.new();
        this.hbtc = await HBTC.new();
        //        this.other = await OtherCoin.new();
        this.meta = await AssetMeta.new([this.hbtc.address, this.wbtc.address]);
        this.lib = await CollateralLibMock.new();

        this.satoshi_multiplier = new BN(10).pow(new BN(8));
        this.hbtc_multiplier = new BN(10).pow(await this.hbtc.decimals());
        this.wbtc_multiplier = new BN(10).pow(await this.wbtc.decimals());
    });

    it("empth", async () => {
        const tokenId = new BN("0");
        expect(await this.lib.containId(tokenId)).to.be.false;
    });

    describe("add keeper", () => {
        it("add", async () => {
            const tokenId = new BN("1");
            const hbtcNumber = new BN(0.5);
            const wbtcNumber = new BN(0.2);
            const hbtcAmount = hbtcNumber.mul(this.hbtc_multiplier);
            const wbtcAmount = wbtcNumber.mul(this.wbtc_multiplier);
            const expectSatoshi = hbtcNumber.add(wbtcNumber).mul(this.satoshi_multiplier);

            await this.lib.addKeeper(
                tokenId,
                [this.wbtc.address, this.hbtc.address],
                [wbtcAmount, hbtcAmount],
                this.meta.address
            );

            expect(await this.lib.getSatoshiValue(tokenId)).to.be.bignumber.equal(expectSatoshi);
        });
    });
});
