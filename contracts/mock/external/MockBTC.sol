// SPDX-License-Identifier: MIT

pragma solidity ^0.8.3;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MockBTC is ERC20 {
    constructor(string memory name, string memory symbol) ERC20(name, symbol) {}

    function mint(address account, uint256 amount) public {
        _mint(account, amount);
    }

    function burn(address account, uint256 amount) public {
        _burn(account, amount);
    }
}

contract WBTC is MockBTC {
    constructor() MockBTC("Wrapped Bitcoin", "WBTC") {}

    function decimals() public pure override returns (uint8) {
        return 8;
    }
}

contract HBTC is MockBTC {
    constructor() MockBTC("Huobi BTC", "HBTC") {}
}

contract OtherCoin is MockBTC {
    constructor() MockBTC("Other ERC20", "OTHER") {}
}
