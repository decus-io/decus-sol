import { expect } from "chai";
import { ethers } from "hardhat";
import { Signer } from "ethers";
import { signBatch } from "../helper/sign";
import { setup } from "../helper/deploy";
import { SignatureValidator } from "../../build/typechain";

describe("SignatureValidator", () => {
  let recipient: Signer;
  let validator: SignatureValidator;
  let chainId: number;

  const keepers = [
    ethers.Wallet.createRandom(),
    ethers.Wallet.createRandom(),
    ethers.Wallet.createRandom(),
  ];
  const amount = 10;
  const txId =
    "0xa1658ce2e63e9f91b6ff5e75c5a69870b04de471f5cd1cc3e53be158b46169bd";
  const height = 1930801;

  beforeEach(async () => {
    chainId = (await ethers.provider.getNetwork()).chainId;
    let users;
    ({ users, validator } = await setup());
    recipient = users[1];
  });

  it("reverted with invalid signature", async () => {
    const receiptId = 2222;
    const signers = [keepers[0], keepers[1]];
    const wrong_signers = [keepers[0], keepers[0]];
    const [rList, sList, packedV] = await signBatch(
      wrong_signers,
      validator.address,
      await recipient.getAddress(),
      receiptId.toString(),
      amount,
      txId,
      height,
      chainId
    );

    await expect(
      validator.batchValidate(
        {
          recipient: await recipient.getAddress(),
          receiptId: receiptId,
          amount: amount,
          txId: txId,
          height: height,
        },
        signers.map((x) => {
          return x.address;
        }),
        rList,
        sList,
        packedV
      )
    ).to.revertedWith("invalid signature");
  });

  it("batch validate", async () => {
    const receiptId = 3333;
    const signers = [keepers[0], keepers[1]];
    const [rList, sList, packedV] = await signBatch(
      signers,
      validator.address,
      await recipient.getAddress(),
      receiptId.toString(),
      amount,
      txId,
      height,
      chainId
    );

    expect(
      await validator.batchValidate(
        {
          recipient: await recipient.getAddress(),
          receiptId: receiptId,
          amount: amount,
          txId: txId,
          height: height,
        },
        signers.map((x) => {
          return x.address;
        }),
        rList,
        sList,
        packedV
      )
    ).to.be.true;
  });
});
