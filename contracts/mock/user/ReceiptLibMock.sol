// SPDX-License-Identifier: MIT

pragma solidity >=0.6.0 <0.8.0;

import {ReceiptLib} from "../../user/ReceiptLib.sol";

contract ReceiptLibMock {
    ReceiptLib.ReceiptMap _map;

    using ReceiptLib for ReceiptLib.ReceiptMap;

    function getUserAddress(uint256 _id) public view returns (address) {
        return _map.getUserAddress(_id);
    }

    function getAmountInSatoshi(uint256 _id) public view returns (uint256) {
        return _map.getAmountInSatoshi(_id);
    }

    function getReceiptStatus(uint256 _id) public view returns (uint256) {
        return _map.getReceiptStatus(_id);
    }

    function getGroupId(uint256 _receiptId) public view returns (uint256) {
        return _map.getGroupId(_receiptId);
    }

    function isPending(uint256 _receiptId) public view returns (bool) {
        return _map.isPending(_receiptId);
    }

    function depositRequest(
        uint256 _receiptId,
        address _user,
        uint256 _groupId,
        uint256 _amountSatoshi
    ) public {
        _map.depositRequest(_receiptId, _user, _groupId, _amountSatoshi);
    }

    function receiptRevoked(uint256 _receiptId) public {
        _map.receiptRevoked(_receiptId);
    }

    function depositReceived(uint256 _receiptId) public {
        _map.depositReceived(_receiptId);
    }

    function withdrawRequest(uint256 _receiptId) public {
        _map.withdrawRequest(_receiptId);
    }

    function withdrawCompleted(uint256 _receiptId) public {
        _map.withdrawCompleted(_receiptId);
    }
}
