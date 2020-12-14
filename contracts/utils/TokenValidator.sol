// SPDX-License-Identifier: MIT
pragma solidity ^0.6.12;


contract TokenValidator {
    struct SupportedToken {
        address token;
        bool exist;
    }
    mapping(address => SupportedToken) public tokens;

    constructor(address[] memory _tokens) public {
        for (uint8 i = 0; i < _tokens.length; i++) {
            tokens[_tokens[i]] = SupportedToken(_tokens[i], true);
        }
    }

    function validate(address _token) external view returns(bool) {
        SupportedToken memory vToken = tokens[_token];
        return vToken.exist;
    }
}

