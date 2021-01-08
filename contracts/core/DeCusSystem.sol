// SPDX-License-Identifier: MIT
pragma solidity ^0.6.12;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";

import {EBTC} from "../tokens/EBTC.sol";
import {DeCus} from "../tokens/DeCus.sol";
import {BTCUtils} from "../utils/BTCUtils.sol";

// TODO: refactor to import interface only
import {GroupRegistry} from "../keeper/GroupRegistry.sol";
import {ReceiptFactory} from "../user/ReceiptFactory.sol";


contract DeCusSystem is AccessControl, Pausable {
    using SafeMath for uint256;

    EBTC ebtc;
    GroupRegistry groups;
    ReceiptFactory receiptFactory;

    constructor(address admin) public {
        _setupRole(DEFAULT_ADMIN_ROLE, admin);
    }

    function setDependencies(EBTC _ebtc, GroupRegistry _groups) external {
        ebtc = _ebtc;
        groups = _groups;
    }

    function mintRequest(uint256 _groupId, uint256 _amountInSatoshi) public {
        // TODO: system find btc group to return
        // 1. check group has enough space
        // 2. generate receipt, including user address
        require(groups.getGroupAllowance(_groupId) == _amountInSatoshi, "receipt need to fill all allowance");
        require(groups.isGroupEmpty(_groupId), "current version only support empty group");

        receiptFactory.addReceipt(_msgSender(), _groupId, _amountInSatoshi);
    }

    function verifyMint(string memory _proofPlaceholder, uint256 _groupId) public {
        _verifyDeposit(_proofPlaceholder, _groupId);

        _approveDeposit(_groupId);

        _mintToUser(_groupId);
    }

    function revokeMintRequest(uint256 _groupId, string memory _proofKeepers) public {
        // TODO: Originated from keepers, to revoke an unfinished request
    }

    function cancelMintRequest(uint256 _groupId) payable public {
        // TODO: Originated from users, before verifyMint to cancel the btc deposit
    }

    function _verifyDeposit(string memory _proofPlaceholder, uint256 _groupId) internal {
        // TODO: BTC need to match full amount in group
    }

    function _approveDeposit(uint256 _groupId) internal {
        receiptFactory.depositReceived(_groupId);
        groups.depositReceived(_groupId, receiptFactory.getAmountInSatoshi(_groupId));
    }

    function _mintToUser(uint256 _groupId) internal {
        address user = receiptFactory.getUserAddress(_groupId);
        uint256 amountInSatoshi = receiptFactory.getAmountInSatoshi(_groupId);
        // TODO: deduct fee
        ebtc.mint(user, amountInSatoshi.mul(BTCUtils.getSatoshiMultiplierForEBTC()));
    }

    function burnRequest(uint256 _groupId) public {
        uint256 amountInSatoshi = receiptFactory.getAmountInSatoshi(_groupId);
        uint256 amount = amountInSatoshi.mul(BTCUtils.getSatoshiMultiplierForEBTC());

        ebtc.burnFrom(_msgSender(), amount);

        groups.withdrawRequested(_groupId, receiptFactory.getAmountInSatoshi(_groupId));
        receiptFactory.withdrawRequested(_groupId);
    }

    function verifyWithdraw(string memory _proofPlaceholder, uint256 _groupId) public {
        _verifyWithdraw(_proofPlaceholder, _groupId);

        receiptFactory.withdrawCompleted(_groupId);
    }

    function _verifyWithdraw(string memory _proofPlaceholder, uint256 _groupId) internal {
        // TODO: verify
    }

    function prosecute(uint256 _groupId) public {
        // TODO: bad behavior report
    }
}
