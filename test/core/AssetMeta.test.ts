import { expect } from "chai";
import { BigNumber } from "ethers";

import { setup } from "../helper/deploy";
import { WBTC, HBTC, OtherCoin, AssetMeta } from "../../build/typechain";

describe("AssetMeta", () => {
  let hbtc: HBTC;
  let wbtc: WBTC;
  let other: OtherCoin;
  let meta: AssetMeta;

  beforeEach(async () => {
    ({ hbtc, wbtc, other, meta } = await setup());
  });

  it("wbtc", async () => {
    const divisor = 1;
    expect(await meta.exists(wbtc.address)).to.be.true;
    expect(await meta.getSatoshiDivisor(wbtc.address)).to.equal(divisor);
  });

  it("hbtc", async () => {
    const divisor = BigNumber.from(10).pow(10);
    expect(await meta.exists(hbtc.address)).to.be.true;
    expect(await meta.getSatoshiDivisor(hbtc.address)).to.equal(divisor);
  });

  it("other", async () => {
    expect(await meta.exists(other.address)).to.be.false;
    await expect(meta.getSatoshiDivisor(other.address)).to.revertedWith(
      "not supported collateral asset"
    );
  });
});
