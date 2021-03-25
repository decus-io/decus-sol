// SPDX-License-Identifier: MIT

pragma solidity >=0.6.0 <0.8.0;
pragma experimental ABIEncoderV2;

import {ReceiptLib} from "../../user/ReceiptLib.sol";

contract ReceiptLibMock {
    ReceiptLib.ReceiptMap _map;

    using ReceiptLib for ReceiptLib.ReceiptMap;

    function getReceiptInfo(uint256 receiptId) public view returns (ReceiptLib.Receipt memory) {
        return _map.getReceiptInfo(receiptId);
    }

    function getUserAddress(uint256 receiptId) public view returns (address) {
        return _map.getUserAddress(receiptId);
    }

    function getAmountInSatoshi(uint256 receiptId) public view returns (uint256) {
        return _map.getAmountInSatoshi(receiptId);
    }

    function getReceiptStatus(uint256 receiptId) public view returns (uint256) {
        return _map.getReceiptStatus(receiptId);
    }

    function getGroupId(uint256 receiptId) public view returns (uint256) {
        return _map.getGroupId(receiptId);
    }

    function isPending(uint256 receiptId) public view returns (bool) {
        return _map.isPending(receiptId);
    }

    function depositRequest(
        uint256 receiptId,
        address user,
        uint256 groupId,
        uint256 amountSatoshi
    ) public {
        _map.depositRequest(receiptId, user, groupId, amountSatoshi);
    }

    function receiptRevoked(uint256 receiptId) public {
        _map.receiptRevoked(receiptId);
    }

    function depositReceived(
        uint256 receiptId,
        bytes32 txId,
        uint256 height
    ) public {
        _map.depositReceived(receiptId, txId, height);
    }

    function withdrawRequest(uint256 receiptId, string memory btcAddress) public {
        _map.withdrawRequest(receiptId, btcAddress);
    }

    function withdrawCompleted(uint256 receiptId) public {
        _map.withdrawCompleted(receiptId);
    }
}
