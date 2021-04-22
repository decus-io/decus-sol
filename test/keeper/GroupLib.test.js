const { BN, expectRevert } = require("@openzeppelin/test-helpers");
const { expect } = require("chai");

const GroupLibMock = artifacts.require("GroupLibMock");

/* eslint-disable no-unused-expressions */
contract("GroupLib", (accounts) => {
  const [, keeper1, keeper2, keeper3, notKeeper] = accounts;

  beforeEach(async () => {
    this.required = new BN(2);
    this.groupId = new BN(3333);
    this.groupId2 = new BN(3334);
    this.unknownGroupID = new BN(0);

    this.allowance = new BN(100000);
    this.allowance2 = new BN(200000);

    this.btcAddress1 = "3xsdf2sdfsdfsdf";
    this.btcAddress2 = "3xsdf2sdfsdfsdf2";
    this.btcAddress1Dup = "3xsdf2sdfsdfsdf";

    this.lib = await GroupLibMock.new();
  });

  it("initial", async () => {
    expect(await this.lib.exist(this.groupId)).to.be.false;
    expect(await this.lib.exist(this.unknownGroupID)).to.be.false;
  });

  describe("one group", () => {
    beforeEach(async () => {
      await this.lib.addGroup(
        this.groupId,
        this.required,
        this.allowance,
        this.btcAddress1,
        [keeper1, keeper2]
      );
    });

    it("check", async () => {
      expect(await this.lib.exist(this.groupId)).to.be.true;

      expect(
        await this.lib.getGroupAllowance(this.groupId)
      ).to.be.bignumber.equal(this.allowance);

      expect(await this.lib.isGroupEmpty(this.groupId)).to.be.true;

      expect(await this.lib.isGroupKeeper(this.groupId, keeper1)).to.be.true;
      expect(await this.lib.isGroupKeeper(this.groupId, keeper2)).to.be.true;
      expect(await this.lib.isGroupKeeper(this.groupId, keeper3)).to.be.false;

      const groupKeepers = await this.lib.getGroupKeepers(this.groupId);
      // console.log("getGroupKeepers", groupKeepers);
      expect(groupKeepers).to.deep.equal([keeper1, keeper2]);

      expect(await this.lib.nGroups()).to.be.bignumber.equal(new BN(1));

      expect(
        await this.lib.getKeeperGroups(keeper1, new BN(0))
      ).to.be.bignumber.equal(new BN(1));

      const info = await this.lib.getGroupInfo(this.groupId);
      expect(info.maxSatoshi).to.be.bignumber.equal(this.allowance);
      expect(info.currSatoshi).to.be.bignumber.equal(new BN(0));
      expect(info.required).to.be.bignumber.equal(this.required);
      expect(info.keepers).to.deep.equal([keeper1, keeper2]);
      expect(info.btcAddress).to.be.bignumber.equal(this.btcAddress1);
    });

    it("add satoshi", async () => {
      const addedAmount = new BN(1000);

      await this.lib.addGroupSatoshi(this.groupId, addedAmount);

      expect(
        await this.lib.getGroupAllowance(this.groupId)
      ).to.be.bignumber.equal(this.allowance.sub(addedAmount));
    });

    it("remove satoshi", async () => {
      const addedAmount = new BN(1000);

      await this.lib.addGroupSatoshi(this.groupId, addedAmount);

      expect(
        await this.lib.getGroupAllowance(this.groupId)
      ).to.be.bignumber.equal(this.allowance.sub(addedAmount));
    });

    it("fill satoshi", async () => {
      await this.lib.fillGroupSatoshi(this.groupId);

      expect(
        await this.lib.getGroupAllowance(this.groupId)
      ).to.be.bignumber.equal(new BN(0));
    });

    it("empty satoshi", async () => {
      await this.lib.fillGroupSatoshi(this.groupId);

      await this.lib.emptyGroupSatoshi(this.groupId);

      expect(
        await this.lib.getGroupAllowance(this.groupId)
      ).to.be.bignumber.equal(this.allowance);
    });

    it("fill satoshi fail", async () => {
      const addedAmount = new BN(1000);

      await this.lib.addGroupSatoshi(this.groupId, addedAmount);

      await expectRevert(
        this.lib.fillGroupSatoshi(this.groupId),
        "currSatoshi is not empty"
      );
    });

    it("empty satoshi fail", async () => {
      const addedAmount = new BN(1000);

      await this.lib.addGroupSatoshi(this.groupId, addedAmount);

      await expectRevert(
        this.lib.emptyGroupSatoshi(this.groupId),
        "currSatoshi is not full"
      );
    });
  });

  describe("group add", () => {
    beforeEach(async () => {
      await this.lib.addGroup(
        this.groupId,
        this.required,
        this.allowance,
        this.btcAddress1,
        [keeper1, keeper2]
      );
    });

    it("add another", async () => {
      await this.lib.addGroup(
        this.groupId2,
        this.required,
        this.allowance,
        this.btcAddress2,
        [keeper2, keeper3]
      );

      expect(await this.lib.exist(this.groupId2)).to.be.true;

      expect(
        await this.lib.getGroupAllowance(this.groupId2)
      ).to.be.bignumber.equal(this.allowance);

      expect(await this.lib.nGroups()).to.be.bignumber.equal(new BN(2));

      expect(
        await this.lib.getKeeperGroups(keeper2, new BN(0))
      ).to.be.bignumber.equal(new BN(3));

      expect(
        await this.lib.getKeeperGroups(keeper3, new BN(0))
      ).to.be.bignumber.equal(new BN(2));

      expect(
        await this.lib.getKeeperGroups(keeper2, new BN(1))
      ).to.be.bignumber.equal(new BN(1));

      const keeper1GroupIdArray = await this.lib.getKeeperGroupIds(keeper1);
      expect(Array.isArray(keeper1GroupIdArray)).to.equal(true);
      expect(keeper1GroupIdArray.length).to.equal(1);
      expect(keeper1GroupIdArray[0]).to.be.bignumber.equal(this.groupId);

      const keeper2GroupIdArray = await this.lib.getKeeperGroupIds(keeper2);
      expect(Array.isArray(keeper2GroupIdArray)).to.equal(true);
      expect(keeper2GroupIdArray.length).to.equal(2);
      expect(keeper2GroupIdArray[0]).to.be.bignumber.equal(this.groupId);
      expect(keeper2GroupIdArray[1]).to.be.bignumber.equal(this.groupId2);

      const notKeeperGroupIdArray = await this.lib.getKeeperGroupIds(notKeeper);
      expect(Array.isArray(notKeeperGroupIdArray)).to.equal(true);
      expect(notKeeperGroupIdArray.length).to.equal(0);
    });

    it("add dup id", async () => {
      await expectRevert(
        this.lib.addGroup(
          this.groupId,
          this.required,
          this.allowance,
          this.btcAddress2,
          [keeper2, keeper3]
        ),
        "group id already exist"
      );
    });

    it("set allowance", async () => {
      const groupIndex = new BN(0);
      await this.lib.setMaxSatoshi(groupIndex, this.allowance2);
      expect(
        await this.lib.getGroupAllowance(this.groupId)
      ).to.be.bignumber.equal(this.allowance2);
    });

    it("set allowance all", async () => {
      await this.lib.addGroup(
        this.groupId2,
        this.required,
        this.allowance,
        this.btcAddress2,
        [keeper2, keeper3]
      );

      await this.lib.setMaxSatoshiAll(this.allowance2);

      expect(
        await this.lib.getGroupAllowance(this.groupId)
      ).to.be.bignumber.equal(this.allowance2);
      expect(
        await this.lib.getGroupAllowance(this.groupId2)
      ).to.be.bignumber.equal(this.allowance2);
    });
  });

  describe("delete", () => {
    beforeEach(async () => {
      await this.lib.addGroup(
        this.groupId,
        this.required,
        this.allowance,
        this.btcAddress1,
        [keeper1, keeper2]
      );
    });

    it("delete", async () => {
      expect(await this.lib.exist(this.groupId)).to.be.true;

      await this.lib.deleteGroup(this.groupId);

      expect(await this.lib.exist(this.groupId)).to.be.false;
    });

    it("delete unknown", async () => {
      await expectRevert(
        this.lib.deleteGroup(this.unknownGroupID),
        "group id not exist"
      );
    });
  });

  // TODO: add -> delete -> add: the same group
});
