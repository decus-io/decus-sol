const { BN, expectRevert } = require("@openzeppelin/test-helpers");
const expectEvent = require("@openzeppelin/test-helpers/src/expectEvent");
const { expect } = require("chai");
const { advanceTime, advanceTimeAndBlock, prepareSignature } = require("../helper");

const WBTC = artifacts.require("WBTC");
const HBTC = artifacts.require("HBTC");
const EBTC = artifacts.require("EBTC");
const OtherCoin = artifacts.require("OtherCoin");

const AssetMeta = artifacts.require("AssetMeta");
const KeeperRegistry = artifacts.require("KeeperRegistry");
const GroupRegistry = artifacts.require("GroupRegistry");
const ReceiptController = artifacts.require("ReceiptController");
const DeCusSystem = artifacts.require("DeCusSystem");

/* eslint-disable no-unused-expressions */
contract("DeCusSystem", (accounts) => {
    const [owner, user1, user2, user3, smallKeeper] = accounts;

    const DEFAULT_ADMIN_ROLE = "0x0000000000000000000000000000000000000000000000000000000000000000";
    const MINTER_ROLE = web3.utils.soliditySha3("MINTER_ROLE");
    const KEEPER_ADMIN_ROLE = web3.utils.soliditySha3("KEEPER_ADMIN_ROLE");
    const GROUP_ADMIN_ROLE = web3.utils.soliditySha3("GROUP_ADMIN_ROLE");
    const RECEIPT_ADMIN_ROLE = web3.utils.soliditySha3("RECEIPT_ADMIN_ROLE");

    const keeperSatoshi = new BN(2).mul(new BN(10).pow(new BN(5))); // 200000
    const keeperSatoshiSmall = new BN(10).pow(new BN(4));
    const hbtcMultiplier = new BN(10).pow(new BN(10));
    const wbtcHolding = keeperSatoshi;
    const hbtcHolding = keeperSatoshi.mul(hbtcMultiplier);

    const keeperWbtcAmount = keeperSatoshi;
    // const keeperHbtcAmount = keeperWbtcAmount.mul(hbtcMultiplier);

    const group0Id = new BN(1);
    const group0BtcAddress = "38aNsdfsdfsdfsdfsdfdsfsdf0";
    const group0BtcSatoshiAmount = keeperSatoshi;

    const group1Id = new BN(2);
    const group1BtcAddress = "38aNsdfsdfsdfsdfsdfdsfsdf";
    const group1BtcSatoshiAmount = keeperSatoshi;

    const receipt1Id = new BN(1);
    const withdrawBtcAddress = "38aNsdfsdfsdfsdfsdfdsfsdf3";

    beforeEach(async () => {
        // prepare system
        // accounts 7-9 from mnemonic "tuition produce fat desk suggest case essence wreck warfare convince razor bless"
        this.keepers = [
            "0x120D00a98e1AeA801cE2a619D688c222a54fE5BE",
            "0xfA64E747AA37242a0F64fE15DCF541831463Eb5c",
            "0xafA363A0d0509701c22734C37154529440a56d26",
        ];
        this.keeperPrivates = [
            "1f7f39846c5a33769fe8ebe42ddcf3c04fac3178756e57ee5d98bddd06d9142f",
            "886880467ec14111b6eede3b87443ce9de13236a8b0753e454a7dfef3bc07b82",
            "8fb2800479b0a8faae75d1bfb2b94af292838ff65e064196d62804b1eb212f47",
        ];
        this.hbtc = await HBTC.new();
        this.wbtc = await WBTC.new();
        this.other = await OtherCoin.new();
        this.asset_meta = await AssetMeta.new([this.hbtc.address, this.wbtc.address]);

        this.keeper_registry = await KeeperRegistry.new();
        await this.keeper_registry.grantRole(KEEPER_ADMIN_ROLE, owner);
        await this.keeper_registry.setDependencies(this.asset_meta.address, { from: owner });

        this.decus_system = await DeCusSystem.new();
        this.ebtc = await EBTC.new();
        await this.ebtc.grantRole(MINTER_ROLE, this.decus_system.address);

        this.group_registry = await GroupRegistry.new();
        await this.group_registry.grantRole(GROUP_ADMIN_ROLE, this.decus_system.address);

        this.receipts = await ReceiptController.new();
        await this.receipts.grantRole(RECEIPT_ADMIN_ROLE, this.decus_system.address);
        this.decus_system.setDependencies(
            this.ebtc.address,
            this.keeper_registry.address,
            this.group_registry.address,
            this.receipts.address,
            { from: owner }
        );

        // prepare keeper
        for (let i = 0; i < this.keepers.length; i++) {
            const keeper = this.keepers[i];
            await this.hbtc.mint(keeper, hbtcHolding);
            await this.wbtc.mint(keeper, wbtcHolding);

            await this.wbtc.approve(this.keeper_registry.address, keeperWbtcAmount, {
                from: keeper,
            });

            await this.keeper_registry.addKeeper(keeper, [this.wbtc.address], [keeperWbtcAmount], {
                from: keeper,
            });
        }

        this.group0Keepers = [this.keepers[1], this.keepers[2]];
        this.group1Keepers = [this.keepers[0], this.keepers[1]];
        this.required = new BN(2);

        await this.decus_system.addGroup(
            this.required,
            group0BtcSatoshiAmount,
            group0BtcAddress,
            this.group0Keepers,
            { from: owner }
        );

        await this.decus_system.addGroup(
            this.required,
            group1BtcSatoshiAmount,
            group1BtcAddress,
            this.group1Keepers,
            { from: owner }
        );
    });

    it("role", async () => {
        expect(await this.decus_system.hasRole(DEFAULT_ADMIN_ROLE, owner)).to.be.true;

        expect(await this.keeper_registry.hasRole(DEFAULT_ADMIN_ROLE, owner)).to.be.true;

        expect(await this.keeper_registry.hasRole(KEEPER_ADMIN_ROLE, owner)).to.be.true;

        expect(await this.group_registry.hasRole(DEFAULT_ADMIN_ROLE, owner)).to.be.true;

        expect(await this.group_registry.hasRole(GROUP_ADMIN_ROLE, this.decus_system.address)).to.be
            .true;

        expect(await this.group_registry.nGroups()).to.be.bignumber.equal(new BN(2));
    });

    it("group id", async () => {
        expect(await this.group_registry.getGroupId(group0BtcAddress)).to.be.bignumber.equal(
            group0Id
        );
        expect(await this.group_registry.getGroupId(group1BtcAddress)).to.be.bignumber.equal(
            group1Id
        );
    });

    it("keeper not enough collateral", async () => {
        const keeper = smallKeeper;
        const amount = keeperSatoshiSmall;
        await this.wbtc.mint(keeper, amount);

        await this.wbtc.approve(this.keeper_registry.address, amount, {
            from: keeper,
        });

        await this.keeper_registry.addKeeper(keeper, [this.wbtc.address], [amount], {
            from: keeper,
        });

        const groupKeepers = [keeper, this.keepers[0]];
        await expectRevert(
            this.decus_system.addGroup(
                this.required,
                amount,
                "38aNsdfsdfsdfsdfsdfdsfsdf000",
                groupKeepers,
                { from: owner }
            ),
            "keepre has not enough collaterl"
        );
    });

    describe("overall state transition", () => {
        it("round", async () => {
            await this.decus_system.mintRequest(group1Id, group1BtcSatoshiAmount, { from: user1 });
            expect(await this.receipts.getWorkingReceiptId(group1Id)).to.be.bignumber.equal(
                receipt1Id
            );
            expect(await this.receipts.getReceiptStatus(receipt1Id)).to.be.bignumber.equal(
                new BN(1)
            );

            await expectRevert(
                this.decus_system.mintRequest(group1Id, group1BtcSatoshiAmount, { from: user2 }),
                "group is occupied with pending receipt"
            );

            await advanceTimeAndBlock(0);
            await advanceTimeAndBlock(0);
            await expectRevert(
                this.decus_system.mintRequest(group1Id, group1BtcSatoshiAmount, { from: user2 }),
                "revert group is occupied with pending receipt"
            );
            expect(await this.receipts.getReceiptStatus(receipt1Id)).to.be.bignumber.equal(
                new BN(1)
            );

            await expectRevert(
                this.decus_system.cancelMintRequest(receipt1Id, {
                    from: user2,
                }),
                "only applicant"
            );

            await this.decus_system.cancelMintRequest(receipt1Id, {
                from: user1,
            });
            expect(await this.receipts.getReceiptStatus(receipt1Id)).to.be.bignumber.equal(
                new BN(0)
            );

            await this.decus_system.mintRequest(group1Id, group1BtcSatoshiAmount, { from: user2 });
            const receipt2Id = await this.receipts.getWorkingReceiptId(group1Id);
            expect(receipt2Id).to.be.bignumber.equal(new BN(2));
            expect(await this.receipts.getReceiptStatus(receipt2Id)).to.be.bignumber.equal(
                new BN(1)
            );
            expect(await this.receipts.getUserAddress(receipt2Id)).to.equal(user2);

            const keepers = [this.keepers[0], this.keepers[1]];
            const privates = [this.keeperPrivates[0], this.keeperPrivates[1]];

            const txId = "0xa1658ce2e63e9f91b6ff5e75c5a69870b04de471f5cd1cc3e53be158b46169bd";
            const height = new BN("1940801");
            const recipient = user2;
            const [rList, sList, packedV] = prepareSignature(
                privates,
                this.decus_system.address,
                recipient,
                receipt2Id,
                group1BtcSatoshiAmount,
                txId,
                height
            );

            await this.decus_system.verifyMint(
                [recipient, receipt2Id, group1BtcSatoshiAmount, txId, height],
                keepers,
                rList,
                sList,
                packedV,
                {
                    from: recipient,
                }
            );
            expect(await this.receipts.getReceiptStatus(receipt2Id)).to.be.bignumber.equal(
                new BN(2)
            );
            const ebtcBalance = group1BtcSatoshiAmount.mul(new BN(10).pow(new BN(10)));
            expect(await this.ebtc.balanceOf(recipient)).to.be.bignumber.equal(ebtcBalance);

            const amount = group1BtcSatoshiAmount.mul(new BN(10).pow(new BN(10)));
            await this.ebtc.approve(this.decus_system.address, amount, { from: user2 });

            await this.decus_system.burnRequest(receipt2Id, withdrawBtcAddress, { from: user2 });
            expect(await this.receipts.getReceiptStatus(receipt2Id)).to.be.bignumber.equal(
                new BN(3)
            );

            await this.decus_system.verifyBurn(receipt2Id, { from: owner });
            expect(await this.receipts.getReceiptStatus(receipt2Id)).to.be.bignumber.equal(
                new BN(0)
            );
        });
        it("group mint start over", async () => {
            const amount = group1BtcSatoshiAmount;
            await this.decus_system.mintRequest(group1Id, amount, { from: user1 });

            const keepers = [this.keepers[0], this.keepers[1]];
            const privates = [this.keeperPrivates[0], this.keeperPrivates[1]];
            const txId = "0xa1658ce2e63e9f91b6ff5e75c5a69870b04de471f5cd1cc3e53be158b46169bd";
            const height = new BN("1940801");
            const recipient = user1;
            const [rList, sList, packedV] = prepareSignature(
                privates,
                this.decus_system.address,
                recipient,
                receipt1Id,
                amount,
                txId,
                height
            );

            await this.decus_system.verifyMint(
                [recipient, receipt1Id, amount, txId, height],
                keepers,
                rList,
                sList,
                packedV,
                {
                    from: user3,
                }
            );

            const ebtcBalance = amount.mul(new BN(10).pow(new BN(10)));
            expect(await this.ebtc.balanceOf(recipient)).to.be.bignumber.equal(ebtcBalance);

            await this.ebtc.approve(user2, ebtcBalance, { from: user1 });
            await this.ebtc.transfer(user2, ebtcBalance, { from: user1 });

            await this.ebtc.approve(this.decus_system.address, ebtcBalance, { from: user2 });
            await this.decus_system.burnRequest(receipt1Id, withdrawBtcAddress, { from: user2 });

            // await advanceTimeAndBlock(0);

            // finish previous
            await this.decus_system.mintRequest(group1Id, amount, { from: user2 });
            const receipt2Id = new BN(2);
            expect(await this.receipts.getWorkingReceiptId(group1Id)).to.be.bignumber.equal(
                receipt2Id
            );
        });
    });

    describe("mintVerify", () => {
        const receipt2Id = new BN(2);

        beforeEach(async () => {
            await this.decus_system.mintRequest(group0Id, group0BtcSatoshiAmount, { from: user1 });
            await this.decus_system.mintRequest(group1Id, group1BtcSatoshiAmount, { from: user2 });
        });

        it("verify misorder", async () => {
            expect(await this.receipts.getWorkingReceiptId(group0Id)).to.be.bignumber.equal(
                receipt1Id
            );

            const keepers = [this.keepers[1], this.keepers[2]];
            const privates = [this.keeperPrivates[1], this.keeperPrivates[2]];
            const recipient = user1;
            const txId = "0xa1658ce2e63e9f91b6ff5e75c5a69870b04de471f5cd1cc3e53be158b46169bd";
            const height = new BN("1940801");
            const [rList, sList, packedV] = prepareSignature(
                privates,
                this.decus_system.address,
                recipient,
                receipt1Id,
                group1BtcSatoshiAmount,
                txId,
                height
            );

            await expectRevert(
                this.decus_system.verifyMint(
                    [recipient, receipt1Id, group1BtcSatoshiAmount, txId, height],
                    keepers,
                    rList,
                    sList,
                    packedV,
                    {
                        from: recipient,
                    }
                ),
                "keepers not in ascending orders"
            );
        });

        it("verify twice", async () => {
            const keepers = [this.keepers[2], this.keepers[1]];
            const privates = [this.keeperPrivates[2], this.keeperPrivates[1]];
            const recipient = user1;
            const txId = "0xa1658ce2e63e9f91b6ff5e75c5a69870b04de471f5cd1cc3e53be158b46169bd";
            const height = new BN("1940801");
            const [rList, sList, packedV] = prepareSignature(
                privates,
                this.decus_system.address,
                recipient,
                receipt1Id,
                group1BtcSatoshiAmount,
                txId,
                height
            );
            await this.decus_system.verifyMint(
                [recipient, receipt1Id, group1BtcSatoshiAmount, txId, height],
                keepers,
                rList,
                sList,
                packedV,
                {
                    from: recipient,
                }
            );

            await expectRevert(
                this.decus_system.verifyMint(
                    [recipient, receipt1Id, group1BtcSatoshiAmount, txId, height],
                    keepers,
                    rList,
                    sList,
                    packedV,
                    {
                        from: recipient,
                    }
                ),
                "receipt already verified"
            );
        });

        it("verify two requests", async () => {
            const txId = "0xa1658ce2e63e9f91b6ff5e75c5a69870b04de471f5cd1cc3e53be158b46169bd";
            const height = new BN("1940801");

            let keepers = [this.keepers[2], this.keepers[1]];
            let privates = [this.keeperPrivates[2], this.keeperPrivates[1]];
            let recipient = user1;
            let [rList, sList, packedV] = prepareSignature(
                privates,
                this.decus_system.address,
                recipient,
                receipt1Id,
                group1BtcSatoshiAmount,
                txId,
                height
            );
            await this.decus_system.verifyMint(
                [recipient, receipt1Id, group1BtcSatoshiAmount, txId, height],
                keepers,
                rList,
                sList,
                packedV,
                {
                    from: recipient,
                }
            );

            keepers = [this.keepers[0], this.keepers[1]];
            privates = [this.keeperPrivates[0], this.keeperPrivates[1]];
            recipient = user2;
            [rList, sList, packedV] = prepareSignature(
                privates,
                this.decus_system.address,
                recipient,
                receipt2Id,
                group1BtcSatoshiAmount,
                txId,
                height
            );
            await expectRevert(
                this.decus_system.verifyMint(
                    [recipient, receipt2Id, group1BtcSatoshiAmount, txId, height],
                    keepers,
                    rList,
                    sList,
                    packedV,
                    {
                        from: recipient,
                    }
                ),
                "keeper is in cooldown"
            );

            let currentTimestamp = (await web3.eth.getBlock("latest")).timestamp;
            expect((await this.decus_system.cooldownUntil(this.keepers[0])).toNumber()).to.be.equal(
                0
            );
            expect(
                (await this.decus_system.cooldownUntil(this.keepers[1])).toNumber()
            ).to.be.approximately(currentTimestamp + 10 * 60, 1);
            expect(
                (await this.decus_system.cooldownUntil(this.keepers[2])).toNumber()
            ).to.be.approximately(currentTimestamp + 10 * 60, 1);
            const prevTimestamp = (
                await this.decus_system.cooldownUntil(this.keepers[2])
            ).toNumber();

            advanceTime(10 * 60 + 1);
            await this.decus_system.verifyMint(
                [recipient, receipt2Id, group1BtcSatoshiAmount, txId, height],
                keepers,
                rList,
                sList,
                packedV,
                {
                    from: recipient,
                }
            );

            currentTimestamp = (await web3.eth.getBlock("latest")).timestamp;
            expect(
                (await this.decus_system.cooldownUntil(this.keepers[0])).toNumber()
            ).to.be.approximately(currentTimestamp + 10 * 60, 1);
            expect(
                (await this.decus_system.cooldownUntil(this.keepers[1])).toNumber()
            ).to.be.approximately(currentTimestamp + 10 * 60, 1);
            expect((await this.decus_system.cooldownUntil(this.keepers[2])).toNumber()).to.be.equal(
                prevTimestamp
            );
        });
    });

    describe("mint", () => {
        beforeEach(async () => {
            await this.decus_system.mintRequest(group0Id, group0BtcSatoshiAmount, { from: user1 });
        });

        it("check", async () => {
            expect(await this.receipts.getWorkingReceiptId(group0Id)).to.be.bignumber.equal(
                receipt1Id
            );

            expect(await this.receipts.getReceiptStatus(receipt1Id)).to.be.bignumber.equal(
                new BN(1)
            );

            expect(await this.receipts.isGroupAvailable(group0Id)).to.be.false;
        });

        it("stale", async () => {
            expect(await this.receipts.isStale(receipt1Id)).to.be.false;

            await advanceTimeAndBlock(0);
            await advanceTimeAndBlock(0);

            expect(await this.receipts.isStale(receipt1Id)).to.be.true;
        });

        it("force mint", async () => {
            await advanceTimeAndBlock(0);
            await advanceTimeAndBlock(0);

            await expectRevert(
                this.decus_system.mintRequest(group0Id, group0BtcSatoshiAmount, {
                    from: user3,
                }),
                "group is occupied with pending receipt"
            );
            expect(await this.receipts.getWorkingReceiptId(group0Id)).to.be.bignumber.equal(
                receipt1Id
            );
            expect(await this.receipts.getReceiptStatus(receipt1Id)).to.be.bignumber.equal(
                new BN(1)
            );

            expect(await this.receipts.isGroupAvailable(group0Id)).to.be.false;
            expect(await this.receipts.isGroupAvailable(group1Id)).to.be.true;

            await expectRevert(
                this.decus_system.forceMintRequest(group0Id, group0BtcSatoshiAmount, {
                    from: user3,
                }),
                "There are available groups in registry to request"
            );

            await this.decus_system.mintRequest(group1Id, group1BtcSatoshiAmount, { from: user2 });

            expect(await this.receipts.isGroupAvailable(group0Id)).to.be.false;
            expect(await this.receipts.isGroupAvailable(group1Id)).to.be.false;

            const receiptId = new BN(3);
            const rsp = await this.decus_system.forceMintRequest(group0Id, group0BtcSatoshiAmount, {
                from: user3,
            });
            expectEvent(rsp, "MintRequested", {
                groupId: group0Id,
                receiptId: receiptId,
                from: user3,
                amountInSatoshi: group0BtcSatoshiAmount,
            });

            expect(await this.receipts.getWorkingReceiptId(group0Id)).to.be.bignumber.equal(
                receiptId
            );
        });
    });

    describe("ban", () => {
        it("should revert if not admin", async () => {
            await expectRevert(
                this.decus_system.ban(this.keepers[0], 60, { from: user1 }),
                "require admin role"
            );
        });
        it("should ban keeper", async () => {
            expect(await this.decus_system.cooldownUntil(this.keepers[0])).to.be.bignumber.equal(
                new BN(0)
            );
            await this.decus_system.ban(this.keepers[0], 60, { from: owner });
            const currentTimestamp = (await web3.eth.getBlock("latest")).timestamp;

            expect(await this.decus_system.cooldownUntil(this.keepers[0])).to.be.bignumber.equal(
                new BN(currentTimestamp + 60)
            );
        });
    });
});
