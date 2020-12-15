// SPDX-License-Identifier: MIT
pragma solidity ^0.6.12;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/utils/Counters.sol";


contract CollateralToken is ERC721, AccessControl {
    // TODO: support pause and burn?
    using Counters for Counters.Counter;

    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    Counters.Counter private _id_gen;

    constructor (address minter) public ERC721("Keeper Collateral Token", "KCT") {
        _setupRole(MINTER_ROLE, minter);
    }

    function mint(address keeper) external returns (uint256) {
        require(hasRole(MINTER_ROLE, _msgSender()), "require minter role");

        // TODO: not sure if returning id is the normal way
        uint256 id = _id_gen.current();
        _mint(keeper, id);
        _id_gen.increment();
        return id;
    }
}
