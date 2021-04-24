// SPDX-License-Identifier: MIT
pragma solidity ^0.8.3;

interface IKeeperImport {
    function importKeepers(
        address _from,
        address[] calldata _assets,
        address[] calldata _keepers,
        uint256[] calldata _keeper_amounts
    ) external;
}
