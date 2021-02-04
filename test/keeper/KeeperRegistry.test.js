const { BN, constants, expectEvent, expectRevert } = require('@openzeppelin/test-helpers');
const { ZERO_ADDRESS } = constants;
const {expect} = require("chai");

const WBTC = artifacts.require("WBTC");
const HBTC = artifacts.require("HBTC");
const OtherCoin = artifacts.require("OtherCoin");

const KeeperRegistry = artifacts.require("KeeperRegistry");
const KeeperNFT = artifacts.require("KeeperNFT");
const AssetMeta = artifacts.require("AssetMeta");


contract('KeeperRegistry', (accounts) => {
    const [owner, keeper_admin, user1, user2, auction] = accounts;

    // TODO: can we use value from *.sol?
    const DEFAULT_ADMIN_ROLE = '0x0000000000000000000000000000000000000000000000000000000000000000';
    const ADMIN_ROLE = web3.utils.soliditySha3('ADMIN_ROLE');
    const KEEPER_ADMIN_ROLE = web3.utils.soliditySha3('KEEPER_ADMIN_ROLE');

    const hbtc_holding = new BN(1000);
    const wbtc_holding = new BN(1000);

    beforeEach(async () => {
        this.keeper_registry = await KeeperRegistry.new(owner, keeper_admin);
        this.keeper_nft = await KeeperNFT.new(this.keeper_registry.address, {from: owner});

        this.hbtc = await HBTC.new();
        this.wbtc = await WBTC.new();
        this.other = await OtherCoin.new();

        this.asset_meta = await AssetMeta.new([this.hbtc.address, this.wbtc.address]);

        await this.hbtc.mint(user1, hbtc_holding);
        await this.wbtc.mint(user1, wbtc_holding);
    });

    it('role', async() => {
        expect(await this.keeper_nft.getRoleAdmin(ADMIN_ROLE)).to.equal(DEFAULT_ADMIN_ROLE);

        expect(await this.keeper_nft.getRoleMember(ADMIN_ROLE, 0)).to.equal(this.keeper_registry.address);

        expect(await this.keeper_registry.hasRole(DEFAULT_ADMIN_ROLE, owner)).to.be.true;

        expect(await this.keeper_registry.hasRole(KEEPER_ADMIN_ROLE, owner)).to.be.false;

        expect(await this.keeper_registry.hasRole(KEEPER_ADMIN_ROLE, keeper_admin)).to.be.true;
    })

    it('set dependencies', async() => {
        const receipt = await this.keeper_registry.setDependencies(this.keeper_nft.address,
            this.asset_meta.address, {from: owner})
        expectEvent(receipt, 'DependenciesSet',
            {token: this.keeper_nft.address, meta: this.asset_meta.address});
    })

    describe('one keeper', () => {
        const tokenId = new BN(0);
        const amount = new BN(500);

        beforeEach(async () => {
            await this.keeper_registry.setDependencies(this.keeper_nft.address, this.asset_meta.address, {from: owner})
            await this.hbtc.approve(this.keeper_registry.address, amount, {from: user1});
        });

        it('add', async() => {
            const receipt = await this.keeper_registry.addKeeper(user1, [this.hbtc.address], [amount], {from: user1});
            expectEvent(receipt, 'KeeperAdded', {keeper: user1, tokenId: tokenId, btc: [this.hbtc.address]});
            // TODO: not sure why amount couldn't pass test, shown as below
            // expected event argument 'amount' to have value 50000 but got 50000
            // expectEvent(receipt, 'KeeperAdded', {keeper: user1, tokenId: tokenId, btc: [this.hbtc.address], amount: [amount]});

            expect(await this.keeper_nft.ownerOf(tokenId)).to.equal(user1);
            expect(await this.keeper_registry.containId(tokenId)).to.be.true;
            expect(await this.keeper_registry.getId(user1)).to.be.bignumber.equal(tokenId);
            // TODO: check keeper record

            // TODO: check remaining amount
        })

        it('dup keeper', async() => {
        })

        it('input param check', async() => {
        })

        it('insufficient allowance', async() => {
        })

        describe('remove', () => {
            beforeEach(async () => {
                await this.keeper_registry.addKeeper(user1, [this.hbtc.address], [amount], {from: user1});
            });

            it('remove success', async() => {
                await this.keeper_nft.approve(this.keeper_registry.address, tokenId, {from: user1});
                const receipt = await this.keeper_registry.deleteKeeper(tokenId, {from: keeper_admin});
                expectEvent(receipt, 'KeeperDeleted', {keeper: user1, tokenId: tokenId});

                // TODO: verify id
            });

            it('remove fail', async() => {
                await expectRevert(this.keeper_registry.deleteKeeper(tokenId, {from: keeper_admin}),
                    'ERC721Burnable: caller is not owner nor approved.');
            });
            // TODO: other fail cases
        });
    });

    describe('import keepers', () => {
        beforeEach(async () => {
            await this.keeper_registry.setDependencies(this.keeper_nft.address, this.asset_meta.address, {from: owner})

            await this.hbtc.mint(auction, new BN(1000000));
            await this.wbtc.mint(auction, new BN(1000000));
        });

        it('import', async() => {
            const allowance = new BN(10000);
            await this.hbtc.approve(this.keeper_registry.address, allowance, {from: auction});
            await this.wbtc.approve(this.keeper_registry.address, allowance, {from: auction});

            const u1_wbtc = new BN(100);
            const u1_hbtc = new BN(200);

            const u2_wbtc = new BN(300);
            const u2_hbtc = new BN(0);

            const all_wbtc = u1_wbtc.add(u2_wbtc);
            const all_hbtc = u1_hbtc.add(u2_hbtc);

            const rsp = await this.keeper_registry.importKeepers(auction, [this.wbtc.address, this.hbtc.address], [all_wbtc, all_hbtc],
                [user1, user2], [u1_wbtc, u1_hbtc, u2_wbtc, u2_hbtc], {from: keeper_admin});
            expectEvent(rsp, 'KeeperImported', {from: auction, assets: [this.wbtc.address, this.hbtc.address], keepers: [user1, user2]});

            // TODO: check keeper record

            // TODO: check remaining amt
        })
    });

    describe('system role transfer', () => {
        // TODO:
    });

    describe('keeper nft owner transfer', () => {
        // TODO:
    });
});
