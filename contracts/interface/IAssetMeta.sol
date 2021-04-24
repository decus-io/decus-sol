// SPDX-License-Identifier: MIT
pragma solidity ^0.8.3;

interface IAssetMeta {
    function exists(address _asset) external view returns (bool);

    function getSatoshiDivisor(address _asset) external view returns (uint256);
}
