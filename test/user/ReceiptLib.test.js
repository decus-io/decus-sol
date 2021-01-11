const { BN, constants, expectEvent, expectRevert } = require('@openzeppelin/test-helpers');
const { ZERO_ADDRESS } = constants;
const {expect} = require("chai");

const ReceiptLibMock = artifacts.require("ReceiptLibMock");


contract('ReceiptLib', (accounts) => {
    const [owner, user1, user2] = accounts;

    beforeEach(async () => {
        this.groupId = new BN(3333);

        this.amount = new BN(100000);

        this.lib = await ReceiptLibMock.new();
    });

    it('request deposit', async() => {
        await this.lib.depositRequest(user1, this.groupId, this.amount);

        expect(await this.lib.getUserAddress(this.groupId)).to.equal(user1);

        expect(await this.lib.getAmountInSatoshi(this.groupId)).to.be.bignumber.equal(this.amount);

        expect(await this.lib.getReceiptStatus(this.groupId)).to.be.bignumber.equal(new BN(1));
    })

    it('request twice', async() => {
        await this.lib.depositRequest(user1, this.groupId, this.amount);

        await expectRevert(this.lib.depositRequest(user2, this.groupId, this.amount), "receipt is in use");
    })

    describe('state', () => {
        beforeEach(async () => {
            await this.lib.depositRequest(user1, this.groupId, this.amount);
        });

        it('deposit received', async() => {
            await this.lib.depositReceived(this.groupId);

            expect(await this.lib.getReceiptStatus(this.groupId)).to.be.bignumber.equal(new BN(2));

            await this.lib.withdrawRequest(this.groupId);

            expect(await this.lib.getReceiptStatus(this.groupId)).to.be.bignumber.equal(new BN(3));

            await this.lib.withdrawCompleted(this.groupId);

            expect(await this.lib.getReceiptStatus(this.groupId)).to.be.bignumber.equal(new BN(0));
        })

        it('withdraw requested', async() => {
            await this.lib.depositReceived(this.groupId);

            await this.lib.withdrawRequest(this.groupId);

            await expectRevert(this.lib.depositReceived(this.groupId), "receipt is not in DepositRequested state");
        })

        // TODO: expect revert if status not in DepositRequested
    })

});
