const { BN, expectRevert } = require("@openzeppelin/test-helpers");
const { expect } = require("chai");
const { providers } = require("ethers");
const { prepareSignature } = require("../helper.js");

const SignatureValidator = artifacts.require("SignatureValidator");

/* eslint-disable no-unused-expressions */
contract("SignatureValidator", (accounts) => {
  beforeEach(async () => {
    const web3Provider = new providers.Web3Provider(web3.currentProvider);
    this.recipient = web3Provider.getSigner(accounts[0]);
    this.keepers = [
      "0xadB55751AE2d025822A35CA4338853edC920Afaa",
      "0xd0F5AcAa0FDC4E9F9984D72757CF506Cf482D0fA",
    ];
    this.keeperPrivates = [
      "33b878c049feb985af2ff139843a74c87ad1a815dcaaac34c161c1b3473d52a1",
      "54cf6ecdcebdb5bb1ef61c1d87fcd01b75a2a73f8ce7aa64273b50019d1cde84",
    ];
    this.validator = await SignatureValidator.new();

    this.recipientBytes32 = web3.eth.abi.encodeParameter(
      "address",
      this.recipient._address
    );
    this.amount = new BN(10);
    this.amountBytes32 = web3.eth.abi.encodeParameter("uint256", this.amount);
    this.txId =
      "0xa1658ce2e63e9f91b6ff5e75c5a69870b04de471f5cd1cc3e53be158b46169bd";
    this.height = new BN("1940801");
    this.heightBytes32 = web3.eth.abi.encodeParameter("uint256", this.height);
  });

  it("reverted with invalid signature", async () => {
    const receiptId = new BN(2222);
    const [rList, sList, packedV] = prepareSignature(
      [this.keeperPrivates[0], this.keeperPrivates[0]],
      this.validator.address,
      this.recipient._address,
      receiptId,
      this.amount,
      this.txId,
      this.height
    );

    await expectRevert(
      this.validator.batchValidate(
        [
          this.recipient._address,
          receiptId,
          this.amount,
          this.txId,
          this.height,
        ],
        this.keepers,
        rList,
        sList,
        packedV
      ),
      "invalid signature"
    );
  });

  it("batch validate", async () => {
    const receiptId = new BN(3333);
    const [rList, sList, packedV] = prepareSignature(
      this.keeperPrivates,
      this.validator.address,
      this.recipient._address,
      receiptId,
      this.amount,
      this.txId,
      this.height
    );

    const res = await this.validator.batchValidate(
      [this.recipient._address, receiptId, this.amount, this.txId, this.height],
      this.keepers,
      rList,
      sList,
      packedV
    );
    expect(res).to.be.true;
  });

  // it("reverted with nonce outdated", async () => {
  //     const receiptId = new BN(4444);
  //     const rList = [];
  //     const sList = [];
  //     let vShift = 0;
  //     let packedV = BigNumber.from(0);

  //     for (let i = 0; i < this.keepers.length; i++) {
  //         const signature = await sign(
  //             this.keeperPrivates[i],
  //             this.validator.address,
  //             this.recipient._address,
  //             receiptId,
  //             this.amount,
  //             this.txId,
  //             this.height
  //         );
  //         const sig = ethers.utils.splitSignature(signature);

  //         rList.push(sig.r);
  //         sList.push(sig.s);
  //         packedV = packedV.or(BigNumber.from(sig.v).shl(vShift));

  //         vShift += 8;
  //     }

  //     await this.validator.batchValidate(
  //         {
  //             recipient: this.recipient,
  //             receiptId: receiptId,
  //             amount: this.amount,
  //             txId: this.txId,
  //             height: this.height,
  //         },
  //         this.keepers,
  //         rList,
  //         sList,
  //         packedV
  //     );

  //     await expectRevert(
  //         this.validator.batchValidate(
  //             {
  //                 recipient: this.recipient,
  //                 receiptId: receiptId,
  //                 amount: this.amount,
  //                 txId: this.txId,
  //                 height: this.height,
  //             },
  //             this.keepers,
  //             rList,
  //             sList,
  //             packedV
  //         ),
  //         "already verified"
  //     );
  // });
});
