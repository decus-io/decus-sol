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

    event MintRequest(
        uint256 indexed groupId,
        uint256 indexed receiptId,
        address indexed from,
        uint256 amountInSatoshi
    );
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
        uint256[] calldata _keepers,
        string memory _btcAddress,
        uint256 _maxSatoshi
    ) public {
        // TODO: set group admin role
        require(hasRole(DEFAULT_ADMIN_ROLE, _msgSender()), "require group admin role");
        groups.addGroup(_keepers, _btcAddress, _maxSatoshi);
    }

    function mintRequest(uint256 _groupId, uint256 _amountInSatoshi) public payable {
        // * check group has enough allowance
        // * user needs to deposit eth, eth will be returned once the mint request is done
        // * generate receipt to fill all allowance
        require(
            groups.getGroupAllowance(_groupId) == _amountInSatoshi,
            "receipt need to fill all allowance"
        );
        require(
            groups.getGroupLastTimestamp(_groupId).add(MINT_REQUEST_GRACE_PERIOD) < block.timestamp,
            "previous request has not completed yet"
        );

        uint256 _receiptId =
            receiptController.depositRequest(_msgSender(), _groupId, _amountInSatoshi);

        groups.requestReceived(_groupId, block.timestamp);

        emit MintRequest(_groupId, _receiptId, _msgSender(), _amountInSatoshi);
    }

    function verifyMint(uint256 _receiptId, string memory _proofPlaceholder) public {
        _verifyDeposit(_receiptId, _proofPlaceholder);

        _approveDeposit(_receiptId);

        _mintToUser(_receiptId);
    }

    function revokeMintRequest(uint256 _receiptId, uint256 _keeperID) public {
        // Originated from keepers, to revoke an unfinished request
        uint256 _groupId = receiptController.getGroupId(_receiptId);

        require(groups.isGroupKeeper(_groupId, _keeperID), "only keeper within the group");

        _revoke(_groupId, _receiptId);

        // TODO: emit event
        // User get ETH refunded
    }

    function cancelMintRequest(uint256 _receiptId) public {
        // Originated from users, before verifyMint to cancel the btc deposit
        require(receiptController.getUserAddress(_receiptId) == _msgSender(), "only applicant");

        uint256 _groupId = receiptController.getGroupId(_receiptId);

        _revoke(_groupId, _receiptId);
        // TODO: get ETH refunded
    }

    function _verifyDeposit(uint256 _receiptId, string memory _proofPlaceholder) internal {
        // TODO: BTC need to match full amount in group
    }

    function _approveDeposit(uint256 _receiptId) internal {
        receiptController.depositReceived(_receiptId);

        uint256 _groupId = receiptController.getGroupId(_receiptId);

        groups.depositReceived(_groupId, receiptController.getAmountInSatoshi(_receiptId));
    }

    function _mintToUser(uint256 _receiptId) internal {
        address user = receiptController.getUserAddress(_receiptId);
        uint256 amountInSatoshi = receiptController.getAmountInSatoshi(_receiptId);
        // TODO: add fee deduction
        ebtc.mint(user, amountInSatoshi.mul(BTCUtils.getSatoshiMultiplierForEBTC()));
    }

    function _revoke(uint256 _groupId, uint256 _receiptId) internal {
        groups.emptyGroupLastTimestamp(_groupId);

        receiptController.revokeRequest(_receiptId);
    }

    function burnRequest(uint256 _receiptId) public {
        // TODO: add fee deduction
        uint256 amountInSatoshi = receiptController.getAmountInSatoshi(_receiptId);
        uint256 amount = amountInSatoshi.mul(BTCUtils.getSatoshiMultiplierForEBTC());

        ebtc.burnFrom(_msgSender(), amount);

        uint256 _groupId = receiptController.getGroupId(_receiptId);

        groups.withdrawRequested(_groupId, amountInSatoshi);

        receiptController.withdrawRequest(_receiptId);
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
