// SPDX-License-Identifier: MIT
pragma solidity ^0.6.0;

import "./LibEIP712.sol";

contract LibRequest is LibEIP712 {
    string private constant ORDER_TYPE =
        "MintRequest(address recipient,uint256 nonce,uint256 amount)";
    bytes32 private constant ORDER_TYPEHASH = keccak256(abi.encodePacked(ORDER_TYPE));

    // solhint-disable max-line-length
    struct MintRequest {
        address recipient; // Address that created the request.
        uint256 nonce; // Arbitrary number to facilitate uniqueness of the request's hash.
        uint256 amount;
    }

    function getMintRequestHash(
        address recipient,
        uint256 nonce,
        uint256 amount
    ) internal view returns (bytes32 requestHash) {
        MintRequest memory request =
            MintRequest({recipient: recipient, nonce: nonce, amount: amount});
        requestHash = hashEIP712Message(hashMintRequest(request));
        return requestHash;
    }

    function hashMintRequest(MintRequest memory request) private pure returns (bytes32 result) {
        return
            keccak256(abi.encode(ORDER_TYPEHASH, request.recipient, request.nonce, request.amount));
    }
}
