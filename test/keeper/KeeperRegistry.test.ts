import { expect } from "chai";
import { ethers } from "hardhat";
import { Signer } from "ethers";
import { setup } from "../helper/deploy";
import { WBTC, HBTC, KeeperRegistry, AssetMeta } from "../../build/typechain";

describe("KeeperRegistry", () => {
  let owner: Signer;
  let keeperAdmin: Signer;
  let auction: Signer;
  let user1: Signer;
  let user2: Signer;
  let wbtc: WBTC;
  let hbtc: HBTC;
  let meta: AssetMeta;
  let keeperRegistry: KeeperRegistry;

  const DEFAULT_ADMIN_ROLE =
    "0x0000000000000000000000000000000000000000000000000000000000000000";
  const KEEPER_ADMIN_ROLE = ethers.utils.id("KEEPER_ADMIN_ROLE");

  const hbtcHolding = 1000;
  const wbtcHolding = 1000;

  beforeEach(async () => {
    let users;
    ({ users, owner, meta, keeperRegistry, hbtc, wbtc } = await setup());
    [user1, user2, keeperAdmin, auction] = users;

    await keeperRegistry.grantRole(
      KEEPER_ADMIN_ROLE,
      await keeperAdmin.getAddress()
    );

    await hbtc.mint(await user1.getAddress(), hbtcHolding);
    await wbtc.mint(await user1.getAddress(), wbtcHolding);
  });

  it("role", async () => {
    expect(
      await keeperRegistry.hasRole(DEFAULT_ADMIN_ROLE, await owner.getAddress())
    ).to.be.true;

    expect(
      await keeperRegistry.hasRole(KEEPER_ADMIN_ROLE, await owner.getAddress())
    ).to.be.false;

    expect(
      await keeperRegistry.hasRole(
        KEEPER_ADMIN_ROLE,
        await keeperAdmin.getAddress()
      )
    ).to.be.true;
  });

  it("set dependencies", async () => {
    expect(await keeperRegistry.connect(owner).setDependencies(meta.address))
      .to.emit(keeperRegistry, "DependenciesSet")
      .withArgs(meta.address);
  });

  describe("one keeper", () => {
    const amount = 500;

    beforeEach(async () => {
      await keeperRegistry.connect(owner).setDependencies(meta.address);
      await hbtc.connect(user1).approve(keeperRegistry.address, amount);
    });

    it("add", async () => {
      expect(
        await keeperRegistry
          .connect(user1)
          .addKeeper(await user1.getAddress(), [hbtc.address], [amount])
      )
        .to.emit(keeperRegistry, "KeeperAdded")
        .withArgs(await user1.getAddress(), [hbtc.address], [amount]);

      expect(await keeperRegistry.exist(await user1.getAddress())).to.be.true;

      // return 0 if not exist
      expect(await keeperRegistry.exist(await user2.getAddress())).to.be.false;

      // TODO: check keeper event

      // TODO: check remaining amount
    });

    it("dup keeper", async () => {});

    it("input param check", async () => {});

    it("insufficient allowance", async () => {});

    describe("remove", () => {
      beforeEach(async () => {
        await keeperRegistry
          .connect(user1)
          .addKeeper(await user1.getAddress(), [hbtc.address], [amount]);
      });

      it("remove success", async () => {
        expect(
          await keeperRegistry
            .connect(keeperAdmin)
            .deleteKeeper(await user1.getAddress())
        )
          .to.emit(keeperRegistry, "KeeperDeleted")
          .withArgs(await user1.getAddress());

        expect(await keeperRegistry.exist(await user1.getAddress())).to.be
          .false;
      });

      it("remove fail", async () => {
        await expect(
          keeperRegistry.connect(user1).deleteKeeper(await user1.getAddress())
        ).to.revertedWith("require keeper admin role");
      });
      // TODO: other fail cases
    });
  });

  describe("import keepers", () => {
    beforeEach(async () => {
      await keeperRegistry.connect(owner).setDependencies(meta.address);

      await hbtc.mint(await auction.getAddress(), 1000000);
      await wbtc.mint(await auction.getAddress(), 1000000);
    });

    it("import", async () => {
      const allowance = 10000;
      await hbtc.connect(auction).approve(keeperRegistry.address, allowance);
      await wbtc.connect(auction).approve(keeperRegistry.address, allowance);

      const u1Wbtc = 100;
      const u1Hbtc = 200;

      const u2Wbtc = 300;
      const u2Hbtc = 0;

      expect(
        await keeperRegistry
          .connect(keeperAdmin)
          .importKeepers(
            await auction.getAddress(),
            [wbtc.address, hbtc.address],
            [await user1.getAddress(), await user2.getAddress()],
            [u1Wbtc, u1Hbtc, u2Wbtc, u2Hbtc]
          )
      )
        .to.emit(keeperRegistry, "KeeperImported")
        .withArgs(
          await auction.getAddress(),
          [wbtc.address, hbtc.address],
          [u1Wbtc + u2Wbtc, u1Hbtc + u2Hbtc],
          [await user1.getAddress(), await user2.getAddress()],
          [u1Wbtc, u1Hbtc, u2Wbtc, u2Hbtc]
        );

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
