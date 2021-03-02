// SPDX-License-Identifier: MIT
pragma solidity >=0.6.0 <0.8.0;
pragma experimental ABIEncoderV2;

interface IKeeperImport {
    function importKeepers(
        address _from,
        address[] calldata _assets,
        address[] calldata _keepers,
        uint256[] calldata _keeper_amounts
    ) external;
}
