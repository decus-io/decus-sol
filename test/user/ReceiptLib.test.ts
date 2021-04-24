import { expect } from "chai";
import { ReceiptLibMock } from "../../build/typechain";
import { setup } from "../helper/deploy";

describe("SignatureValidator", () => {
  let user1: string;
  let user2: string;
  let receiptLib: ReceiptLibMock;

  const receiptId = 1111;
  const groupId = 3333;
  const amount = 100000;
  const txId =
    "0xa1658ce2e63e9f91b6ff5e75c5a69870b04de471f5cd1cc3e53be158b46169bd";
  const height = 1940801;
  const btcAddress = "38aNsdfsdfsdfsdfsdfdsfsdf";

  beforeEach(async () => {
    let users;
    ({ receiptLib, users } = await setup());
    user1 = await users[1].getAddress();
    user2 = await users[2].getAddress();
  });

  it("request deposit", async () => {
    await receiptLib.depositRequest(receiptId, user1, groupId, amount);

    expect(await receiptLib.getUserAddress(receiptId)).to.equal(user1);

    expect(await receiptLib.getGroupId(receiptId)).to.equal(groupId);

    expect(await receiptLib.getAmountInSatoshi(receiptId)).to.equal(amount);

    expect(await receiptLib.getReceiptStatus(receiptId)).to.equal(1);

    const info = await receiptLib.getReceiptInfo(receiptId);
    // console.log(info);
    expect(info.id).to.equal(receiptId);
    expect(info.user).to.equal(user1);
    expect(info.groupId).to.equal(groupId);
    expect(info.amountInSatoshi).to.equal(amount);
    expect(info.txId).to.equal(
      "0x0000000000000000000000000000000000000000000000000000000000000000"
    );
    expect(info.height).to.equal("0");
    expect(info.btcAddress).to.equal("");
    expect(info.createTimestamp).to.not.equal(0);
  });

  describe("state", () => {
    beforeEach(async () => {
      await receiptLib.depositRequest(receiptId, user1, groupId, amount);
    });

    it("deposit received", async () => {
      await receiptLib.depositReceived(receiptId, txId, height);

      expect(await receiptLib.getReceiptStatus(receiptId)).to.equal(2);

      await receiptLib.withdrawRequest(receiptId, btcAddress);

      expect(await receiptLib.getReceiptStatus(receiptId)).to.equal(3);

      await receiptLib.withdrawCompleted(receiptId);

      expect(await receiptLib.getReceiptStatus(receiptId)).to.equal(0);
    });

    it("withdraw requested", async () => {
      await receiptLib.depositReceived(receiptId, txId, height);

      await receiptLib.withdrawRequest(receiptId, btcAddress);

      await expect(
        receiptLib.depositReceived(receiptId, txId, height)
      ).to.revertedWith("receipt is not in DepositRequested state");
    });

    // TODO: expect revert if status not in DepositRequested
  });
});
