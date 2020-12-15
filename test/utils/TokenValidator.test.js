const {expect} = require("chai");

const WBTC = artifacts.require("WBTC");
const HBTC = artifacts.require("HBTC");
const OtherCoin = artifacts.require("OtherCoin");
const Validator = artifacts.require("TokenValidator");


contract('TokenValidator', (accounts) => {
    const [recipient] = accounts;

    beforeEach(async () => {
        this.hbtc = await HBTC.new();
        this.wbtc = await WBTC.new();
        this.other = await OtherCoin.new();
        this.validator = await Validator.new([this.hbtc.address, this.wbtc.address]);
    });


    describe('Validator', () => {
        it('wbtc', async () => {
            expect(await this.validator.validate(this.wbtc.address)).to.be.true;
        });
        it('hbtc', async () => {
            expect(await this.validator.validate(this.hbtc.address)).to.be.true;
        });
        it('other', async () => {
            expect(await this.validator.validate(this.other.address)).to.be.false;
        });
    });
});
