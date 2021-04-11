// SPDX-License-Identifier: MIT
pragma solidity >=0.6.0 <0.8.0;

interface ICustodyToken {
    function name() external view returns (string memory);

    function symbol() external view returns (string memory);

    function decimals() external view returns (uint8);

    function totalSupply() external view returns (uint256);

    function balanceOf(address account) external view returns (uint256);

    function totalGons() external view returns (uint256);

    function gonBalanceOf(address account) external view returns (uint256);

    function rebase(
        uint256 epoch,
        uint256 supplyDelta,
        bool negative
    ) external returns (uint256);

    event Transfer(address indexed from, address indexed to, uint256 value);
    event Rebased(uint256 indexed epoch, uint256 totalSupply);
    event MonetaryPolicyUpdated(address monetaryPolicy);
}
