// SPDX-License-Identifier: MIT
pragma solidity ^0.6.0;

import "./LibRequest.sol";

contract SignatureValidator is LibRequest {
    mapping(address => uint256) public lastNonces;

    function recoverSigner(
        bytes32 message,
        uint8 packedV,
        bytes32 r,
        bytes32 s
    ) public pure returns (address) {
        return ecrecover(message, packedV, r, s);
    }

    function batchValidate(
        address recipient,
        uint256 amount,
        address[] calldata keepers,
        uint256[] calldata nonces,
        bytes32[] calldata r,
        bytes32[] calldata s,
        uint256 packedV
    ) external {
        for (uint256 i = 0; i < keepers.length; i++) {
            require(lastNonces[keepers[i]] < nonces[i], "nonce outdated");
            require(
                recoverSigner(
                    getMintRequestHash(recipient, nonces[i], amount),
                    uint8(packedV), // the lowest byte of packedV
                    r[i],
                    s[i]
                ) == keepers[i],
                "invalid signature"
            );
            lastNonces[keepers[i]] = nonces[i];

            packedV >>= 8;
        }
    }
}
