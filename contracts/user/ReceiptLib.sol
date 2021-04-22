// SPDX-License-Identifier: MIT
pragma solidity ^0.8.3;

library ReceiptLib {
    enum Status {
        Available,
        DepositRequested,
        DepositReceived,
        WithdrawRequested,
        WithdrawDone // should equal to Available
    }

    struct Receipt {
        uint256 id;
        address user;
        uint256 groupId;
        uint256 amountInSatoshi;
        uint256 createTimestamp;
        bytes32 txId;
        uint256 height;
        Status status;
        string btcAddress; // for withdraw
    }

    struct ReceiptMap {
        mapping(uint256 => Receipt) receipts; // receiptId to Receipt
    }

    function getReceiptInfo(ReceiptMap storage _map, uint256 receiptId)
        internal
        view
        returns (Receipt memory)
    {
        return _map.receipts[receiptId];
    }

    function getUserAddress(ReceiptMap storage _map, uint256 receiptId)
        internal
        view
        returns (address)
    {
        return _map.receipts[receiptId].user;
    }

    function getAmountInSatoshi(ReceiptMap storage _map, uint256 receiptId)
        internal
        view
        returns (uint256)
    {
        return _map.receipts[receiptId].amountInSatoshi;
    }

    function getReceiptStatus(ReceiptMap storage _map, uint256 receiptId)
        internal
        view
        returns (uint256)
    {
        return uint256(_map.receipts[receiptId].status);
    }

    function getGroupId(ReceiptMap storage _map, uint256 receiptId)
        internal
        view
        returns (uint256)
    {
        return _map.receipts[receiptId].groupId;
    }

    function getCreateTimestamp(ReceiptMap storage _map, uint256 receiptId)
        internal
        view
        returns (uint256)
    {
        return _map.receipts[receiptId].createTimestamp;
    }

    function isPending(ReceiptMap storage _map, uint256 receiptId) internal view returns (bool) {
        return _map.receipts[receiptId].status == Status.DepositRequested;
    }

    function depositRequest(
        ReceiptMap storage _map,
        uint256 _receiptId,
        address _user,
        uint256 _groupId,
        uint256 _amountInSatoshi
    ) internal {
        Receipt storage receipt = _map.receipts[_receiptId];
        require(receipt.status < Status.DepositReceived, "receipt is in use");

        receipt.id = _receiptId;
        receipt.user = _user;
        receipt.groupId = _groupId;
        receipt.amountInSatoshi = _amountInSatoshi;
        receipt.status = Status.DepositRequested;
        receipt.createTimestamp = block.timestamp;
    }

    function receiptRevoked(ReceiptMap storage _map, uint256 _receiptId) internal {
        Receipt storage receipt = _map.receipts[_receiptId];
        require(receipt.status < Status.DepositReceived, "receipt is in use");

        // TODO: confirm we do not need to revert all the state
        receipt.status = Status.Available;
        // receipt.user = address(0);
        // receipt.groupId = _groupId;
        // receipt.amountInSatoshi = 0;
    }

    function depositReceived(
        ReceiptMap storage _map,
        uint256 _receiptId,
        bytes32 _txId,
        uint256 _height
    ) internal {
        Receipt storage receipt = _map.receipts[_receiptId];

        require(
            receipt.status == Status.DepositRequested,
            "receipt is not in DepositRequested state"
        );

        receipt.status = Status.DepositReceived;
        receipt.txId = _txId;
        receipt.height = _height;
    }

    function withdrawRequest(
        ReceiptMap storage _map,
        uint256 receiptId,
        string memory btcAddress
    ) internal {
        Receipt storage receipt = _map.receipts[receiptId];

        require(
            receipt.status == Status.DepositReceived,
            "receipt is not in DepositReceived state"
        );

        receipt.status = Status.WithdrawRequested;
        receipt.btcAddress = btcAddress;
    }

    function withdrawCompleted(ReceiptMap storage _map, uint256 _receiptId) internal {
        Receipt storage receipt = _map.receipts[_receiptId];

        require(
            receipt.status == Status.WithdrawRequested,
            "receipt is not WithdrawRequested state"
        );

        receipt.status = Status.Available;

        receipt.amountInSatoshi = 0;
    }
}
