// SPDX-License-Identifier: MIT
pragma solidity ^0.6.12;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721Burnable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract KeeperNFT is AccessControl, ERC721Burnable {
    // TODO: support pause?
    using Counters for Counters.Counter;

    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    Counters.Counter private _id_gen;

    // TODO: add event

    // TODO: add blocklist

    constructor(address admin) public ERC721("Keeper Collateral Token", "KCT") {
        _setupRole(ADMIN_ROLE, admin);
        _id_gen.increment(); // starts from 1
    }

    function mint(address keeper) external returns (uint256) {
        uint256 id = _id_gen.current();
        _mint(keeper, id);
        _id_gen.increment();
        return id;
    }
}
