const { BN, expectRevert } = require("@openzeppelin/test-helpers");
const { expect } = require("chai");

const ReceiptController = artifacts.require("ReceiptController");

/* eslint-disable no-unused-expressions */
contract("ReceiptController", (accounts) => {
    const [owner, user1] = accounts;

    const RECEIPT_FACTORY_ADMIN_ROLE = web3.utils.soliditySha3("RECEIPT_FACTORY_ADMIN_ROLE");

    beforeEach(async () => {
        this.groupId = new BN(3333);

        this.amount = new BN(100000);

        this.controller = await ReceiptController.new(owner);
    });

    it("role", async () => {
        expect(await this.controller.hasRole(RECEIPT_FACTORY_ADMIN_ROLE, owner)).to.be.true;

        expect(await this.controller.hasRole(RECEIPT_FACTORY_ADMIN_ROLE, user1)).to.be.false;
    });

    it("request deposit", async () => {
        await this.controller.depositRequest(user1, this.groupId, this.amount, { from: owner });

        expect(await this.controller.getReceiptStatus(this.groupId)).to.be.bignumber.equal(
            new BN(1)
        );
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
            await this.controller.depositReceived(this.groupId, { from: owner });

            expect(await this.controller.getReceiptStatus(this.groupId)).to.be.bignumber.equal(
                new BN(2)
            );

            await this.controller.withdrawRequest(this.groupId, { from: owner });

            expect(await this.controller.getReceiptStatus(this.groupId)).to.be.bignumber.equal(
                new BN(3)
            );

            await this.controller.withdrawCompleted(this.groupId, { from: owner });

            expect(await this.controller.getReceiptStatus(this.groupId)).to.be.bignumber.equal(
                new BN(0)
            );
        });

        it("withdraw requested", async () => {
            await this.controller.depositReceived(this.groupId, { from: owner });

            await this.controller.withdrawRequest(this.groupId, { from: owner });

            await expectRevert(
                this.controller.depositReceived(this.groupId),
                "receipt is not in DepositRequested state"
            );
        });

        // TODO: expect revert if status not in DepositRequested
    });
});
