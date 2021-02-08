// SPDX-License-Identifier: MIT

pragma solidity ^0.6.12;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MockBTC is ERC20 {
    constructor(
        string memory name,
        string memory symbol,
        uint8 decimals
    ) public ERC20(name, symbol) {
        _setupDecimals(decimals);
    }

    function mint(address account, uint256 amount) public {
        _mint(account, amount);
    }

    function burn(address account, uint256 amount) public {
        _burn(account, amount);
    }
}

contract WBTC is MockBTC {
    constructor() public MockBTC("Wrapped Bitcoin", "WBTC", 8) {}
}

contract HBTC is MockBTC {
    constructor() public MockBTC("Huobi BTC", "HBTC", 18) {}
}

contract OtherCoin is MockBTC {
    constructor() public MockBTC("Other ERC20", "OTHER", 18) {}
}
