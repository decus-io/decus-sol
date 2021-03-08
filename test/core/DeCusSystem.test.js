const { BN, expectRevert } = require("@openzeppelin/test-helpers");
const { expect } = require("chai");
const { advanceTimeAndBlock } = require("../helper");

const WBTC = artifacts.require("WBTC");
const HBTC = artifacts.require("HBTC");
const EBTC = artifacts.require("EBTC");
const OtherCoin = artifacts.require("OtherCoin");

const AssetMeta = artifacts.require("AssetMeta");
const KeeperNFT = artifacts.require("KeeperNFT");
const KeeperRegistry = artifacts.require("KeeperRegistry");
const GroupRegistry = artifacts.require("GroupRegistry");
const ReceiptController = artifacts.require("ReceiptController");
const DeCusSystem = artifacts.require("DeCusSystem");

/* eslint-disable no-unused-expressions */
contract("DeCusSystem", (accounts) => {
    const [owner, keeper1, keeper2, keeper3, user1, user2] = accounts;

    // TODO: can we use value from *.sol?
    const DEFAULT_ADMIN_ROLE = "0x0000000000000000000000000000000000000000000000000000000000000000";
    // const MINTER_ROLE = web3.utils.soliditySha3("MINTER_ROLE");
    const KEEPER_ADMIN_ROLE = web3.utils.soliditySha3("KEEPER_ADMIN_ROLE");
    const GROUP_ADMIN_ROLE = web3.utils.soliditySha3("GROUP_ADMIN_ROLE");

    const hbtcMultiplier = new BN(10).pow(new BN(10));
    const wbtcHolding = new BN(1000);
    const hbtcHolding = new BN(1000).mul(hbtcMultiplier);

    const keeperWbtcAmount = new BN(600);
    const keeperHbtcAmount = keeperWbtcAmount.mul(hbtcMultiplier);

    const group0Id = new BN(1);
    const group0BtcAddress = "38aNsdfsdfsdfsdfsdfdsfsdf0";
    const group0BtcSatoshiAmount = new BN(200000);

    const group1Id = new BN(2);
    const group1BtcAddress = "38aNsdfsdfsdfsdfsdfdsfsdf";
    const group1BtcSatoshiAmount = new BN(200000);

    const receipt1Id = new BN(1);

    beforeEach(async () => {
        // prepare system
        this.hbtc = await HBTC.new();
        this.wbtc = await WBTC.new();
        this.other = await OtherCoin.new();
        this.asset_meta = await AssetMeta.new([this.hbtc.address, this.wbtc.address]);

        this.keeper_registry = await KeeperRegistry.new(owner, owner);
        this.keeper_nft = await KeeperNFT.new(this.keeper_registry.address, { from: owner });
        await this.keeper_registry.setDependencies(
            this.keeper_nft.address,
            this.asset_meta.address,
            { from: owner }
        );

        this.decus_system = await DeCusSystem.new(owner);
        this.ebtc = await EBTC.new(owner, this.decus_system.address);

        this.group_registry = await GroupRegistry.new(owner, this.decus_system.address);
        this.receipts = await ReceiptController.new(this.decus_system.address);
        this.decus_system.setDependencies(
            this.ebtc.address,
            this.group_registry.address,
            this.receipts.address,
            { from: owner }
        );

        // prepare keeper
        await this.hbtc.mint(keeper1, hbtcHolding);
        await this.wbtc.mint(keeper1, wbtcHolding);

        await this.hbtc.mint(keeper2, hbtcHolding);
        await this.wbtc.mint(keeper2, wbtcHolding);

        await this.hbtc.mint(keeper3, hbtcHolding);
        await this.wbtc.mint(keeper3, wbtcHolding);

        await this.hbtc.approve(this.keeper_registry.address, keeperHbtcAmount, {
            from: keeper1,
        });
        await this.keeper_registry.addKeeper(keeper1, [this.hbtc.address], [keeperHbtcAmount], {
            from: keeper1,
        });
        this.keeper1Id = await this.keeper_registry.getId(keeper1);

        await this.wbtc.approve(this.keeper_registry.address, keeperWbtcAmount, {
            from: keeper2,
        });
        await this.keeper_registry.addKeeper(keeper2, [this.wbtc.address], [keeperWbtcAmount], {
            from: keeper2,
        });
        this.keeper2Id = await this.keeper_registry.getId(keeper2);

        await this.wbtc.approve(this.keeper_registry.address, keeperWbtcAmount, {
            from: keeper3,
        });
        await this.keeper_registry.addKeeper(keeper3, [this.wbtc.address], [keeperWbtcAmount], {
            from: keeper3,
        });
        this.keeper3Id = await this.keeper_registry.getId(keeper3);

        this.group0Keepers = [this.keeper2Id, this.keeper3Id];
        this.group1Keepers = [this.keeper1Id, this.keeper2Id];

        await this.decus_system.addGroup(
            this.group0Keepers,
            group0BtcAddress,
            group0BtcSatoshiAmount,
            { from: owner }
        );

        await this.decus_system.addGroup(
            this.group1Keepers,
            group1BtcAddress,
            group1BtcSatoshiAmount,
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
    });

    it("group id", async () => {
        expect(await this.group_registry.getGroupId(group0BtcAddress)).to.be.bignumber.equal(
            group0Id
        );
        expect(await this.group_registry.getGroupId(group1BtcAddress)).to.be.bignumber.equal(
            group1Id
        );
    });

    describe("overall state transition", () => {
        it("round", async () => {
            await this.decus_system.mintRequest(group1Id, group1BtcSatoshiAmount, { from: user1 });
            expect(await this.receipts.getWorkingReceiptId(group1Id)).to.be.bignumber.equal(receipt1Id);
            expect(await this.receipts.getReceiptStatus(receipt1Id)).to.be.bignumber.equal(new BN(1));

            await expectRevert(
                this.decus_system.mintRequest(group1Id, group1BtcSatoshiAmount, { from: user2 }),
                "previous request has not completed yet"
            );

            advanceTimeAndBlock(0);
            advanceTimeAndBlock(0);
            await expectRevert(
                this.decus_system.mintRequest(group1Id, group1BtcSatoshiAmount, { from: user2 }),
                "revert group is occupied with pending receipt"
            );
            expect(await this.receipts.getReceiptStatus(receipt1Id)).to.be.bignumber.equal(new BN(1));

            await expectRevert(
                this.decus_system.cancelMintRequest(receipt1Id, {
                    from: user2,
                }),
                "only applicant"
            );

            await this.decus_system.cancelMintRequest(receipt1Id, {
                from: user1,
            });
            expect(await this.receipts.getReceiptStatus(receipt1Id)).to.be.bignumber.equal(new BN(0));

            await this.decus_system.mintRequest(group1Id, group1BtcSatoshiAmount, { from: user2 });
            const receipt2Id = await this.receipts.getWorkingReceiptId(group1Id);
            expect(receipt2Id).to.be.bignumber.equal(new BN(2));
            expect(await this.receipts.getReceiptStatus(receipt2Id)).to.be.bignumber.equal(new BN(1));

            // TODO: add correct proof
            await this.decus_system.verifyMint(group1Id, "proofplaceholder", { from: user2 });
            expect(await this.receipts.getReceiptStatus(receipt2Id)).to.be.bignumber.equal(new BN(2));

            const amount = group1BtcSatoshiAmount.mul(new BN(10).pow(new BN(10)));
            await this.ebtc.approve(this.decus_system.address, amount, { from: user2 });

            await this.decus_system.burnRequest(receipt2Id, { from: user2 });
            expect(await this.receipts.getReceiptStatus(receipt2Id)).to.be.bignumber.equal(new BN(3));

            await this.decus_system.verifyBurn(receipt2Id, "proofplaceholder", { from: user2 });
            expect(await this.receipts.getReceiptStatus(receipt2Id)).to.be.bignumber.equal(new BN(0));
        });
    });

    describe("mint", () => {
        beforeEach(async () => {
            await this.decus_system.mintRequest(group1Id, group1BtcSatoshiAmount, { from: user1 });
        });

        it("check", async () => {
            expect(await this.receipts.getReceiptStatus(receipt1Id)).to.be.bignumber.equal(new BN(1));
        });
    });
});
