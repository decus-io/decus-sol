import { expect } from "chai";
import { Signer } from "ethers";
import { setup } from "../helper/deploy";
import { WBTC, HBTC } from "../../build/typechain";

describe("MockBTC", () => {
  let hbtc: HBTC;
  let wbtc: WBTC;
  let recipient: Signer;

  beforeEach(async () => {
    let users;
    ({ hbtc, wbtc, users } = await setup());
    recipient = users[1];
  });

  describe("WBTC", () => {
    const decimals = 8;
    const amount = 50;

    it("decimal", async () => {
      expect(await wbtc.decimals()).to.equal(decimals);
    });

    describe("minting", () => {
      beforeEach("minting", async () => {
        await wbtc.mint(await recipient.getAddress(), amount);
      });

      it("amount", async () => {
        expect(await wbtc.balanceOf(await recipient.getAddress())).to.equal(
          amount
        );
      });
    });
  });

  describe("HBTC", () => {
    const decimals = 18;
    it("decimal", async () => {
      expect(await hbtc.decimals()).to.equal(decimals);
    });
  });
});
