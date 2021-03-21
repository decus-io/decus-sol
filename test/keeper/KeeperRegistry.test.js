const { BN, expectEvent, expectRevert } = require("@openzeppelin/test-helpers");
const { expect } = require("chai");

const WBTC = artifacts.require("WBTC");
const HBTC = artifacts.require("HBTC");
const OtherCoin = artifacts.require("OtherCoin");

const KeeperRegistry = artifacts.require("KeeperRegistry");
const AssetMeta = artifacts.require("AssetMeta");

/* eslint-disable no-unused-expressions */
contract("KeeperRegistry", (accounts) => {
    const [owner, keeperAdmin, user1, user2, auction] = accounts;

    // TODO: can we use value from *.sol?
    const DEFAULT_ADMIN_ROLE = "0x0000000000000000000000000000000000000000000000000000000000000000";
    const KEEPER_ADMIN_ROLE = web3.utils.soliditySha3("KEEPER_ADMIN_ROLE");

    const hbtcHolding = new BN(1000);
    const wbtcHolding = new BN(1000);

    beforeEach(async () => {
        this.keeperRegistry = await KeeperRegistry.new(owner, keeperAdmin);

        this.hbtc = await HBTC.new();
        this.wbtc = await WBTC.new();
        this.other = await OtherCoin.new();

        this.assetMeta = await AssetMeta.new([this.hbtc.address, this.wbtc.address]);

        await this.hbtc.mint(user1, hbtcHolding);
        await this.wbtc.mint(user1, wbtcHolding);
    });

    it("role", async () => {
        expect(await this.keeperRegistry.hasRole(DEFAULT_ADMIN_ROLE, owner)).to.be.true;

        expect(await this.keeperRegistry.hasRole(KEEPER_ADMIN_ROLE, owner)).to.be.false;

        expect(await this.keeperRegistry.hasRole(KEEPER_ADMIN_ROLE, keeperAdmin)).to.be.true;
    });

    it("set dependencies", async () => {
        const receipt = await this.keeperRegistry.setDependencies(this.assetMeta.address, {
            from: owner,
        });
        expectEvent(receipt, "DependenciesSet", {
            meta: this.assetMeta.address,
        });
    });

    describe("one keeper", () => {
        const amount = new BN(500);

        beforeEach(async () => {
            await this.keeperRegistry.setDependencies(this.assetMeta.address, { from: owner });
            await this.hbtc.approve(this.keeperRegistry.address, amount, { from: user1 });
        });

        it("add", async () => {
            const receipt = await this.keeperRegistry.addKeeper(
                user1,
                [this.hbtc.address],
                [amount],
                { from: user1 }
            );
            expectEvent(receipt, "KeeperAdded", {
                keeper: user1,
                btc: [this.hbtc.address],
            });
            // TODO: not sure why amount couldn't pass test, shown as below
            // expected event argument 'amount' to have value 50000 but got 50000
            // expectEvent(receipt, 'KeeperAdded', {keeper: user1, tokenId: tokenId, btc: [this.hbtc.address], amount: [amount]});

            expect(await this.keeperRegistry.exist(user1)).to.be.true;

            // return 0 if not exist
            expect(await this.keeperRegistry.exist(user2)).to.be.false;

            // TODO: check keeper event

            // TODO: check remaining amount
        });

        it("dup keeper", async () => {});

        it("input param check", async () => {});

        it("insufficient allowance", async () => {});

        describe("remove", () => {
            beforeEach(async () => {
                await this.keeperRegistry.addKeeper(user1, [this.hbtc.address], [amount], {
                    from: user1,
                });
            });

            it("remove success", async () => {
                const receipt = await this.keeperRegistry.deleteKeeper(user1, {
                    from: keeperAdmin,
                });
                expectEvent(receipt, "KeeperDeleted", { keeper: user1 });

                expect(await this.keeperRegistry.exist(user1)).to.be.false;
            });

            it("remove fail", async () => {
                await expectRevert(
                    this.keeperRegistry.deleteKeeper(user1, { from: user1 }),
                    "require keeper admin role"
                );
            });
            // TODO: other fail cases
        });
    });

    describe("import keepers", () => {
        beforeEach(async () => {
            await this.keeperRegistry.setDependencies(this.assetMeta.address, { from: owner });

            await this.hbtc.mint(auction, new BN(1000000));
            await this.wbtc.mint(auction, new BN(1000000));
        });

        it("import", async () => {
            const allowance = new BN(10000);
            await this.hbtc.approve(this.keeperRegistry.address, allowance, { from: auction });
            await this.wbtc.approve(this.keeperRegistry.address, allowance, { from: auction });

            const u1Wbtc = new BN(100);
            const u1Hbtc = new BN(200);

            const u2Wbtc = new BN(300);
            const u2Hbtc = new BN(0);

            const rsp = await this.keeperRegistry.importKeepers(
                auction,
                [this.wbtc.address, this.hbtc.address],
                [user1, user2],
                [u1Wbtc, u1Hbtc, u2Wbtc, u2Hbtc],
                { from: keeperAdmin }
            );
            expectEvent(rsp, "KeeperImported", {
                from: auction,
                assets: [this.wbtc.address, this.hbtc.address],
                keepers: [user1, user2],
            });

            // TODO: check keeper record

            // TODO: check remaining amt
        });
    });

    describe("system role transfer", () => {
        // TODO:
    });

    describe("keeper nft owner transfer", () => {
        // TODO:
    });
});
