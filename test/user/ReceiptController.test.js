const { BN, expectRevert } = require("@openzeppelin/test-helpers");
const { expect } = require("chai");

const ReceiptController = artifacts.require("ReceiptController");

/* eslint-disable no-unused-expressions */
contract("ReceiptController", (accounts) => {
    const [owner, user1] = accounts;

    const RECEIPT_FACTORY_ADMIN_ROLE = web3.utils.soliditySha3("RECEIPT_FACTORY_ADMIN_ROLE");

    beforeEach(async () => {
        this.receiptId = new BN(1);
        this.groupId = new BN(3333);

        this.amount = new BN(100000);

        this.controller = await ReceiptController.new(owner);
        this.txId = "0xa1658ce2e63e9f91b6ff5e75c5a69870b04de471f5cd1cc3e53be158b46169bd";
        this.height = new BN("1940801");
    });

    it("role", async () => {
        expect(await this.controller.hasRole(RECEIPT_FACTORY_ADMIN_ROLE, owner)).to.be.true;

        expect(await this.controller.hasRole(RECEIPT_FACTORY_ADMIN_ROLE, user1)).to.be.false;
    });

    it("request deposit", async () => {
        await this.controller.depositRequest(user1, this.groupId, this.amount, { from: owner });

        const receiptId = await this.controller.getWorkingReceiptId(this.groupId);

        expect(await this.controller.getReceiptStatus(receiptId)).to.be.bignumber.equal(
            this.receiptId
        );
        expect(await this.controller.getUserAddress(receiptId)).to.equal(user1);
    });

    it("request deposit fail", async () => {
        await expectRevert(
            this.controller.depositRequest(user1, this.groupId, this.amount, { from: user1 }),
            "require admin role"
        );
    });

    describe("state", () => {
        beforeEach(async () => {
            await this.controller.depositRequest(user1, this.groupId, this.amount);
        });

        it("deposit received", async () => {
            await this.controller.depositReceived(this.receiptId, this.txId, this.height, {
                from: owner,
            });

            expect(await this.controller.getReceiptStatus(this.receiptId)).to.be.bignumber.equal(
                new BN(2)
            );

            await this.controller.withdrawRequest(this.receiptId, { from: owner });

            expect(await this.controller.getReceiptStatus(this.receiptId)).to.be.bignumber.equal(
                new BN(3)
            );

            await this.controller.withdrawCompleted(this.receiptId, { from: owner });

            expect(await this.controller.getReceiptStatus(this.receiptId)).to.be.bignumber.equal(
                new BN(0)
            );
        });

        it("withdraw requested", async () => {
            await this.controller.depositReceived(this.receiptId, this.txId, this.height, {
                from: owner,
            });

            await this.controller.withdrawRequest(this.receiptId, { from: owner });

            await expectRevert(
                this.controller.depositReceived(this.receiptId, this.txId, this.height),
                "receipt is not in DepositRequested state"
            );
        });

        // TODO: expect revert if status not in DepositRequested
    });
});
