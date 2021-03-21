// SPDX-License-Identifier: MIT
pragma solidity ^0.6.0;

import "./LibRequest.sol";

contract SignatureValidator is LibRequest {
    mapping(uint256 => bool) public verified;

    function recoverSigner(
        bytes32 message,
        uint8 packedV,
        bytes32 r,
        bytes32 s
    ) public pure returns (address) {
        return ecrecover(message, packedV, r, s);
    }

    function batchValidate(
        uint256 receiptId,
        bytes32[] calldata data, // recipient, amount, txId, height
        address[] calldata keepers,
        bytes32[] calldata r,
        bytes32[] calldata s,
        uint256 packedV
    ) external {
        require(!verified[receiptId], "already verified");
        for (uint256 i = 0; i < keepers.length; i++) {
            require(
                recoverSigner(
                    getMintRequestHash(data, receiptId),
                    uint8(packedV), // the lowest byte of packedV
                    r[i],
                    s[i]
                ) == keepers[i],
                "invalid signature"
            );

            packedV >>= 8;
        }
        verified[receiptId] = true;
    }
}
