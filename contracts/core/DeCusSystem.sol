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
import {ReceiptController} from "../user/ReceiptController.sol";

contract DeCusSystem is AccessControl, Pausable {
    using SafeMath for uint256;

    event MintRequest(uint256 indexed groupId, address indexed from, uint256 amountInSatoshi);
    event MintReceived(uint256 indexed groupId);

    uint256 public constant MINT_REQUEST_GRACE_PERIOD = 8 hours;

    EBTC ebtc;
    GroupRegistry groups;
    ReceiptController receiptController;

    constructor(address _admin) public {
        _setupRole(DEFAULT_ADMIN_ROLE, _admin);
    }

    function setDependencies(
        EBTC _ebtc,
        GroupRegistry _groups,
        ReceiptController _receipts
    ) external {
        require(hasRole(DEFAULT_ADMIN_ROLE, _msgSender()), "require admin role");

        ebtc = _ebtc;
        groups = _groups;
        receiptController = _receipts;
    }

    function addGroup(
        uint256 _id,
        uint256[] calldata _keepers,
        string memory _btcAddress,
        uint256 _maxSatoshi
    ) public {
        // TODO: set group admin role
        require(hasRole(DEFAULT_ADMIN_ROLE, _msgSender()), "require group admin role");
        groups.addGroup(_id, _keepers, _btcAddress, _maxSatoshi);
    }

    function mintRequest(uint256 _groupId, uint256 _amountInSatoshi) public {
        // TODO: system find btc group to return
        // 1. check group has enough space
        // 2. generate receipt, including user address
        require(
            groups.getGroupAllowance(_groupId) == _amountInSatoshi,
            "receipt need to fill all allowance"
        );
        require(groups.isGroupEmpty(_groupId), "current version only support empty group");
        require(
            groups.getGroupLastTimestamp(_groupId).add(MINT_REQUEST_GRACE_PERIOD) < block.timestamp,
            "previous request has not completed yet"
        );

        groups.requestReceived(_groupId, block.timestamp);
        receiptController.depositRequest(_msgSender(), _groupId, _amountInSatoshi);

        emit MintRequest(_groupId, _msgSender(), _amountInSatoshi);
    }

    function verifyMint(uint256 _groupId, string memory _proofPlaceholder) public {
        _verifyDeposit(_groupId, _proofPlaceholder);

        _approveDeposit(_groupId);

        _mintToUser(_groupId);
    }

    function revokeMintRequest(uint256 _groupId, uint256 _keeperID) public {
        // Originated from keepers, to revoke an unfinished request
        require(groups.isGroupKeeper(_groupId, _keeperID), "only keepers");
        _revoke(_groupId);
    }

    function cancelMintRequest(uint256 _groupId) public payable {
        // Originated from users, before verifyMint to cancel the btc deposit
        require(receiptController.getUserAddress(_groupId) == _msgSender(), "only applicant");
        _revoke(_groupId);
    }

    function _verifyDeposit(uint256 _groupId, string memory _proofPlaceholder) internal {
        // TODO: BTC need to match full amount in group
    }

    function _approveDeposit(uint256 _groupId) internal {
        receiptController.depositReceived(_groupId);
        groups.depositReceived(_groupId, receiptController.getAmountInSatoshi(_groupId));
    }

    function _mintToUser(uint256 _groupId) internal {
        address user = receiptController.getUserAddress(_groupId);
        uint256 amountInSatoshi = receiptController.getAmountInSatoshi(_groupId);
        // TODO: add fee deduction
        ebtc.mint(user, amountInSatoshi.mul(BTCUtils.getSatoshiMultiplierForEBTC()));
    }

    function _revoke(uint256 _groupId) internal {
        groups.emptyGroupLastTimestamp(_groupId);
        receiptController.revokeRequest(_groupId);
    }

    function burnRequest(uint256 _groupId) public {
        // TODO: add fee deduction
        uint256 amountInSatoshi = receiptController.getAmountInSatoshi(_groupId);
        uint256 amount = amountInSatoshi.mul(BTCUtils.getSatoshiMultiplierForEBTC());

        ebtc.burnFrom(_msgSender(), amount);

        groups.withdrawRequested(_groupId, receiptController.getAmountInSatoshi(_groupId));

        receiptController.withdrawRequest(_groupId);
    }

    function verifyBurn(uint256 _groupId, string memory _proofPlaceholder) public {
        _verifyBurn(_groupId, _proofPlaceholder);

        receiptController.withdrawCompleted(_groupId);
    }

    function _verifyBurn(uint256 _groupId, string memory _proofPlaceholder) internal {
        // TODO: verify
    }

    function prosecute(uint256 _groupId) public {
        // TODO: bad behavior report
    }
}
