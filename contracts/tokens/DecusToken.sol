pragma solidity ^0.6.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract DecusToken is ERC20 {

    string private constant _name = "Decus Token";
    string private constant _symbol = "DCT";

    uint256 public constant INITIAL_SUPPLY = 1000000000 * 10**uint256(18);

    /// @notice The DecusToken Constructor.
    constructor() ERC20(_name, _symbol) public {
        _mint(msg.sender, INITIAL_SUPPLY);
    }

    function transferTokens(address beneficiary, uint256 amount) public returns (bool) {
        require(amount > 0);

        _transfer(msg.sender, beneficiary, amount);
        emit Transfer(msg.sender, beneficiary, amount);

        return true;
    }
}