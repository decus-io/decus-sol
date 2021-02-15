// SPDX-License-Identifier: MIT
pragma solidity ^0.6.12;

library ReceiptLib {
    enum Status {
        Available,
        DepositRequested,
        DepositReceived,
        WithdrawRequested,
        WithdrawDone // should equal to Available
    }

    struct Receipt {
        address user;
        uint256 groupId;
        uint256 amountInSatoshi;
        Status status;
    }

    struct ReceiptMap {
        mapping(uint256 => Receipt) receipts; // groupId to Receipt
    }

    function getUserAddress(ReceiptMap storage _map, uint256 groupId)
        internal
        view
        returns (address)
    {
        return _map.receipts[groupId].user;
    }

    function getAmountInSatoshi(ReceiptMap storage _map, uint256 groupId)
        internal
        view
        returns (uint256)
    {
        return _map.receipts[groupId].amountInSatoshi;
    }

    function getReceiptStatus(ReceiptMap storage _map, uint256 groupId)
        internal
        view
        returns (uint256)
    {
        return uint256(_map.receipts[groupId].status);
    }

    function depositRequest(
        ReceiptMap storage _map,
        address _user,
        uint256 _groupId,
        uint256 _amountInSatoshi
    ) internal {
        Receipt storage receipt = _map.receipts[_groupId];
        require(receipt.status < Status.DepositReceived, "receipt is in use");

        receipt.user = _user;
        receipt.groupId = _groupId;
        receipt.amountInSatoshi = _amountInSatoshi;
        receipt.status = Status.DepositRequested;
    }

    function requestRevoked(ReceiptMap storage _map, uint256 _groupId) internal {
        Receipt storage receipt = _map.receipts[_groupId];
        require(receipt.status < Status.DepositReceived, "receipt is in use");

        receipt.user = address(0);
        receipt.groupId = _groupId;
        receipt.amountInSatoshi = 0;
        receipt.status = Status.Available;
    }

    function depositReceived(ReceiptMap storage _map, uint256 _groupId) internal {
        Receipt storage receipt = _map.receipts[_groupId];

        require(
            receipt.status == Status.DepositRequested,
            "receipt is not in DepositRequested state"
        );

        receipt.status = Status.DepositReceived;
    }

    function withdrawRequest(ReceiptMap storage _map, uint256 _groupId) internal {
        Receipt storage receipt = _map.receipts[_groupId];

        require(
            receipt.status == Status.DepositReceived,
            "receipt is not in DepositReceived state"
        );

        receipt.status = Status.WithdrawRequested;
    }

    function withdrawCompleted(ReceiptMap storage _map, uint256 _groupId) internal {
        Receipt storage receipt = _map.receipts[_groupId];

        require(
            receipt.status == Status.WithdrawRequested,
            "receipt is not WithdrawRequested state"
        );

        receipt.status = Status.Available;

        receipt.amountInSatoshi = 0;
    }
}
