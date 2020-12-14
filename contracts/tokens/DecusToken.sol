// SPDX-License-Identifier: MIT

pragma solidity ^0.6.12;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

contract DecusToken is ERC20, AccessControl {

    string private constant _name = "Decus Token";
    string private constant _symbol = "DCS";

    uint256 public constant INITIAL_SUPPLY = 1000000000 * 10**uint256(18);

    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");

    /// @notice The DecusToken Constructor.
    constructor(address minter) ERC20(_name, _symbol) public {
        _mint(msg.sender, INITIAL_SUPPLY);
        _setupRole(MINTER_ROLE, minter);
    }

    function mint(address to, uint256 amount) public {
        // Check that the calling account has the minter role
        require(hasRole(MINTER_ROLE, msg.sender), "Caller is not a minter");
        _mint(to, amount);
    }

    function transferTokens(address beneficiary, uint256 amount) public returns (bool) {
        require(amount > 0);

        _transfer(msg.sender, beneficiary, amount);
        emit Transfer(msg.sender, beneficiary, amount);

        return true;
    }
}
