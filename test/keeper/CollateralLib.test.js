const { BN } = require("@openzeppelin/test-helpers");
const { expect } = require("chai");

const WBTC = artifacts.require("WBTC");
const HBTC = artifacts.require("HBTC");
// const OtherCoin = artifacts.require("OtherCoin");
const AssetMeta = artifacts.require("AssetMeta");
const CollateralLibMock = artifacts.require("CollateralLibMock");

/* eslint-disable no-unused-expressions */
contract("CollateralLib", (accounts) => {
  const [, keeper1] = accounts;

  beforeEach(async () => {
    this.wbtc = await WBTC.new();
    this.hbtc = await HBTC.new();
    //        this.other = await OtherCoin.new();
    this.meta = await AssetMeta.new([this.hbtc.address, this.wbtc.address]);
    this.lib = await CollateralLibMock.new();

    this.satoshi_multiplier = new BN(10).pow(new BN(8));
    this.hbtc_multiplier = new BN(10).pow(await this.hbtc.decimals());
    this.wbtc_multiplier = new BN(10).pow(await this.wbtc.decimals());
  });

  it("empty", async () => {
    expect(await this.lib.exist(keeper1)).to.be.false;
  });

  describe("add keeper", () => {
    beforeEach(async () => {
      this.hbtcNumber = new BN(0.5);
      this.wbtcNumber = new BN(0.2);
      this.hbtcAmount = this.hbtcNumber.mul(this.hbtc_multiplier);
      this.wbtcAmount = this.wbtcNumber.mul(this.wbtc_multiplier);
      this.expectSatoshi = this.hbtcNumber
        .add(this.wbtcNumber)
        .mul(this.satoshi_multiplier);

      await this.lib.addKeeper(
        keeper1,
        [this.wbtc.address, this.hbtc.address],
        [this.wbtcAmount, this.hbtcAmount],
        this.meta.address
      );
    });

    it("add", async () => {
      expect(await this.lib.exist(keeper1)).to.be.true;
      expect(await this.lib.getSatoshiValue(keeper1)).to.be.bignumber.equal(
        this.expectSatoshi
      );
    });

    it("delete", async () => {
      await this.lib.deleteKeeper(keeper1);
      expect(await this.lib.exist(keeper1)).to.be.false;
      expect(await this.lib.getSatoshiValue(keeper1)).to.be.bignumber.equal(
        new BN(0)
      );
    });
  });
});
