import { ethers } from "hardhat";

export const currentTime = async (): Promise<number> => {
  return (await ethers.provider.getBlock("latest")).timestamp;
};

export const advanceTime = async (time: number): Promise<unknown> => {
  return ethers.provider.send("evm_increaseTime", [time]);
};

export const advanceBlock = async (): Promise<unknown> => {
  return ethers.provider.send("evm_mine", []);
};

export const advanceTimeAndBlock = async (time: number): Promise<void> => {
  return ethers.provider.send("evm_mine", [(await currentTime()) + time]);
};

