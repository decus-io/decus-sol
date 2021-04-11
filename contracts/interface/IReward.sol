// SPDX-License-Identifier: MIT
pragma solidity >=0.6.0 <0.8.0;
pragma experimental ABIEncoderV2;

interface IReward {
    function mint(address account, uint256 amount) external;

    function futureDayTimeWrite() external returns (uint256, uint256);
}
