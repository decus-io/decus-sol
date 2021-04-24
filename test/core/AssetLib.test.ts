import { expect } from "chai";
import { BigNumber } from "ethers";

import { setup } from "../utils/deploy";
import { WBTC, HBTC, AssetMeta, AssetLibMock } from "../../build/typechain";

describe("AssetLib", () => {
  const satoshi_multiplier = 10 ** 8;
  let hbtc_multiplier: BigNumber;
  let wbtc_multiplier: BigNumber;

  let hbtc: HBTC;
  let wbtc: WBTC;
  let meta: AssetMeta;
  let lib: AssetLibMock;

  beforeEach(async () => {
    ({hbtc, wbtc, meta, lib} = await setup());

    hbtc_multiplier = BigNumber.from(10).pow(await hbtc.decimals());
    wbtc_multiplier = BigNumber.from(10).pow(await wbtc.decimals());
  });

  describe("getSatoshiValue", () => {
    it("hbtc", async () => {
      const btcAmount = BigNumber.from(10);
      const satoshiAmount = btcAmount.mul(satoshi_multiplier);
      const amount = btcAmount.mul(hbtc_multiplier);

      await lib.setAsset(hbtc.address, amount);
      expect(await lib.getSatoshiValue(meta.address)).to.equal(satoshiAmount);
    });

    it("wbtc", async () => {
      const btcAmount = BigNumber.from(10);
      const satoshiAmount = btcAmount.mul(satoshi_multiplier);
      const amount = btcAmount.mul(wbtc_multiplier);

      await lib.setAsset(wbtc.address, amount);
      expect(await lib.getSatoshiValue(meta.address)).to.equal(satoshiAmount);
    });
    // TODO: other coin
  });
});
