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
    const [owner, keeper1, keeper2, user1, user2] = accounts;

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

    const group1Id = new BN(111);
    const group1BtcAddress = "38aNsdfsdfsdfsdfsdfdsfsdf";
    const group1BtcSatoshiAmount = new BN(200000);

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
            this.keeper_nft.address,
            { from: owner }
        );

        // prepare keeper
        await this.hbtc.mint(keeper1, hbtcHolding);
        await this.wbtc.mint(keeper1, wbtcHolding);

        await this.hbtc.mint(keeper2, hbtcHolding);
        await this.wbtc.mint(keeper2, wbtcHolding);

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
        this.group1Keepers = [this.keeper1Id, this.keeper2Id];

        await this.decus_system.addGroup(
            group1Id,
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

    describe("overall state transition", () => {
        it("round", async () => {
            await this.decus_system.mintRequest(group1Id, group1BtcSatoshiAmount, { from: user2 });
            expect(await this.receipts.getReceiptStatus(group1Id)).to.be.bignumber.equal(new BN(1));

            await expectRevert(
                this.decus_system.mintRequest(group1Id, group1BtcSatoshiAmount, { from: user1 }),
                "previous request has not completed yet"
            );

            advanceTimeAndBlock(0);
            advanceTimeAndBlock(0);
            await this.decus_system.mintRequest(group1Id, group1BtcSatoshiAmount, { from: user1 });
            expect(await this.receipts.getReceiptStatus(group1Id)).to.be.bignumber.equal(new BN(1));

            await expectRevert(
                this.decus_system.cancelMintRequest(group1Id, {
                    from: user2,
                }),
                "only applicant"
            );

            await this.decus_system.cancelMintRequest(group1Id, {
                from: user1,
            });
            expect(await this.receipts.getReceiptStatus(group1Id)).to.be.bignumber.equal(new BN(0));

            await this.decus_system.mintRequest(group1Id, group1BtcSatoshiAmount, { from: user1 });
            expect(await this.receipts.getReceiptStatus(group1Id)).to.be.bignumber.equal(new BN(1));

            // TODO: add correct proof
            await this.decus_system.verifyMint(group1Id, "proofplaceholder", { from: user1 });
            expect(await this.receipts.getReceiptStatus(group1Id)).to.be.bignumber.equal(new BN(2));

            const amount = group1BtcSatoshiAmount.mul(new BN(10).pow(new BN(10)));
            await this.ebtc.approve(this.decus_system.address, amount, { from: user1 });

            await this.decus_system.burnRequest(group1Id, { from: user1 });
            expect(await this.receipts.getReceiptStatus(group1Id)).to.be.bignumber.equal(new BN(3));

            await this.decus_system.verifyBurn(group1Id, { from: user1 });
            expect(await this.receipts.getReceiptStatus(group1Id)).to.be.bignumber.equal(new BN(0));
        });
    });

    describe("mint", () => {
        beforeEach(async () => {
            await this.decus_system.mintRequest(group1Id, group1BtcSatoshiAmount, { from: user1 });
        });

        it("check", async () => {
            expect(await this.receipts.getReceiptStatus(group1Id)).to.be.bignumber.equal(new BN(1));
        });
    });
});
