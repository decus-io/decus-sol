// SPDX-License-Identifier: MIT
pragma solidity ^0.8.3;

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
        LibRequest.MintRequest memory request,
        address[] calldata keepers,
        bytes32[] calldata r,
        bytes32[] calldata s,
        uint256 packedV
    ) public view returns (bool) {
        for (uint256 i = 0; i < keepers.length; i++) {
            require(
                recoverSigner(
                    getMintRequestHash(request),
                    uint8(packedV), // the lowest byte of packedV
                    r[i],
                    s[i]
                ) == keepers[i],
                "invalid signature"
            );

            packedV >>= 8;
        }
        return true;
    }
}
