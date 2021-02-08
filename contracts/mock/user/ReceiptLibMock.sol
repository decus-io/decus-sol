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

    function depositRequest(
        address _user,
        uint256 _groupId,
        uint256 _amountSatoshi
    ) public {
        _map.depositRequest(_user, _groupId, _amountSatoshi);
    }

    function depositReceived(uint256 _groupId) public {
        _map.depositReceived(_groupId);
    }

    function withdrawRequest(uint256 _groupId) public {
        _map.withdrawRequest(_groupId);
    }

    function withdrawCompleted(uint256 _groupId) public {
        _map.withdrawCompleted(_groupId);
    }
}
