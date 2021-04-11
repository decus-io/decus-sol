// SPDX-License-Identifier: MIT
pragma solidity ^0.6.12;

import "@openzeppelin/contracts/math/Math.sol";

import "@openzeppelin/contracts/math/SafeMath.sol";

import "../interface/IReward.sol";

import "../utils/SafeDecimalMath.sol";

import "./CustodyToken.sol";

contract CustodyGauge is CustodyToken {
    using Math for uint256;
    using SafeMath for uint256;
    using SafeDecimalMath for uint256;

    bytes32 public constant SYSTEM_ROLE = keccak256("SYSTEM_ROLE");

    IReward public rewardToken;

    address public decusSystem;

    uint256 public _overallIntegral;
    uint256 public _checkpointTimestamp;

    uint256 public _futureEpoch;
    uint256 public _rate;

    mapping(address => uint256) public _integrals;
    mapping(address => uint256) public _claimableRewards;

    constructor(
        string memory name_,
        string memory symbol_,
        address rewardToken_,
        address decusSystem_
    ) public CustodyToken(name_, symbol_) {
        rewardToken = IReward(rewardToken_);
        decusSystem = decusSystem_;
        _checkpointTimestamp = block.timestamp;
        (_futureEpoch, _rate) = IReward(rewardToken_).futureDayTimeWrite();
    }

    function claimableRewards(address account) external returns (uint256) {
        userCheckpoint(account);
        return _claimableRewards[account];
    }

    function mint(address account, uint256 amount) external onlyDecus {
        userCheckpoint(account);
        _mint(account, amount);
    }

    function burnFrom(address account, uint256 amount) external onlyDecus {
        userCheckpoint(account);
        _burn(account, amount);
    }

    function checkpoint() public {
        _checkpoint();
    }

    function claimReward() public {
        userCheckpoint(msg.sender);

        IReward(rewardToken).mint(msg.sender, _claimableRewards[msg.sender]);
        _claimableRewards[msg.sender] = 0;
    }

    function userCheckpoint(address account) public {
        _checkpoint();
        _rewardCheckpoint(account);
    }

    function _checkpoint() private {
        uint256 totalGons = _totalGons;
        uint256 rate = _rate;
        uint256 timestamp = _checkpointTimestamp;
        uint256 futureEpoch = _futureEpoch;

        while (timestamp < block.timestamp) {
            uint256 endTimestamp = futureEpoch.min(block.timestamp);

            if (totalGons != 0) {
                // calculate overall integral till now
                _overallIntegral = _overallIntegral.add(
                    rate.mul(endTimestamp.sub(timestamp)).divideDecimalRoundPrecise(totalGons)
                );
            }

            if (endTimestamp == futureEpoch) {
                (futureEpoch, rate) = rewardToken.futureDayTimeWrite();
            }

            timestamp = endTimestamp;
        }

        if (futureEpoch != _futureEpoch) {
            _rate = rate;
            _futureEpoch = futureEpoch;
        }

        // update global state
        _checkpointTimestamp = block.timestamp;
    }

    function _rewardCheckpoint(address account) private {
        // claim rewards till now
        uint256 balance = _gonBalances[account];
        uint256 claimableReward =
            balance.multiplyDecimalPrecise(_overallIntegral.sub(_integrals[account]));
        _claimableRewards[account] = _claimableRewards[account].add(claimableReward);

        // update per-user state
        _integrals[account] = _overallIntegral;
    }

    modifier onlyDecus() {
        require(msg.sender == decusSystem, "Only DeCus System");
        _;
    }
}
