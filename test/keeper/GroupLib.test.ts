import { expect } from "chai";
// import { BigNumber } from "ethers";
import { setup } from "../helper/deploy";
import { GroupLibMock } from "../../build/typechain";

describe("CollateralLib", () => {
  const required = 2;
  const groupId = 3333;
  const groupId2 = 3334;
  const unknownGroupID = 0;

  const allowance = 100000;
  const allowance2 = 200000;

  const btcAddress1 = "3xsdf2sdfsdfsdf";
  const btcAddress2 = "3xsdf2sdfsdfsdf2";

  let groupLib: GroupLibMock;
  let keeper1: string;
  let keeper2: string;
  let keeper3: string;
  let notKeeper: string;

  beforeEach(async () => {
    let users;
    ({ groupLib, users } = await setup());
    keeper1 = await users[1].getAddress();
    keeper2 = await users[2].getAddress();
    keeper3 = await users[3].getAddress();
    notKeeper = await users[4].getAddress();
  });

  it("initial", async () => {
    expect(await groupLib.exist(groupId)).to.be.false;
    expect(await groupLib.exist(unknownGroupID)).to.be.false;
  });

  describe("one group", () => {
    beforeEach(async () => {
      await groupLib.addGroup(groupId, required, allowance, btcAddress1, [
        keeper1,
        keeper2,
      ]);
    });

    it("check", async () => {
      expect(await groupLib.exist(groupId)).to.be.true;

      expect(await groupLib.getGroupAllowance(groupId)).to.equal(allowance);

      expect(await groupLib.isGroupEmpty(groupId)).to.be.true;

      expect(await groupLib.isGroupKeeper(groupId, keeper1)).to.be.true;
      expect(await groupLib.isGroupKeeper(groupId, keeper2)).to.be.true;
      expect(await groupLib.isGroupKeeper(groupId, keeper3)).to.be.false;

      const groupKeepers = await groupLib.getGroupKeepers(groupId);
      // console.log("getGroupKeepers", groupKeepers);
      expect(groupKeepers).to.deep.equal([keeper1, keeper2]);

      expect(await groupLib.nGroups()).to.equal(1);

      expect(await groupLib.getKeeperGroups(keeper1, 0)).to.equal(1);

      const info = await groupLib.getGroupInfo(groupId);
      expect(info.maxSatoshi).to.equal(allowance);
      expect(info.currSatoshi).to.equal(0);
      expect(info.required).to.equal(required);
      expect(info.keepers).to.deep.equal([keeper1, keeper2]);
      expect(info.btcAddress).to.equal(btcAddress1);
    });

    it("add satoshi", async () => {
      const addedAmount = 1000;

      await groupLib.addGroupSatoshi(groupId, addedAmount);

      expect(await groupLib.getGroupAllowance(groupId)).to.equal(
        allowance - addedAmount
      );
    });

    it("remove satoshi", async () => {
      const addedAmount = 1000;

      await groupLib.addGroupSatoshi(groupId, addedAmount);

      expect(await groupLib.getGroupAllowance(groupId)).to.equal(
        allowance - addedAmount
      );
    });

    it("fill satoshi", async () => {
      await groupLib.fillGroupSatoshi(groupId);

      expect(await groupLib.getGroupAllowance(groupId)).to.equal(0);
    });

    it("empty satoshi", async () => {
      await groupLib.fillGroupSatoshi(groupId);

      await groupLib.emptyGroupSatoshi(groupId);

      expect(await groupLib.getGroupAllowance(groupId)).to.equal(allowance);
    });

    it("fill satoshi fail", async () => {
      const addedAmount = 1000;

      await groupLib.addGroupSatoshi(groupId, addedAmount);

      await expect(groupLib.fillGroupSatoshi(groupId)).to.revertedWith(
        "currSatoshi is not empty"
      );
    });

    it("empty satoshi fail", async () => {
      const addedAmount = 1000;

      await groupLib.addGroupSatoshi(groupId, addedAmount);

      await expect(groupLib.emptyGroupSatoshi(groupId)).to.revertedWith(
        "currSatoshi is not full"
      );
    });
  });

  describe("group add", () => {
    beforeEach(async () => {
      await groupLib.addGroup(groupId, required, allowance, btcAddress1, [
        keeper1,
        keeper2,
      ]);
    });

    it("add another", async () => {
      await groupLib.addGroup(groupId2, required, allowance, btcAddress2, [
        keeper2,
        keeper3,
      ]);

      expect(await groupLib.exist(groupId2)).to.be.true;

      expect(await groupLib.getGroupAllowance(groupId2)).to.equal(allowance);

      expect(await groupLib.nGroups()).to.equal(2);

      expect(await groupLib.getKeeperGroups(keeper2, 0)).to.equal(3);

      expect(await groupLib.getKeeperGroups(keeper3, 0)).to.equal(2);

      expect(await groupLib.getKeeperGroups(keeper2, 1)).to.equal(1);

      const keeper1GroupIdArray = await groupLib.getKeeperGroupIds(keeper1);
      expect(Array.isArray(keeper1GroupIdArray)).to.equal(true);
      expect(keeper1GroupIdArray.length).to.equal(1);
      expect(keeper1GroupIdArray[0]).to.equal(groupId);

      const keeper2GroupIdArray = await groupLib.getKeeperGroupIds(keeper2);
      expect(Array.isArray(keeper2GroupIdArray)).to.equal(true);
      expect(keeper2GroupIdArray.length).to.equal(2);
      expect(keeper2GroupIdArray[0]).to.equal(groupId);
      expect(keeper2GroupIdArray[1]).to.equal(groupId2);

      const notKeeperGroupIdArray = await groupLib.getKeeperGroupIds(notKeeper);
      expect(Array.isArray(notKeeperGroupIdArray)).to.equal(true);
      expect(notKeeperGroupIdArray.length).to.equal(0);
    });

    it("add dup id", async () => {
      await expect(
        groupLib.addGroup(groupId, required, allowance, btcAddress2, [
          keeper2,
          keeper3,
        ])
      ).to.revertedWith("group id already exist");
    });

    it("set allowance", async () => {
      const groupIndex = 0;
      await groupLib.setMaxSatoshi(groupIndex, allowance2);
      expect(await groupLib.getGroupAllowance(groupId)).to.equal(allowance2);
    });

    it("set allowance all", async () => {
      await groupLib.addGroup(groupId2, required, allowance, btcAddress2, [
        keeper2,
        keeper3,
      ]);

      await groupLib.setMaxSatoshiAll(allowance2);

      expect(await groupLib.getGroupAllowance(groupId)).to.equal(allowance2);
      expect(await groupLib.getGroupAllowance(groupId2)).to.equal(allowance2);
    });
  });

  describe("delete", () => {
    beforeEach(async () => {
      await groupLib.addGroup(groupId, required, allowance, btcAddress1, [
        keeper1,
        keeper2,
      ]);
    });

    it("delete", async () => {
      expect(await groupLib.exist(groupId)).to.be.true;

      await groupLib.deleteGroup(groupId);

      expect(await groupLib.exist(groupId)).to.be.false;
    });

    it("delete unknown", async () => {
      await expect(groupLib.deleteGroup(unknownGroupID)).to.revertedWith(
        "group id not exist"
      );
    });
  });

  // TODO: add -> delete -> add: the same group
});
