// SPDX-License-Identifier: MIT
pragma solidity ^0.6.12;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

import {ReceiptLib} from "./ReceiptLib.sol";

contract ReceiptController is AccessControl {
    using ReceiptLib for ReceiptLib.ReceiptMap;
    using Counters for Counters.Counter;
    using SafeMath for uint256;

    bytes32 public constant RECEIPT_ADMIN_ROLE = keccak256("RECEIPT_ADMIN_ROLE");
    uint256 public constant MINT_REQUEST_GRACE_PERIOD = 8 hours;

    event DepositRequested(
        uint256 indexed receiptId,
        uint256 indexed groupId,
        address indexed user,
        uint256 amount
    );

    event DepositRevoked(uint256 indexed receiptId, address indexed revoker);

    event DepositReceived(uint256 indexed receiptId);

    event WithdrawRequested(uint256 indexed receiptId);

    event WithdrawCompleted(uint256 indexed receiptId);

    ReceiptLib.ReceiptMap receipts;
    Counters.Counter private _id_gen;
    mapping(uint256 => uint256) group2receipt; //TODO: use groupid and user address as key

    function getUserAddress(uint256 receiptId) external view returns (address) {
        return ReceiptLib.getUserAddress(receipts, receiptId);
    }

    function getAmountInSatoshi(uint256 receiptId) external view returns (uint256) {
        return ReceiptLib.getAmountInSatoshi(receipts, receiptId);
    }

    function getReceiptStatus(uint256 receiptId) external view returns (uint256) {
        return ReceiptLib.getReceiptStatus(receipts, receiptId);
    }

    function getGroupId(uint256 receiptId) external view returns (uint256) {
        return ReceiptLib.getGroupId(receipts, receiptId);
    }

    function getCreateTimestamp(uint256 receiptId) external view returns (uint256) {
        return ReceiptLib.getCreateTimestamp(receipts, receiptId);
    }

    function getWorkingReceiptId(uint256 groupId) external view returns (uint256) {
        return group2receipt[groupId];
    }

    function isGroupAvailable(uint256 groupId) external view returns (bool) {
        return !_isPending(group2receipt[groupId]);
    }

    function isStale(uint256 receiptId) external view returns (bool) {
        return
            ReceiptLib.getCreateTimestamp(receipts, receiptId).add(MINT_REQUEST_GRACE_PERIOD) <
            block.timestamp;
    }

    function _isPending(uint256 receiptId) internal view returns (bool) {
        return ReceiptLib.isPending(receipts, receiptId);
    }

    constructor() public {
        _setupRole(DEFAULT_ADMIN_ROLE, _msgSender());

        _setRoleAdmin(RECEIPT_ADMIN_ROLE, DEFAULT_ADMIN_ROLE);

        _id_gen.increment(); // receipt id starts from 1
    }

    function depositRequest(
        address _user,
        uint256 _groupId,
        uint256 _amountInSatoshi
    ) external returns (uint256) {
        require(hasRole(RECEIPT_ADMIN_ROLE, _msgSender()), "require admin role");

        require(!_isPending(group2receipt[_groupId]), "group is occupied with pending receipt");

        uint256 _receiptId = _id_gen.current();
        _id_gen.increment();

        // TODO: can we reused old receipt to reduce receipt creation?
        ReceiptLib.depositRequest(receipts, _receiptId, _user, _groupId, _amountInSatoshi);

        group2receipt[_groupId] = _receiptId;

        emit DepositRequested(_receiptId, _groupId, _user, _amountInSatoshi);

        return _receiptId;
    }

    function revokeRequest(uint256 _receiptId) external {
        require(_receiptId != 0, "receipt id 0 is not allowed");
        require(hasRole(RECEIPT_ADMIN_ROLE, _msgSender()), "require admin role");

        ReceiptLib.receiptRevoked(receipts, _receiptId);

        emit DepositRevoked(_receiptId, _msgSender());
    }

    function depositReceived(
        uint256 _receiptId,
        bytes32 _txId,
        uint256 _height
    ) external {
        require(_receiptId != 0, "receipt id 0 is not allowed");
        require(hasRole(RECEIPT_ADMIN_ROLE, _msgSender()), "require admin role");

        ReceiptLib.depositReceived(receipts, _receiptId, _txId, _height);

        emit DepositReceived(_receiptId);
    }

    function withdrawRequest(uint256 _receiptId) external {
        require(_receiptId != 0, "receipt id 0 is not allowed");
        require(hasRole(RECEIPT_ADMIN_ROLE, _msgSender()), "require admin role");

        ReceiptLib.withdrawRequest(receipts, _receiptId);

        emit WithdrawRequested(_receiptId);
    }

    function withdrawCompleted(uint256 _receiptId) external {
        require(_receiptId != 0, "receipt id 0 is not allowed");
        require(hasRole(RECEIPT_ADMIN_ROLE, _msgSender()), "require admin role");

        ReceiptLib.withdrawCompleted(receipts, _receiptId);

        emit WithdrawCompleted(_receiptId);
    }
}
