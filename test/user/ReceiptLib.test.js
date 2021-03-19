const { BN, expectRevert } = require("@openzeppelin/test-helpers");
const { expect } = require("chai");

const ReceiptLibMock = artifacts.require("ReceiptLibMock");

/* eslint-disable no-unused-expressions */
/* eslint-disable no-unused-vars */
contract("ReceiptLib", (accounts) => {
    const [owner, user1, user2] = accounts;

    beforeEach(async () => {
        this.receiptId = new BN(1111);
        this.groupId = new BN(3333);

        this.amount = new BN(100000);

        this.lib = await ReceiptLibMock.new();

        this.txId = "0xa1658ce2e63e9f91b6ff5e75c5a69870b04de471f5cd1cc3e53be158b46169bd";
        this.height = new BN("1940801");
    });

    it("request deposit", async () => {
        await this.lib.depositRequest(this.receiptId, user1, this.groupId, this.amount);

        expect(await this.lib.getUserAddress(this.receiptId)).to.equal(user1);

        expect(await this.lib.getGroupId(this.receiptId)).to.be.bignumber.equal(this.groupId);

        expect(await this.lib.getAmountInSatoshi(this.receiptId)).to.be.bignumber.equal(
            this.amount
        );

        expect(await this.lib.getReceiptStatus(this.receiptId)).to.be.bignumber.equal(new BN(1));
    });

    describe("state", () => {
        beforeEach(async () => {
            await this.lib.depositRequest(this.receiptId, user1, this.groupId, this.amount);
        });

        it("deposit received", async () => {
            await this.lib.depositReceived(this.receiptId, this.txId, this.height);

            expect(await this.lib.getReceiptStatus(this.receiptId)).to.be.bignumber.equal(
                new BN(2)
            );

            await this.lib.withdrawRequest(this.receiptId);

            expect(await this.lib.getReceiptStatus(this.receiptId)).to.be.bignumber.equal(
                new BN(3)
            );

            await this.lib.withdrawCompleted(this.receiptId);

            expect(await this.lib.getReceiptStatus(this.receiptId)).to.be.bignumber.equal(
                new BN(0)
            );
        });

        it("withdraw requested", async () => {
            await this.lib.depositReceived(this.receiptId, this.txId, this.height);

            await this.lib.withdrawRequest(this.receiptId);

            await expectRevert(
                this.lib.depositReceived(this.receiptId, this.txId, this.height),
                "receipt is not in DepositRequested state"
            );
        });

        // TODO: expect revert if status not in DepositRequested
    });
});
