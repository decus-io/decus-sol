import { ethers } from "hardhat";
import { Wallet, Signature, BigNumber, Signer } from "ethers";

export const signMintRequest = async (
  wallet: Wallet,
  verifyingContract: string,
  recipient: string,
  receiptId: string,
  amount: number,
  txId: string,
  height: number,
  chainId: number
): Promise<Signature> => {
  const domain = {
    name: "DeCus",
    version: "1.0",
    chainId: chainId,
    verifyingContract: verifyingContract,
  };
  const types = {
    MintRequest: [
      { name: "recipient", type: "address" },
      { name: "receiptId", type: "uint256" },
      { name: "amount", type: "uint256" },
      { name: "txId", type: "bytes32" },
      { name: "height", type: "uint256" },
    ],
  };

  const data = {
    recipient: recipient,
    receiptId: receiptId,
    amount: amount.toString(),
    txId: txId,
    height: height.toString(),
  };

  const signature = await wallet._signTypedData(domain, types, data);
  return ethers.utils.splitSignature(signature);
};

export const signBatch = async (
  keepers: Wallet[],
  validatorAddress: string,
  recipient: string,
  receiptId: string,
  amount: number,
  txId: string,
  height: number,
  chainId: number
): Promise<[string[], string[], BigNumber]> => {
  const rList: string[] = [];
  const sList: string[] = [];
  let vShift = 0;
  let packedV = BigNumber.from(0);
  for (let i = 0; i < keepers.length; i++) {
    const signature = await signMintRequest(
      keepers[i],
      validatorAddress,
      recipient,
      receiptId,
      amount,
      txId,
      height,
      chainId
    );

    const sig = ethers.utils.splitSignature(signature);

    rList.push(sig.r);
    sList.push(sig.s);
    packedV = packedV.or(BigNumber.from(sig.v).shl(vShift));

    vShift += 8;
  }
  return [rList, sList, packedV];
};
