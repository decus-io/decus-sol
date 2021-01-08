const { BN, constants, expectEvent, expectRevert } = require('@openzeppelin/test-helpers');
const { ZERO_ADDRESS } = constants;
const {expect} = require("chai");

const WBTC = artifacts.require("WBTC");
const HBTC = artifacts.require("HBTC");
const EBTC = artifacts.require("EBTC");
const OtherCoin = artifacts.require("OtherCoin");

const AssetMeta = artifacts.require("AssetMeta");
const KeeperNFT = artifacts.require("KeeperNFT");
const KeeperRegistry = artifacts.require("KeeperRegistry");
const GroupRegistry = artifacts.require("GroupRegistry");
const DeCusSystem = artifacts.require("DeCusSystem");


contract('DeCusSystem', (accounts) => {
    const [owner, group_owner, keeper1, keeper2, user1] = accounts;

    // TODO: can we use value from *.sol?
    const DEFAULT_ADMIN_ROLE = '0x0000000000000000000000000000000000000000000000000000000000000000';
    const MINTER_ROLE = web3.utils.soliditySha3('MINTER_ROLE');
    const KEEPER_ADMIN_ROLE = web3.utils.soliditySha3('KEEPER_ADMIN_ROLE');
    const GROUP_ADMIN_ROLE = web3.utils.soliditySha3('GROUP_ADMIN_ROLE');

    const hbtc_multiplier = new BN(10).pow(new BN(10));
    const wbtc_holding = new BN(1000);
    const hbtc_holding = (new BN(1000)).mul(hbtc_multiplier);

    const keeper_wbtc_amount = new BN(600);
    const keeper_hbtc_amount = keeper_wbtc_amount.mul(hbtc_multiplier);

    const group1Id = new BN(111);
    const group1BtcAddress = '38aNsdfsdfsdfsdfsdfdsfsdf';
    const group1BtcSatoshiAmount = new BN(200000);

    beforeEach(async () => {
        // prepare system
        this.hbtc = await HBTC.new();
        this.wbtc = await WBTC.new();
        this.other = await OtherCoin.new();
        this.asset_meta = await AssetMeta.new([this.hbtc.address, this.wbtc.address]);

        this.decus_system = await DeCusSystem.new(owner);

        this.keeper_registry = await KeeperRegistry.new(owner, owner);
        this.keeper_nft = await KeeperNFT.new(this.keeper_registry.address, {from: owner});
        await this.keeper_registry.setDependencies(this.keeper_nft.address, this.asset_meta.address, {from: owner})

        // TODO: group_owner later will be set as decus_system
        this.group_registry = await GroupRegistry.new(owner, group_owner);


        // prepare keeper
        await this.hbtc.mint(keeper1, hbtc_holding);
        await this.wbtc.mint(keeper1, wbtc_holding);

        await this.hbtc.mint(keeper2, hbtc_holding);
        await this.wbtc.mint(keeper2, wbtc_holding);

        await this.hbtc.approve(this.keeper_registry.address, keeper_hbtc_amount, {from: keeper1});
        await this.keeper_registry.addKeeper(keeper1, [this.hbtc.address], [keeper_hbtc_amount], {from: owner})
        this.keeper1Id = await this.keeper_registry.getId(keeper1);

        await this.wbtc.approve(this.keeper_registry.address, keeper_wbtc_amount, {from: keeper2});
        await this.keeper_registry.addKeeper(keeper2, [this.wbtc.address], [keeper_wbtc_amount], {from: owner});
        this.keeper2Id = await this.keeper_registry.getId(keeper2);
        this.group1Keepers = [this.keeper1Id, this.keeper2Id];

        await this.group_registry.addGroup(group1Id, this.group1Keepers, group1BtcAddress, group1BtcSatoshiAmount,
            {from: group_owner});
    });

    it('role', async() => {
        expect(await this.decus_system.hasRole(DEFAULT_ADMIN_ROLE, owner)).to.be.true;

        expect(await this.keeper_registry.hasRole(DEFAULT_ADMIN_ROLE, owner)).to.be.true;

        expect(await this.keeper_registry.hasRole(KEEPER_ADMIN_ROLE, owner)).to.be.true;

        expect(await this.group_registry.hasRole(DEFAULT_ADMIN_ROLE, owner)).to.be.true;

        expect(await this.group_registry.hasRole(GROUP_ADMIN_ROLE, group_owner)).to.be.true;
    })

    describe('mint', () => {
//        beforeEach(async () => {
//            await this.decus_system.mintRequest(this.group1Id, this.group1BtcSatoshiAmount, {from: user1});
//        });

//        it('role', async() => {
//        })
    });

});
