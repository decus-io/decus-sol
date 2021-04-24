import { expect } from "chai";
import { ethers } from "hardhat";
import { BigNumber, Signer } from "ethers";
import { setup } from "../helper/deploy";
import {
  WBTC,
  HBTC,
  KeeperRegistry,
  AssetMeta,
  GroupRegistry,
  DeCusSystem,
  EBTC,
  ReceiptController,
} from "../../build/typechain";

import { advanceTime, advanceTimeAndBlock } from "../helper/time";
import { signBatch } from "../helper/sign";

describe("DeCusSystem", () => {
  let owner: Signer;
  let user1: Signer;
  let user2: Signer;
  let user3: Signer;
  let smallKeeper: Signer;
  let wbtc: WBTC;
  let hbtc: HBTC;
  let ebtc: EBTC;
  let meta: AssetMeta;
  let keeperRegistry: KeeperRegistry;
  let groupRegistry: GroupRegistry;
  let receiptController: ReceiptController;
  let decusSystem: DeCusSystem;
  let chainId: number;

  const keepers = [
    ethers.Wallet.createRandom().connect(ethers.provider),
    ethers.Wallet.createRandom().connect(ethers.provider),
    ethers.Wallet.createRandom().connect(ethers.provider),
  ];

  const DEFAULT_ADMIN_ROLE =
    "0x0000000000000000000000000000000000000000000000000000000000000000";
  const MINTER_ROLE = ethers.utils.id("MINTER_ROLE");
  const KEEPER_ADMIN_ROLE = ethers.utils.id("KEEPER_ADMIN_ROLE");
  const GROUP_ADMIN_ROLE = ethers.utils.id("GROUP_ADMIN_ROLE");
  const RECEIPT_ADMIN_ROLE = ethers.utils.id("RECEIPT_ADMIN_ROLE");

  const keeperSatoshi = 2 * 10 ** 5; // 200000
  const keeperSatoshiSmall = 10 ** 4;
  const hbtcMultiplier = 10 ** 10;
  const wbtcHolding = keeperSatoshi;
  const hbtcHolding = keeperSatoshi * hbtcMultiplier;

  const keeperWbtcAmount = keeperSatoshi;
  // const keeperHbtcAmount = keeperWbtcAmount.mul(hbtcMultiplier);

  const required = 2;
  const group0Id = 1;
  const group0BtcAddress = "38aNsdfsdfsdfsdfsdfdsfsdf0";
  const group0BtcSatoshiAmount = keeperSatoshi;
  const group0Keepers = [keepers[1], keepers[2]];

  const group1Id = 2;
  const group1BtcAddress = "38aNsdfsdfsdfsdfsdfdsfsdf";
  const group1BtcSatoshiAmount = keeperSatoshi;
  const group1Keepers = [keepers[0], keepers[1]];

  const receipt1Id = 1;
  const withdrawBtcAddress = "38aNsdfsdfsdfsdfsdfdsfsdf3";

  const txId =
    "0xa1658ce2e63e9f91b6ff5e75c5a69870b04de471f5cd1cc3e53be158b46169bd";
  const height = 1940801;

  beforeEach(async () => {
    let users;
    ({
      owner,
      users,
      hbtc,
      wbtc,
      meta,
      ebtc,
      keeperRegistry,
      groupRegistry,
      receiptController,
      decusSystem,
    } = await setup());

    [user1, user2, user3, smallKeeper] = users;

    chainId = (await ethers.provider.getNetwork()).chainId;

    await keeperRegistry.grantRole(KEEPER_ADMIN_ROLE, await owner.getAddress());
    await keeperRegistry.setDependencies(meta.address);

    await ebtc.grantRole(MINTER_ROLE, decusSystem.address);

    await groupRegistry.grantRole(GROUP_ADMIN_ROLE, decusSystem.address);

    await receiptController.grantRole(RECEIPT_ADMIN_ROLE, decusSystem.address);
    decusSystem.setDependencies(
      ebtc.address,
      keeperRegistry.address,
      groupRegistry.address,
      receiptController.address
    );

    // prepare keeper
    for (let i = 0; i < keepers.length; i++) {
      const keeper = keepers[i];
      await hbtc.mint(keeper.address, hbtcHolding);
      await wbtc.mint(keeper.address, wbtcHolding);
      await owner.sendTransaction({
        to: keeper.address,
        value: BigNumber.from(10).pow(19),
      });

      await wbtc
        .connect(keeper)
        .approve(keeperRegistry.address, keeperWbtcAmount);

      await keeperRegistry
        .connect(keeper)
        .addKeeper(keeper.address, [wbtc.address], [keeperWbtcAmount]);
    }

    await decusSystem.addGroup(
      required,
      group0BtcSatoshiAmount,
      group0BtcAddress,
      group0Keepers.map((x) => {
        return x.address;
      })
    );

    await decusSystem.addGroup(
      required,
      group1BtcSatoshiAmount,
      group1BtcAddress,
      group1Keepers.map((x) => {
        return x.address;
      })
    );
  });

  it("role", async () => {
    expect(
      await decusSystem.hasRole(DEFAULT_ADMIN_ROLE, await owner.getAddress())
    ).to.be.true;

    expect(
      await keeperRegistry.hasRole(DEFAULT_ADMIN_ROLE, await owner.getAddress())
    ).to.be.true;

    expect(
      await keeperRegistry.hasRole(KEEPER_ADMIN_ROLE, await owner.getAddress())
    ).to.be.true;

    expect(
      await groupRegistry.hasRole(DEFAULT_ADMIN_ROLE, await owner.getAddress())
    ).to.be.true;

    expect(await groupRegistry.hasRole(GROUP_ADMIN_ROLE, decusSystem.address))
      .to.be.true;

    expect(await groupRegistry.nGroups()).to.equal(2);
  });

  it("group id", async () => {
    expect(await groupRegistry.getGroupId(group0BtcAddress)).to.equal(group0Id);
    expect(await groupRegistry.getGroupId(group1BtcAddress)).to.equal(group1Id);
  });

  it("keeper not enough collateral", async () => {
    const keeper = smallKeeper;
    const amount = keeperSatoshiSmall;
    await wbtc.mint(await keeper.getAddress(), amount);

    await wbtc.connect(keeper).approve(keeperRegistry.address, amount);

    await keeperRegistry
      .connect(keeper)
      .addKeeper(await keeper.getAddress(), [wbtc.address], [amount]);

    const groupKeepers = [await keeper.getAddress(), keepers[0].address];
    await expect(
      decusSystem
        .connect(owner)
        .addGroup(
          required,
          amount,
          "38aNsdfsdfsdfsdfsdfdsfsdf000",
          groupKeepers
        )
    ).to.revertedWith("keepre has not enough collaterl");
  });

  describe("overall state transition", () => {
    it("round", async () => {
      await decusSystem
        .connect(user1)
        .mintRequest(group1Id, group1BtcSatoshiAmount, {});
      expect(await receiptController.getWorkingReceiptId(group1Id)).to.equal(
        receipt1Id
      );
      expect(await receiptController.getReceiptStatus(receipt1Id)).to.equal(1);

      await expect(
        decusSystem
          .connect(user2)
          .mintRequest(group1Id, group1BtcSatoshiAmount, {})
      ).to.revertedWith("group is occupied with pending receipt");

      await advanceTimeAndBlock(24 * 3600);
      await expect(
        decusSystem.connect(user2).mintRequest(group1Id, group1BtcSatoshiAmount)
      ).to.revertedWith("revert group is occupied with pending receipt");
      expect(await receiptController.getReceiptStatus(receipt1Id)).to.equal(1);

      await expect(
        decusSystem.connect(user2).cancelMintRequest(receipt1Id)
      ).to.revertedWith("only applicant");

      await decusSystem.connect(user1).cancelMintRequest(receipt1Id);
      expect(await receiptController.getReceiptStatus(receipt1Id)).to.equal(0);

      await decusSystem
        .connect(user2)
        .mintRequest(group1Id, group1BtcSatoshiAmount);
      const receipt2Id = await receiptController.getWorkingReceiptId(group1Id);
      expect(receipt2Id).to.equal(2);
      expect(await receiptController.getReceiptStatus(receipt2Id)).to.equal(1);
      expect(await receiptController.getUserAddress(receipt2Id)).to.equal(
        await user2.getAddress()
      );

      const signers = [keepers[0], keepers[1]].sort((a, b) =>
        a.address > b.address ? 1 : -1
      );

      const recipient = user2;
      const [rList, sList, packedV] = await signBatch(
        signers,
        decusSystem.address,
        await recipient.getAddress(),
        receipt2Id.toString(),
        group1BtcSatoshiAmount,
        txId,
        height,
        chainId
      );

      await decusSystem.connect(recipient).verifyMint(
        {
          recipient: await recipient.getAddress(),
          receiptId: receipt2Id,
          amount: group1BtcSatoshiAmount,
          txId: txId,
          height: height,
        },
        signers.map((x) => {
          return x.address;
        }),
        rList,
        sList,
        packedV
      );
      expect(await receiptController.getReceiptStatus(receipt2Id)).to.equal(2);
      const ebtcBalance = group1BtcSatoshiAmount * 10 ** 10;
      expect(await ebtc.balanceOf(await recipient.getAddress())).to.equal(
        ebtcBalance
      );

      const amount = group1BtcSatoshiAmount * 10 ** 10;
      await ebtc.connect(user2).approve(decusSystem.address, amount);

      await decusSystem
        .connect(user2)
        .burnRequest(receipt2Id, withdrawBtcAddress);
      expect(await receiptController.getReceiptStatus(receipt2Id)).to.equal(3);

      await decusSystem.verifyBurn(receipt2Id);
      expect(await receiptController.getReceiptStatus(receipt2Id)).to.equal(0);
    });

    it("group mint start over", async () => {
      const amount = group1BtcSatoshiAmount;
      await decusSystem.connect(user1).mintRequest(group1Id, amount);

      const signers = [keepers[0], keepers[1]].sort((a, b) =>
        a.address > b.address ? 1 : -1
      );
      const recipient = await user1.getAddress();
      const [rList, sList, packedV] = await signBatch(
        signers,
        decusSystem.address,
        recipient,
        receipt1Id.toString(),
        amount,
        txId,
        height,
        chainId
      );

      await decusSystem.connect(user3).verifyMint(
        {
          recipient: recipient,
          receiptId: receipt1Id,
          amount: group1BtcSatoshiAmount,
          txId: txId,
          height: height,
        },
        signers.map((x) => {
          return x.address;
        }),
        rList,
        sList,
        packedV
      );

      const ebtcBalance = amount * 10 ** 10;
      expect(await ebtc.balanceOf(recipient)).to.equal(ebtcBalance);

      await ebtc.connect(user1).approve(await user2.getAddress(), ebtcBalance);
      await ebtc.connect(user1).transfer(await user2.getAddress(), ebtcBalance);

      await ebtc.connect(user2).approve(decusSystem.address, ebtcBalance);
      await decusSystem
        .connect(user2)
        .burnRequest(receipt1Id, withdrawBtcAddress);

      // await advanceTimeAndBlock(0);

      // finish previous
      await decusSystem.connect(user2).mintRequest(group1Id, amount);
      const receipt2Id = 2;
      expect(await receiptController.getWorkingReceiptId(group1Id)).to.equal(
        receipt2Id
      );
    });

    describe("mintVerify", () => {
      const receipt2Id = 2;

      beforeEach(async () => {
        await decusSystem
          .connect(user1)
          .mintRequest(group0Id, group0BtcSatoshiAmount);
        await decusSystem
          .connect(user2)
          .mintRequest(group1Id, group1BtcSatoshiAmount);
      });

      it("verify misorder", async () => {
        expect(await receiptController.getWorkingReceiptId(group0Id)).to.equal(
          receipt1Id
        );

        const signers = [keepers[1], keepers[2]].sort(
          (a, b) => (a.address > b.address ? -1 : 1) // wrong order
        );
        const recipient = await user1.getAddress();
        const [rList, sList, packedV] = await signBatch(
          signers,
          decusSystem.address,
          recipient,
          receipt1Id.toString(),
          group1BtcSatoshiAmount,
          txId,
          height,
          chainId
        );

        await expect(
          decusSystem.connect(user1).verifyMint(
            {
              recipient: recipient,
              receiptId: receipt1Id,
              amount: group1BtcSatoshiAmount,
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
        ).to.revertedWith("keepers not in ascending orders");
      });

      it("verify twice", async () => {
        const signers = [keepers[1], keepers[2]].sort((a, b) =>
          a.address > b.address ? 1 : -1
        );
        const recipient = await user1.getAddress();
        const [rList, sList, packedV] = await signBatch(
          signers,
          decusSystem.address,
          recipient,
          receipt1Id.toString(),
          group1BtcSatoshiAmount,
          txId,
          height,
          chainId
        );

        await decusSystem.connect(user1).verifyMint(
          {
            recipient: recipient,
            receiptId: receipt1Id,
            amount: group1BtcSatoshiAmount,
            txId: txId,
            height: height,
          },
          signers.map((x) => {
            return x.address;
          }),
          rList,
          sList,
          packedV
        );

        await expect(
          decusSystem.connect(user1).verifyMint(
            {
              recipient: recipient,
              receiptId: receipt1Id,
              amount: group1BtcSatoshiAmount,
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
        ).to.revertedWith("receipt already verified");
      });

      it("verify two requests", async () => {
        let signers = [keepers[1], keepers[2]].sort((a, b) =>
          a.address > b.address ? 1 : -1
        );
        let recipient = await user1.getAddress();
        let [rList, sList, packedV] = await signBatch(
          signers,
          decusSystem.address,
          recipient,
          receipt1Id.toString(),
          group1BtcSatoshiAmount,
          txId,
          height,
          chainId
        );

        await decusSystem.connect(user1).verifyMint(
          {
            recipient: recipient,
            receiptId: receipt1Id,
            amount: group1BtcSatoshiAmount,
            txId: txId,
            height: height,
          },
          signers.map((x) => {
            return x.address;
          }),
          rList,
          sList,
          packedV
        );

        signers = [keepers[0], keepers[1]].sort((a, b) =>
          a.address > b.address ? 1 : -1
        );
        recipient = await user2.getAddress();
        [rList, sList, packedV] = await signBatch(
          signers,
          decusSystem.address,
          recipient,
          receipt2Id.toString(),
          group1BtcSatoshiAmount,
          txId,
          height,
          chainId
        );

        await expect(
          decusSystem.connect(user2).verifyMint(
            {
              recipient: recipient,
              receiptId: receipt2Id,
              amount: group1BtcSatoshiAmount,
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
        ).to.revertedWith("keeper is in cooldown");

        let currentTimestamp = (await ethers.provider.getBlock("latest"))
          .timestamp;
        expect(
          (await decusSystem.cooldownUntil(keepers[0].address)).toNumber()
        ).to.be.equal(0);
        expect(
          (await decusSystem.cooldownUntil(keepers[1].address)).toNumber()
        ).to.be.approximately(currentTimestamp + 10 * 60, 1);
        expect(
          (await decusSystem.cooldownUntil(keepers[2].address)).toNumber()
        ).to.be.approximately(currentTimestamp + 10 * 60, 1);
        const prevTimestamp = (
          await decusSystem.cooldownUntil(keepers[2].address)
        ).toNumber();

        await advanceTimeAndBlock(10 * 60 + 1);
        decusSystem.connect(user2).verifyMint(
          {
            recipient: recipient,
            receiptId: receipt2Id,
            amount: group1BtcSatoshiAmount,
            txId: txId,
            height: height,
          },
          signers.map((x) => {
            return x.address;
          }),
          rList,
          sList,
          packedV
        );

        currentTimestamp = (await ethers.provider.getBlock("latest")).timestamp;
        expect(
          (await decusSystem.cooldownUntil(keepers[0].address)).toNumber()
        ).to.be.approximately(currentTimestamp + 10 * 60, 1);
        expect(
          (await decusSystem.cooldownUntil(keepers[1].address)).toNumber()
        ).to.be.approximately(currentTimestamp + 10 * 60, 1);
        expect(
          (await decusSystem.cooldownUntil(keepers[2].address)).toNumber()
        ).to.be.equal(prevTimestamp);
      });
    });

    describe("mint", () => {
      beforeEach(async () => {
        await decusSystem
          .connect(user1)
          .mintRequest(group0Id, group0BtcSatoshiAmount);
      });

      it("check", async () => {
        expect(await receiptController.getWorkingReceiptId(group0Id)).to.equal(
          receipt1Id
        );

        expect(await receiptController.getReceiptStatus(receipt1Id)).to.equal(
          1
        );

        expect(await receiptController.isGroupAvailable(group0Id)).to.be.false;
      });

      it("stale", async () => {
        expect(await receiptController.isStale(receipt1Id)).to.be.false;

        await advanceTimeAndBlock(24 * 3600);

        expect(await receiptController.isStale(receipt1Id)).to.be.true;
      });

      it("force mint", async () => {
        await advanceTimeAndBlock(24 * 3600);

        await expect(
          decusSystem
            .connect(user3)
            .mintRequest(group0Id, group0BtcSatoshiAmount)
        ).to.revertedWith("group is occupied with pending receipt");
        expect(await receiptController.getWorkingReceiptId(group0Id)).to.equal(
          receipt1Id
        );
        expect(await receiptController.getReceiptStatus(receipt1Id)).to.equal(
          1
        );

        expect(await receiptController.isGroupAvailable(group0Id)).to.be.false;
        expect(await receiptController.isGroupAvailable(group1Id)).to.be.true;

        await expect(
          decusSystem
            .connect(user3)
            .forceMintRequest(group0Id, group0BtcSatoshiAmount, {})
        ).to.revertedWith("There are available groups in registry to request");

        await decusSystem
          .connect(user2)
          .mintRequest(group1Id, group1BtcSatoshiAmount, {});

        expect(await receiptController.isGroupAvailable(group0Id)).to.be.false;
        expect(await receiptController.isGroupAvailable(group1Id)).to.be.false;

        const receiptId = 3;
        const rsp = await decusSystem
          .connect(user3)
          .forceMintRequest(group0Id, group0BtcSatoshiAmount);
        expect(rsp)
          .to.emit(decusSystem, "MintRequested")
          .withArgs(
            group0Id,
            receiptId,
            await user3.getAddress(),
            group0BtcSatoshiAmount
          );

        expect(await receiptController.getWorkingReceiptId(group0Id)).to.equal(
          receiptId
        );
      });

      describe("ban", () => {
        it("should revert if not admin", async () => {
          await expect(
            decusSystem.connect(user1).ban(keepers[0].address, 60)
          ).to.revertedWith("require admin role");
        });
        it("should ban keeper", async () => {
          expect(await decusSystem.cooldownUntil(keepers[0].address)).to.equal(
            0
          );
          await decusSystem.ban(keepers[0].address, 60);
          const currentTimestamp = (await ethers.provider.getBlock("latest"))
            .timestamp;

          expect(await decusSystem.cooldownUntil(keepers[0].address)).to.equal(
            currentTimestamp + 60
          );
        });
      });
    });
  });
});
