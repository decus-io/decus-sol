const { BN, expectRevert } = require("@openzeppelin/test-helpers");
const { expect } = require("chai");

const GroupLibMock = artifacts.require("GroupLibMock");

/* eslint-disable no-unused-expressions */
contract("GroupLib", (accounts) => {
    // const [owner] = accounts;

    beforeEach(async () => {
        this.keeper1 = new BN(100);
        this.keeper2 = new BN(101);
        this.keeper3 = new BN(102);

        this.groupId = new BN(3333);
        this.groupId2 = new BN(3334);
        this.unknownGroupID = new BN(0);

        this.allowance = new BN(100000);
        this.allowance2 = new BN(200000);

        this.btcAddress1 = "3xsdf2sdfsdfsdf";
        this.btcAddress2 = "3xsdf2sdfsdfsdf2";
        this.btcAddress1Dup = "3xsdf2sdfsdfsdf";

        this.lib = await GroupLibMock.new();
    });

    it("initial", async () => {
        expect(await this.lib.exist(this.groupId)).to.be.false;
        expect(await this.lib.exist(this.unknownGroupID)).to.be.false;
    });

    describe("one group", () => {
        beforeEach(async () => {
            await this.lib.addGroup(
                this.groupId,
                [this.keeper1, this.keeper2],
                this.btcAddress1,
                this.allowance
            );
        });

        it("check", async () => {
            expect(await this.lib.exist(this.groupId)).to.be.true;

            expect(await this.lib.getGroupAllowance(this.groupId)).to.be.bignumber.equal(
                this.allowance
            );

            expect(await this.lib.isGroupEmpty(this.groupId)).to.be.true;

            expect(await this.lib.isGroupKeeper(this.groupId, this.keeper1)).to.be.true;
            expect(await this.lib.isGroupKeeper(this.groupId, this.keeper2)).to.be.true;
            expect(await this.lib.isGroupKeeper(this.groupId, this.keeper3)).to.be.false;

            expect(JSON.stringify((await this.lib.getGroupKeepers(this.groupId)).sort())).to.equal(
                JSON.stringify([this.keeper1, this.keeper2].sort())
            );

            expect(await this.lib.nGroups()).to.be.bignumber.equal(new BN(1));

            expect(await this.lib.getKeeperGroups(this.keeper1, new BN(0))).to.be.bignumber.equal(
                new BN(1)
            );
        });

        it("add satoshi", async () => {
            const addedAmount = new BN(1000);

            await this.lib.addGroupSatoshi(this.groupId, addedAmount);

            expect(await this.lib.getGroupAllowance(this.groupId)).to.be.bignumber.equal(
                this.allowance.sub(addedAmount)
            );
        });

        it("remove satoshi", async () => {
            const addedAmount = new BN(1000);

            await this.lib.addGroupSatoshi(this.groupId, addedAmount);

            expect(await this.lib.getGroupAllowance(this.groupId)).to.be.bignumber.equal(
                this.allowance.sub(addedAmount)
            );
        });

        it("fill satoshi", async () => {
            await this.lib.fillGroupSatoshi(this.groupId);

            expect(await this.lib.getGroupAllowance(this.groupId)).to.be.bignumber.equal(new BN(0));
        });

        it("empty satoshi", async () => {
            await this.lib.fillGroupSatoshi(this.groupId);

            await this.lib.emptyGroupSatoshi(this.groupId);

            expect(await this.lib.getGroupAllowance(this.groupId)).to.be.bignumber.equal(
                this.allowance
            );
        });

        it("fill satoshi fail", async () => {
            const addedAmount = new BN(1000);

            await this.lib.addGroupSatoshi(this.groupId, addedAmount);

            await expectRevert(this.lib.fillGroupSatoshi(this.groupId), "currSatoshi is not empty");
        });

        it("empty satoshi fail", async () => {
            const addedAmount = new BN(1000);

            await this.lib.addGroupSatoshi(this.groupId, addedAmount);

            await expectRevert(this.lib.emptyGroupSatoshi(this.groupId), "currSatoshi is not full");
        });
    });

    describe("group add", () => {
        beforeEach(async () => {
            await this.lib.addGroup(
                this.groupId,
                [this.keeper1, this.keeper2],
                this.btcAddress1,
                this.allowance
            );
        });

        it("add another", async () => {
            await this.lib.addGroup(
                this.groupId2,
                [this.keeper2, this.keeper3],
                this.btcAddress2,
                this.allowance
            );

            expect(await this.lib.exist(this.groupId2)).to.be.true;

            expect(await this.lib.getGroupAllowance(this.groupId2)).to.be.bignumber.equal(
                this.allowance
            );

            expect(await this.lib.nGroups()).to.be.bignumber.equal(new BN(2));

            expect(await this.lib.getKeeperGroups(this.keeper2, new BN(0))).to.be.bignumber.equal(
                new BN(3)
            );

            expect(await this.lib.getKeeperGroups(this.keeper3, new BN(0))).to.be.bignumber.equal(
                new BN(2)
            );

            expect(await this.lib.getKeeperGroups(this.keeper2, new BN(1))).to.be.bignumber.equal(
                new BN(1)
            );
        });

        it("add dup id", async () => {
            await expectRevert(
                this.lib.addGroup(
                    this.groupId,
                    [this.keeper2, this.keeper3],
                    this.btcAddress2,
                    this.allowance
                ),
                "group id already exist"
            );
        });

        it("set allowance", async () => {
            const groupIndex = new BN(0);
            await this.lib.setMaxSatoshi(groupIndex, this.allowance2);
            expect(await this.lib.getGroupAllowance(this.groupId)).to.be.bignumber.equal(
                this.allowance2
            );
        });

        it("set allowance all", async () => {
            await this.lib.addGroup(
                this.groupId2,
                [this.keeper2, this.keeper3],
                this.btcAddress2,
                this.allowance
            );

            await this.lib.setMaxSatoshiAll(this.allowance2);

            expect(await this.lib.getGroupAllowance(this.groupId)).to.be.bignumber.equal(
                this.allowance2
            );
            expect(await this.lib.getGroupAllowance(this.groupId2)).to.be.bignumber.equal(
                this.allowance2
            );
        });

        //        it('add btc address', async() => {
        //            // TODO:
        //            await this.lib.addGroup(this.groupId2, [this.keeper1, this.keeper2], this.btcAddress1, this.allowance);
        //        })
    });

    describe("delete", () => {
        beforeEach(async () => {
            await this.lib.addGroup(
                this.groupId,
                [this.keeper1, this.keeper2],
                this.btcAddress1,
                this.allowance
            );
        });

        it("delete", async () => {
            expect(await this.lib.exist(this.groupId)).to.be.true;

            await this.lib.deleteGroup(this.groupId);

            expect(await this.lib.exist(this.groupId)).to.be.false;
        });

        it("delete unknown", async () => {
            await expectRevert(this.lib.deleteGroup(this.unknownGroupID), "group id not exist");
        });
    });

    // TODO: add -> delete -> add: the same group
});
