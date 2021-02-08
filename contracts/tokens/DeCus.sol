// SPDX-License-Identifier: MIT

pragma solidity ^0.6.12;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

contract DeCus is ERC20, AccessControl {
    string private constant _name = "DeCus";
    string private constant _symbol = "DCS";

    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");

    constructor(address minter) public ERC20(_name, _symbol) {
        _setupRole(MINTER_ROLE, minter);
    }

    function mint(address to, uint256 amount) public {
        require(hasRole(MINTER_ROLE, msg.sender), "require minter role");
        _mint(to, amount);
    }
}
