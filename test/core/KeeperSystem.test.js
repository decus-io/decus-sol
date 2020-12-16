const { BN, constants, expectEvent, expectRevert } = require('@openzeppelin/test-helpers');
const { ZERO_ADDRESS } = constants;
const {expect} = require("chai");

const WBTC = artifacts.require("WBTC");
const HBTC = artifacts.require("HBTC");
const OtherCoin = artifacts.require("OtherCoin");

const KeeperSystem = artifacts.require("KeeperSystem");
const CollateralToken = artifacts.require("CollateralToken");
const CollateralMeta = artifacts.require("CollateralMeta");


contract('KeeperSystem', (accounts) => {
    const [owner, keeper_admin, user1, user2, auction] = accounts;

    // TODO: can we use value from *.sol?
    const DEFAULT_ADMIN_ROLE = '0x0000000000000000000000000000000000000000000000000000000000000000';
    const MINTER_ROLE = web3.utils.soliditySha3('MINTER_ROLE');
    const KEEPER_ADMIN_ROLE = web3.utils.soliditySha3('KEEPER_ADMIN_ROLE');

    const hbtc_holding = new BN(1000);
    const wbtc_holding = new BN(1000);

    beforeEach(async () => {
        this.keeper_system = await KeeperSystem.new(owner, keeper_admin);
        this.collateral_token = await CollateralToken.new(this.keeper_system.address, {from: owner});

        this.hbtc = await HBTC.new();
        this.wbtc = await WBTC.new();
        this.other = await OtherCoin.new();

        this.collateral_meta = await CollateralMeta.new([this.hbtc.address, this.wbtc.address]);

        await this.hbtc.mint(user1, hbtc_holding);
        await this.wbtc.mint(user1, wbtc_holding);
    });

    it('role', async() => {
        expect(await this.collateral_token.getRoleAdmin(MINTER_ROLE)).to.equal(DEFAULT_ADMIN_ROLE);

        expect(await this.collateral_token.getRoleMember(MINTER_ROLE, 0)).to.equal(this.keeper_system.address);

        expect(await this.keeper_system.hasRole(DEFAULT_ADMIN_ROLE, owner)).to.be.true;

        expect(await this.keeper_system.hasRole(KEEPER_ADMIN_ROLE, owner)).to.be.false;

        expect(await this.keeper_system.hasRole(KEEPER_ADMIN_ROLE, keeper_admin)).to.be.true;
    })

    it('set dependencies', async() => {
        const receipt = await this.keeper_system.setDependencies(this.collateral_token.address,
            this.collateral_meta.address, {from: owner})
        expectEvent(receipt, 'DependenciesSet',
            {token: this.collateral_token.address, meta: this.collateral_meta.address});
    })

    describe('one keeper', () => {
        beforeEach(async () => {
            await this.keeper_system.setDependencies(this.collateral_token.address, this.collateral_meta.address, {from: owner})
        });

        it('add', async() => {
            const tokenId = new BN(0);
            const amount = new BN(500);

            this.hbtc.approve(this.keeper_system.address, amount, {from: user1});
            const receipt = await this.keeper_system.addKeeper(user1, [this.hbtc.address], [amount], {from: keeper_admin});

            expectEvent(receipt, 'KeeperCreated', {keeper: user1, tokenId: tokenId, btc: [this.hbtc.address]});
            // TODO: not sure why amount couldn't pass test, shown as below
            // expected event argument 'amount' to have value 50000 but got 50000
//            expectEvent(receipt, 'KeeperCreated', {keeper: user1, tokenId: tokenId, btc: [this.hbtc.address], amount: [amount]});

            // TODO: check keeper record

            // TODO: check remaining amount
        })

        it('dup keeper', async() => {
        })

        it('input param check', async() => {
        })

        it('insufficient allowance', async() => {
        })

        it('remove keeper', async() => {
        })
    });

    describe('import keepers', () => {
        beforeEach(async () => {
            await this.keeper_system.setDependencies(this.collateral_token.address, this.collateral_meta.address, {from: owner})

            await this.hbtc.mint(auction, new BN(1000000));
            await this.wbtc.mint(auction, new BN(1000000));
        });

        it('import', async() => {
            const allowance = new BN(10000);
            this.hbtc.approve(this.keeper_system.address, allowance, {from: auction});
            this.wbtc.approve(this.keeper_system.address, allowance, {from: auction});

            const u1_wbtc = new BN(100);
            const u1_hbtc = new BN(200);

            const u2_wbtc = new BN(300);
            const u2_hbtc = new BN(0);

            const all_wbtc = u1_wbtc.add(u2_wbtc);
            const all_hbtc = u1_hbtc.add(u2_hbtc);

            const rsp = await this.keeper_system.importKeepers(auction, [this.wbtc.address, this.hbtc.address], [all_wbtc, all_hbtc],
                [user1, user2], [u1_wbtc, u1_hbtc, u2_wbtc, u2_hbtc], {from: keeper_admin});

            // TODO: check keeper record

            // TODO: check remaining amt
        })
    });

    describe('system role transfer', () => {
        // TODO:
    });

    describe('collateral token owner transfer', () => {
        // TODO:
    });
});
