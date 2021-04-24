import { expect } from "chai";
import { BigNumber, Signer } from "ethers";

import { setup } from "../helper/deploy";
import {
  WBTC,
  HBTC,
  AssetMeta,
  CollateralLibMock,
} from "../../build/typechain";

describe("CollateralLib", () => {
  let hbtc: HBTC;
  let wbtc: WBTC;
  let keeper1: string;
  let meta: AssetMeta;
  let collateralLib: CollateralLibMock;

  let wbtc_multiplier: BigNumber;
  let hbtc_multiplier: BigNumber;
  const satoshi_multiplier = BigNumber.from(10).pow(8);

  beforeEach(async () => {
    let users;
    ({ wbtc, hbtc, meta, users, collateralLib } = await setup());
    keeper1 = await users[1].getAddress();

    hbtc_multiplier = BigNumber.from(10).pow(await hbtc.decimals());
    wbtc_multiplier = BigNumber.from(10).pow(await wbtc.decimals());
  });

  it("empty", async () => {
    expect(await collateralLib.exist(keeper1)).to.be.false;
  });

  describe("add keeper", () => {
    const hbtcNumber = BigNumber.from(5);
    const wbtcNumber = BigNumber.from(2);
    const expectSatoshi = hbtcNumber.add(wbtcNumber).mul(satoshi_multiplier);

    let wbtcAmount: BigNumber;
    let hbtcAmount: BigNumber;

    beforeEach(async () => {
      hbtcAmount = hbtcNumber.mul(hbtc_multiplier);
      wbtcAmount = wbtcNumber.mul(wbtc_multiplier);
      await collateralLib.addKeeper(
        keeper1,
        [wbtc.address, hbtc.address],
        [wbtcAmount, hbtcAmount],
        meta.address
      );
    });

    it("add", async () => {
      expect(await collateralLib.exist(keeper1)).to.be.true;
      expect(await collateralLib.getSatoshiValue(keeper1)).to.equal(
        expectSatoshi
      );
    });

    it("delete", async () => {
      await collateralLib.deleteKeeper(keeper1);
      expect(await collateralLib.exist(keeper1)).to.be.false;
      expect(await collateralLib.getSatoshiValue(keeper1)).to.equal(0);
    });
  });
});
