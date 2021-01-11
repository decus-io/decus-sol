// SPDX-License-Identifier: MIT
pragma solidity ^0.6.12;

import "@openzeppelin/contracts/access/AccessControl.sol";

import {ReceiptLib} from "./ReceiptLib.sol";


contract ReceiptController is AccessControl {

    bytes32 public constant RECEIPT_FACTORY_ADMIN_ROLE = keccak256("RECEIPT_FACTORY_ADMIN_ROLE");

    event DepositRequested(uint256 indexed groupId, address indexed user, uint256 amount);

    event DepositReceived(uint256 indexed groupId);

    event WithdrawRequested(uint256 indexed groupId);

    event WithdrawCompleted(uint256 indexed groupId);

    ReceiptLib.ReceiptMap receipts;

    function getUserAddress(uint256 groupId) external view returns (address) {
        return ReceiptLib.getUserAddress(receipts, groupId);
    }

    function getAmountInSatoshi(uint256 groupId) external view returns (uint256) {
        return ReceiptLib.getAmountInSatoshi(receipts, groupId);
    }

    function getReceiptStatus(uint256 groupId) external view returns (uint256) {
        return ReceiptLib.getReceiptStatus(receipts, groupId);
    }


    constructor(address admin) public {
        _setupRole(RECEIPT_FACTORY_ADMIN_ROLE, admin);
    }

    function depositRequest(address _user, uint256 _groupId, uint256 _amountInSatoshi) external {
        require(hasRole(RECEIPT_FACTORY_ADMIN_ROLE, _msgSender()), "require admin role");

        ReceiptLib.depositRequest(receipts, _user, _groupId, _amountInSatoshi);

        emit DepositRequested(_groupId, _user, _amountInSatoshi);
    }

    function depositReceived(uint256 _groupId) external {
        require(hasRole(RECEIPT_FACTORY_ADMIN_ROLE, _msgSender()), "require admin role");

        ReceiptLib.depositReceived(receipts, _groupId);

        emit DepositReceived(_groupId);
    }

    function withdrawRequest(uint256 _groupId) external {
        require(hasRole(RECEIPT_FACTORY_ADMIN_ROLE, _msgSender()), "require admin role");

        ReceiptLib.withdrawRequest(receipts, _groupId);

        emit WithdrawRequested(_groupId);
    }

    function withdrawCompleted(uint256 _groupId) external {
        require(hasRole(RECEIPT_FACTORY_ADMIN_ROLE, _msgSender()), "require admin role");

        ReceiptLib.withdrawCompleted(receipts, _groupId);

        emit WithdrawCompleted(_groupId);
    }
}
