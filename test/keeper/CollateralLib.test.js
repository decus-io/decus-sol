const { BN, constants, expectEvent, expectRevert } = require('@openzeppelin/test-helpers');
const { ZERO_ADDRESS } = constants;
const {expect} = require("chai");

const WBTC = artifacts.require("WBTC");
const HBTC = artifacts.require("HBTC");
const OtherCoin = artifacts.require("OtherCoin");
const AssetMeta = artifacts.require("AssetMeta");
const CollateralLibMock = artifacts.require("CollateralLibMock");


contract('CollateralLib', (accounts) => {
    const [owner] = accounts;

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

    it('empth', async() => {
        const tokenId = new BN('0')
        expect(await this.lib.containId(tokenId)).to.be.false;
    })

    describe('add keeper', () => {
        it('add', async() => {
            const tokenId = new BN('1');
            const hbtc_number = new BN(0.5);
            const wbtc_number = new BN(0.2);
            const hbtc_amount = hbtc_number.mul(this.hbtc_multiplier);
            const wbtc_amount = wbtc_number.mul(this.wbtc_multiplier);
            const expect_satoshi = (hbtc_number.add(wbtc_number)).mul(this.satoshi_multiplier);

            const rsp = await this.lib.addKeeper(tokenId, [this.wbtc.address, this.hbtc.address],
                [wbtc_amount, hbtc_amount], this.meta.address);

            expect(await this.lib.getSatoshiValue(tokenId)).to.be.bignumber.equal(expect_satoshi);
        })
    });

});
