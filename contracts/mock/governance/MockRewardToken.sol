// SPDX-License-Identifier: MIT
pragma solidity >=0.6.0 <0.8.0;

import "./MockToken.sol";

contract MockRewardToken is MockToken {
    uint256 public _nextEpoch;
    uint256 public _rate;

    constructor() public MockToken("DeCus", "DEC", 18) {}

    function set(uint256 nextEpoch, uint256 rate) external {
        _nextEpoch = nextEpoch;
        _rate = rate;
    }

    function futureDayTimeWrite() external view returns (uint256 nextEpoch, uint256 rate) {
        nextEpoch = _nextEpoch;
        rate = _rate;
    }
}
