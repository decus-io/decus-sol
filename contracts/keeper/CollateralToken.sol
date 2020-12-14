// SPDX-License-Identifier: MIT
pragma solidity ^0.6.12;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";


contract CollateralToken is ERC721, AccessControl {
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");

    constructor (address minter) public ERC721("Keeper Collateral Token", "KCT") {
        _setupRole(MINTER_ROLE, minter);
    }

}
