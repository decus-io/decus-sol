const { BN, constants, expectEvent, expectRevert } = require('@openzeppelin/test-helpers');
const { ZERO_ADDRESS } = constants;
const {expect} = require("chai");

const CollateralToken = artifacts.require("CollateralToken");


contract('CollateralToken', (accounts) => {
    const [owner, minter, user1, user2] = accounts;

    const DEFAULT_ADMIN_ROLE = '0x0000000000000000000000000000000000000000000000000000000000000000';
    const MINTER_ROLE = web3.utils.soliditySha3('MINTER_ROLE');

    beforeEach(async () => {
        this.token = await CollateralToken.new(minter)
    });

    it('role', async() => {
        expect(await this.token.getRoleMember(MINTER_ROLE, 0)).to.equal(minter);

        expect(await this.token.getRoleAdmin(MINTER_ROLE)).to.equal(DEFAULT_ADMIN_ROLE);
    })

    describe('mint', () => {
        it('minter can mint', async () => {
            const tokenId = new BN('0');
            const receipt = await this.token.mint(user1, {from: minter});
            expectEvent(receipt, 'Transfer', { from: ZERO_ADDRESS, to: user1, tokenId: tokenId });

            expect(await this.token.balanceOf(user1)).to.be.bignumber.equal('1');
            expect(await this.token.ownerOf(tokenId)).to.equal(user1);
        });
        it('other cannot mint', async () => {
            await expectRevert(this.token.mint(user1, { from: user1 }),
            'require minter role',);
            await expectRevert(this.token.mint(user1, { from: user2 }),
            'require minter role',);
        });
    });

    describe('role transfer', () => {
        // TODO:
    });

    describe('owner transfer', () => {
        // TODO:
    });
});
