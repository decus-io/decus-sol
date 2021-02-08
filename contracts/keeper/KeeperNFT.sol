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
    }

    function mint(address keeper) external returns (uint256) {
        uint256 id = _id_gen.current();
        _mint(keeper, id);
        _id_gen.increment();
        return id;
    }

    function setBtcPubkey(uint256 tokenId, string memory btcPubkey) external {
        // TODO: use of admin here is because KeeperRegistry would call this function, now sure if we can avoid using admin role
        require(
            hasRole(ADMIN_ROLE, _msgSender()) || (ownerOf(tokenId) == _msgSender()),
            "require admin or owner of tokenId"
        );
        _setTokenURI(tokenId, btcPubkey);
    }
}
