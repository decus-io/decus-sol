const { BN, expectEvent, expectRevert } = require("@openzeppelin/test-helpers");
const { expect } = require("chai");

const WBTC = artifacts.require("WBTC");
const HBTC = artifacts.require("HBTC");
const OtherCoin = artifacts.require("OtherCoin");

const KeeperRegistry = artifacts.require("KeeperRegistry");
const KeeperNFT = artifacts.require("KeeperNFT");
const AssetMeta = artifacts.require("AssetMeta");
const GroupRegistry = artifacts.require("GroupRegistry");

/* eslint-disable no-unused-expressions */
contract("GroupRegistry", (accounts) => {
    const [owner, decusSystem, keeper1, keeper2] = accounts;

    // TODO: can we use value from *.sol?
    const DEFAULT_ADMIN_ROLE = "0x0000000000000000000000000000000000000000000000000000000000000000";
    // const MINTER_ROLE = web3.utils.soliditySha3("MINTER_ROLE");
    const GROUP_ADMIN_ROLE = web3.utils.soliditySha3("GROUP_ADMIN_ROLE");

    const hbtcHolding = new BN(1000);
    const wbtcHolding = new BN(1000);

    beforeEach(async () => {
        this.hbtc = await HBTC.new();
        this.wbtc = await WBTC.new();
        this.other = await OtherCoin.new();
        this.asset_meta = await AssetMeta.new([this.hbtc.address, this.wbtc.address]);

        this.keeper_registry = await KeeperRegistry.new(owner, decusSystem);
        this.keeper_nft = await KeeperNFT.new(this.keeper_registry.address, { from: owner });
        await this.keeper_registry.setDependencies(
            this.keeper_nft.address,
            this.asset_meta.address,
            { from: owner }
        );

        await this.hbtc.mint(keeper1, hbtcHolding);
        await this.wbtc.mint(keeper1, wbtcHolding);

        await this.hbtc.mint(keeper2, hbtcHolding);
        await this.wbtc.mint(keeper2, wbtcHolding);

        this.group_registry = await GroupRegistry.new(owner, decusSystem);
    });

    it("role", async () => {
        expect(await this.group_registry.hasRole(DEFAULT_ADMIN_ROLE, owner)).to.be.true;

        expect(await this.group_registry.hasRole(GROUP_ADMIN_ROLE, owner)).to.be.false;

        expect(await this.group_registry.hasRole(GROUP_ADMIN_ROLE, decusSystem)).to.be.true;
    });

    describe("add", () => {
        const groupId = new BN(111);
        const amount = new BN(500);
        const btcAddress = "38aNsdfsdfsdfsdfsdfdsfsdf";

        beforeEach(async () => {
            await this.hbtc.approve(this.keeper_registry.address, amount, { from: keeper1 });
            await this.keeper_registry.addKeeper(keeper1, [this.hbtc.address], [amount], {
                from: keeper1,
            });
            const keeper1Id = await this.keeper_registry.getId(keeper1);

            await this.wbtc.approve(this.keeper_registry.address, amount, { from: keeper2 });
            await this.keeper_registry.addKeeper(keeper2, [this.wbtc.address], [amount], {
                from: keeper2,
            });
            const keeper2Id = await this.keeper_registry.getId(keeper2);
            this.keepers = [keeper1Id, keeper2Id];
        });

        it("add", async () => {
            const rsp = await this.group_registry.addGroup(
                groupId,
                this.keepers,
                btcAddress,
                amount,
                { from: decusSystem }
            );
            expectEvent(rsp, "GroupAdded", {
                id: groupId,
                keepers: this.keepers,
                btcAddress: btcAddress,
                maxSatoshi: amount,
            });

            expect(await this.group_registry.exist(groupId)).to.be.true;
            expect(await this.group_registry.getGroupAllowance(groupId)).to.be.bignumber.equal(
                amount
            );
        });

        it("reject dup id", async () => {
            await this.group_registry.addGroup(groupId, this.keepers, btcAddress, amount, {
                from: decusSystem,
            });
            await expectRevert(
                this.group_registry.addGroup(groupId, this.keepers, btcAddress, amount, {
                    from: decusSystem,
                }),
                "group id already exist"
            );
        });

        describe("delete", () => {
            beforeEach(async () => {
                await this.group_registry.addGroup(groupId, this.keepers, btcAddress, amount, {
                    from: decusSystem,
                });
            });
            it("delete success", async () => {
                const rsp = await this.group_registry.deleteGroup(groupId, { from: decusSystem });
                expectEvent(rsp, "GroupDeleted", { id: groupId });
            });
            it("delete not exist id", async () => {
                await expectRevert(
                    this.group_registry.deleteGroup(new BN(10), { from: decusSystem }),
                    "group id not exist"
                );
            });
        });

        // TODO: group status shift
    });
});
