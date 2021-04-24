import { expect } from "chai";
import { ethers } from "hardhat";
import { Signer } from "ethers";
import { setup } from "../helper/deploy";
import {
  WBTC,
  HBTC,
  KeeperRegistry,
  AssetMeta,
  GroupRegistry,
} from "../../build/typechain";

describe("GroupRegistry", () => {
  let owner: Signer;
  let decusSystem: Signer;
  let keeper1: string;
  let keeper2: string;
  let wbtc: WBTC;
  let hbtc: HBTC;
  let meta: AssetMeta;
  let keeperRegistry: KeeperRegistry;
  let groupRegistry: GroupRegistry;

  const DEFAULT_ADMIN_ROLE =
    "0x0000000000000000000000000000000000000000000000000000000000000000";
  const GROUP_ADMIN_ROLE = ethers.utils.id("GROUP_ADMIN_ROLE");
  const KEEPER_ADMIN_ROLE = ethers.utils.id("KEEPER_ADMIN_ROLE");

  const hbtcHolding = 1000;
  const wbtcHolding = 1000;

  beforeEach(async () => {
    let users;
    ({
      owner,
      users,
      hbtc,
      wbtc,
      meta,
      keeperRegistry,
      groupRegistry,
    } = await setup());

    keeper1 = await users[1].getAddress();
    keeper2 = await users[2].getAddress();
    decusSystem = users[3];

    await keeperRegistry.grantRole(
      KEEPER_ADMIN_ROLE,
      await decusSystem.getAddress()
    );
    await keeperRegistry.setDependencies(meta.address);

    await hbtc.mint(keeper1, hbtcHolding);
    await wbtc.mint(keeper1, wbtcHolding);

    await hbtc.mint(keeper2, hbtcHolding);
    await wbtc.mint(keeper2, wbtcHolding);

    await groupRegistry.grantRole(
      GROUP_ADMIN_ROLE,
      await decusSystem.getAddress()
    );
  });

  it("role", async () => {
    expect(
      await groupRegistry.hasRole(DEFAULT_ADMIN_ROLE, await owner.getAddress())
    ).to.be.true;

    expect(
      await groupRegistry.hasRole(GROUP_ADMIN_ROLE, await owner.getAddress())
    ).to.be.false;

    expect(
      await groupRegistry.hasRole(
        GROUP_ADMIN_ROLE,
        await decusSystem.getAddress()
      )
    ).to.be.true;
  });

  describe("add", () => {
    const groupId = 1;
    const amount = 500;
    const required = 2;
    const btcAddress = "38aNsdfsdfsdfsdfsdfdsfsdf";
    let keepers: string[];

    beforeEach(async () => {
      await hbtc
        .connect(await ethers.getSigner(keeper1))
        .approve(keeperRegistry.address, amount);
      await keeperRegistry
        .connect(await ethers.getSigner(keeper1))
        .addKeeper(keeper1, [hbtc.address], [amount]);

      await wbtc
        .connect(await ethers.getSigner(keeper2))
        .approve(keeperRegistry.address, amount);
      await keeperRegistry
        .connect(await ethers.getSigner(keeper2))
        .addKeeper(keeper2, [wbtc.address], [amount]);
      keepers = [keeper1, keeper2];
    });

    it("add", async () => {
      expect(
        await groupRegistry
          .connect(decusSystem)
          .addGroup(required, amount, btcAddress, keepers)
      )
        .to.emit(groupRegistry, "GroupAdded")
        .withArgs(groupId, required, amount, btcAddress, keepers);

      const groupIdArray = await groupRegistry.listGroupId();
      expect(Array.isArray(groupIdArray)).to.equal(true);
      expect(groupIdArray.length).to.equal(1);
      expect(groupIdArray[0]).to.equal(groupId);

      expect(await groupRegistry.getGroupId(btcAddress)).to.equal(groupId);
      expect(await groupRegistry.exist(groupId)).to.be.true;
      expect(await groupRegistry.getGroupAllowance(groupId)).to.equal(amount);

      const keeperGroupIdArray = await groupRegistry.getKeeperGroupIds(keeper1);
      expect(Array.isArray(keeperGroupIdArray)).to.equal(true);
      expect(keeperGroupIdArray.length).to.equal(1);
      expect(keeperGroupIdArray[0]).to.equal(groupId);
    });

    it("reject dup id", async () => {
      await groupRegistry
        .connect(decusSystem)
        .addGroup(required, amount, btcAddress, keepers);
      await expect(
        groupRegistry
          .connect(decusSystem)
          .addGroup(required, amount, btcAddress, keepers)
      ).to.revertedWith("group address already exist");
    });

    describe("delete", () => {
      beforeEach(async () => {
        await groupRegistry
          .connect(decusSystem)
          .addGroup(required, amount, btcAddress, keepers);
      });
      it("delete success", async () => {
        const id = await groupRegistry.getGroupId(btcAddress);
        expect(await groupRegistry.connect(decusSystem).deleteGroup(id))
          .to.emit(groupRegistry, "GroupDeleted")
          .withArgs(id);
      });
      it("delete not exist id", async () => {
        await expect(
          groupRegistry.connect(decusSystem).deleteGroup(10)
        ).to.revertedWith("group id not exist");
      });
    });

    // TODO: group status shift
  });
});
