// SPDX-License-Identifier: MIT

pragma solidity ^0.8.3;

import {IAssetMeta} from "../../interface/IAssetMeta.sol";
import {CollateralLib} from "../../keeper/CollateralLib.sol";
import {AssetLib} from "../../core/AssetLib.sol";

contract CollateralLibMock {
    CollateralLib.CollateralMap _map;
    AssetLib.Asset _asset;

    function exist(address _keeper) public view returns (bool) {
        return CollateralLib.exist(_map, _keeper);
    }

    function addKeeper(
        address _keeper,
        address[] calldata _assets,
        uint256[] calldata _amounts,
        IAssetMeta _meta
    ) public {
        CollateralLib.addKeeper(_map, _keeper, _assets, _amounts, _meta);
    }

    function deleteKeeper(address _keeper) public {
        CollateralLib.deleteKeeper(_map, _keeper);
    }

    function getSatoshiValue(address _keeper) public view returns (uint256) {
        return CollateralLib.getSatoshiValue(_map, _keeper);
    }
}
