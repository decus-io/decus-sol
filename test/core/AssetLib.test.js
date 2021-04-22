const { BN } = require("@openzeppelin/test-helpers");
const { expect } = require("chai");

const WBTC = artifacts.require("WBTC");
const HBTC = artifacts.require("HBTC");
const OtherCoin = artifacts.require("OtherCoin");
const AssetMeta = artifacts.require("AssetMeta");
const AssetLibMock = artifacts.require("AssetLibMock");

contract("AssetLib", (accounts) => {
  // const [owner] = accounts;

  beforeEach(async () => {
    this.wbtc = await WBTC.new();
    this.hbtc = await HBTC.new();
    this.other = await OtherCoin.new();
    this.meta = await AssetMeta.new([this.hbtc.address, this.wbtc.address]);
    this.lib = await AssetLibMock.new();

    this.satoshi_multiplier = new BN(10).pow(new BN(8));
    this.hbtc_multiplier = new BN(10).pow(await this.hbtc.decimals());
    this.wbtc_multiplier = new BN(10).pow(await this.wbtc.decimals());
  });

  describe("getSatoshiValue", () => {
    it("hbtc", async () => {
      const btcAmount = new BN(10);
      const satoshiAmount = btcAmount.mul(this.satoshi_multiplier);
      const amount = btcAmount.mul(this.hbtc_multiplier);

      await this.lib.setAsset(this.hbtc.address, amount);
      expect(
        await this.lib.getSatoshiValue(this.meta.address)
      ).to.be.bignumber.equal(satoshiAmount);
    });
    it("wbtc", async () => {
      const btcAmount = new BN(10);
      const satoshiAmount = btcAmount.mul(this.satoshi_multiplier);
      const amount = btcAmount.mul(this.wbtc_multiplier);

      await this.lib.setAsset(this.wbtc.address, amount);
      expect(
        await this.lib.getSatoshiValue(this.meta.address)
      ).to.be.bignumber.equal(satoshiAmount);
    });
    // TODO: other coin
  });
});
