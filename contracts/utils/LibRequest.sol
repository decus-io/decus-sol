// SPDX-License-Identifier: MIT
pragma solidity ^0.8.3;

import "./LibEIP712.sol";

contract LibRequest is LibEIP712 {
    string private constant ORDER_TYPE =
        "MintRequest(address recipient,uint256 receiptId,uint256 amount,bytes32 txId,uint256 height)";
    bytes32 private constant ORDER_TYPEHASH = keccak256(abi.encodePacked(ORDER_TYPE));

    // solhint-disable max-line-length
    struct MintRequest {
        address recipient; // Address that created the request.
        uint256 receiptId; // Arbitrary number to facilitate uniqueness of the request's hash.
        uint256 amount;
        bytes32 txId;
        uint256 height;
    }

    function getMintRequestHash(MintRequest memory request)
        internal
        view
        returns (bytes32 requestHash)
    {
        return hashEIP712Message(hashMintRequest(request));
    }

    function hashMintRequest(MintRequest memory request) private pure returns (bytes32 result) {
        return
            keccak256(
                abi.encode(
                    ORDER_TYPEHASH,
                    request.recipient,
                    request.receiptId,
                    request.amount,
                    request.txId,
                    request.height
                )
            );
    }
}
