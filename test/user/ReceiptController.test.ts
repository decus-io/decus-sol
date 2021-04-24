import { expect } from "chai";
import { Signer } from "ethers";
import { setup } from "../helper/deploy";
import { ReceiptController } from "../../build/typechain";
import { ethers } from "hardhat";

describe("ReceiptController", () => {
  let owner: Signer;
  let user1: Signer;
  let receiptController: ReceiptController;

  const receiptId = 1;
  const groupId = 3333;
  const amount = 100000;
  const txId =
    "0xa1658ce2e63e9f91b6ff5e75c5a69870b04de471f5cd1cc3e53be158b46169bd";
  const height = 1940801;
  const btcAddress = "38aNsdfsdfsdfsdfsdfdsfsdf";
  const RECEIPT_ADMIN_ROLE = ethers.utils.id("RECEIPT_ADMIN_ROLE");

  beforeEach(async () => {
    let users;
    ({ owner, users, receiptController } = await setup());
    user1 = users[1];

    await receiptController
      .connect(owner)
      .grantRole(RECEIPT_ADMIN_ROLE, await owner.getAddress());
  });

  it("role", async () => {
    expect(
      await receiptController.hasRole(
        RECEIPT_ADMIN_ROLE,
        await owner.getAddress()
      )
    ).to.be.true;

    expect(
      await receiptController.hasRole(
        RECEIPT_ADMIN_ROLE,
        await user1.getAddress()
      )
    ).to.be.false;
  });

  it("request deposit", async () => {
    await receiptController
      .connect(owner)
      .depositRequest(await user1.getAddress(), groupId, amount);

    const receiptId = await receiptController.getWorkingReceiptId(groupId);

    expect(await receiptController.getReceiptStatus(receiptId)).to.equal(
      receiptId
    );
    expect(await receiptController.getUserAddress(receiptId)).to.equal(
      await user1.getAddress()
    );
  });

  it("request deposit fail", async () => {
    await expect(
      receiptController
        .connect(user1)
        .depositRequest(await user1.getAddress(), groupId, amount)
    ).to.revertedWith("require admin role");
  });

  describe("state", () => {
    beforeEach(async () => {
      await receiptController
        .connect(owner)
        .depositRequest(await user1.getAddress(), groupId, amount);
    });

    it("deposit received", async () => {
      await receiptController
        .connect(owner)
        .depositReceived(receiptId, txId, height);

      expect(await receiptController.getReceiptStatus(receiptId)).to.equal(2);

      await receiptController
        .connect(owner)
        .withdrawRequest(receiptId, btcAddress);

      expect(await receiptController.getReceiptStatus(receiptId)).to.equal(3);

      await receiptController.connect(owner).withdrawCompleted(receiptId);

      expect(await receiptController.getReceiptStatus(receiptId)).to.equal(0);
    });

    it("withdraw requested", async () => {
      await receiptController
        .connect(owner)
        .depositReceived(receiptId, txId, height);

      await receiptController
        .connect(owner)
        .withdrawRequest(receiptId, btcAddress);

      await expect(
        receiptController
          .connect(owner)
          .depositReceived(receiptId, txId, height)
      ).to.revertedWith("receipt is not in DepositRequested state");
    });

    // TODO: expect revert if status not in DepositRequested
  });
});
