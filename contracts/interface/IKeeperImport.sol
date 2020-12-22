// SPDX-License-Identifier: MIT
pragma solidity >=0.6.0 <0.8.0;


interface IKeeperImport {
    function importKeepers(address _from, address[] calldata _assets, uint256[] calldata _amounts,
        address[] calldata _keepers, uint256[] calldata _keeper_amounts) external returns (bool success);
}
