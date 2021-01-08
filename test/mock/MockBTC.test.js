const {BN} = require("@openzeppelin/test-helpers");
const {expect} = require("chai");

const WBTC = artifacts.require("WBTC");
const HBTC = artifacts.require("HBTC");


contract('MockBTC', (accounts) => {
    const [ recipient ] = accounts;

    beforeEach(async () => {
        this.hbtc = await HBTC.new();
        this.wbtc = await WBTC.new();
    });


    describe('WBTC', () => {
        const decimals = new BN(8);
        const amount = new BN(50);

        it('decimal', async () => {
            expect(await this.wbtc.decimals()).to.be.bignumber.equal(decimals);
        });


        describe('minting', () => {
            beforeEach('minting', async () => {
                await this.wbtc.mint(recipient, amount);
            });

            it('amount', async () => {
                expect(await this.wbtc.balanceOf(recipient)).to.be.bignumber.equal(amount);
            });
        })
    });

    describe('HBTC', () => {
        const decimals = new BN(18);
        it('decimal', async () => {
            expect(await this.hbtc.decimals()).to.be.bignumber.equal(decimals);
        });
    });
});
