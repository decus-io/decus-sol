const { BN, constants, expectEvent, expectRevert } = require('@openzeppelin/test-helpers');
const { ZERO_ADDRESS } = constants;
const {expect} = require("chai");

const WBTC = artifacts.require("WBTC");
const HBTC = artifacts.require("HBTC");
const OtherCoin = artifacts.require("OtherCoin");
const CollateralMeta = artifacts.require("CollateralMeta");


contract('CollateralMeta', (accounts) => {
    const [owner] = accounts;

    beforeEach(async () => {
        this.wbtc = await WBTC.new();
        this.hbtc = await HBTC.new();
        this.other = await OtherCoin.new();
        this.meta = await CollateralMeta.new([this.hbtc.address, this.wbtc.address]);
    });

    it('wbtc', async() => {
        const decimals = new BN(10).pow(new BN(8));
        expect(await this.meta.exists(this.wbtc.address)).to.be.true;
        expect(await this.meta.getDivisor(this.wbtc.address)).to.be.bignumber.equal(decimals);
    })

    it('other', async() => {
        expect(await this.meta.exists(this.other.address)).to.be.false;
        await expectRevert(this.meta.getDivisor(this.other.address), "not supported collateral asset");
    })

});
