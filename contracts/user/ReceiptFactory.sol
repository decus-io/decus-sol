// SPDX-License-Identifier: MIT
pragma solidity ^0.6.12;

import "@openzeppelin/contracts/access/AccessControl.sol";

import {ReceiptLib} from "./ReceiptLib.sol";


contract ReceiptFactory is AccessControl {

    bytes32 public constant RECEIPT_FACTORY_ADMIN_ROLE = keccak256("RECEIPT_FACTORY_ADMIN_ROLE");

    ReceiptLib.ReceiptMap receipts;

    function getUserAddress(uint256 groupId) external view returns (address) {
        return ReceiptLib.getUserAddress(receipts, groupId);
    }

    function getAmountInSatoshi(uint256 groupId) external view returns (uint256) {
        return ReceiptLib.getAmountInSatoshi(receipts, groupId);
    }

    constructor(address admin) public {
        _setupRole(RECEIPT_FACTORY_ADMIN_ROLE, admin);
    }

    function addReceipt(address _user, uint256 _groupId, uint256 _amountInSatoshi) external {
        require(hasRole(RECEIPT_FACTORY_ADMIN_ROLE, _msgSender()), "require admin role");

        ReceiptLib.addReceipt(receipts, _user, _groupId, _amountInSatoshi);
    }

    function depositReceived(uint256 _groupId) external {
        require(hasRole(RECEIPT_FACTORY_ADMIN_ROLE, _msgSender()), "require admin role");

        ReceiptLib.depositReceived(receipts, _groupId);
    }

    function withdrawRequested(uint256 _groupId) external {
        require(hasRole(RECEIPT_FACTORY_ADMIN_ROLE, _msgSender()), "require admin role");

        ReceiptLib.withdrawRequested(receipts, _groupId);
    }

    function withdrawCompleted(uint256 _groupId) external {
        require(hasRole(RECEIPT_FACTORY_ADMIN_ROLE, _msgSender()), "require admin role");

        ReceiptLib.withdrawCompleted(receipts, _groupId);
    }
}
