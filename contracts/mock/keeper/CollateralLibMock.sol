// SPDX-License-Identifier: MIT

pragma solidity >=0.6.0 <0.8.0;

import {IAssetMeta} from "../../interface/IAssetMeta.sol";
import {CollateralLib} from "../../keeper/CollateralLib.sol";
import {AssetLib} from "../../core/AssetLib.sol";


contract CollateralLibMock {
    CollateralLib.CollateralMap _map;
    AssetLib.Asset _asset;

    function containId(uint256 _id) public view returns (bool) {
        return CollateralLib.containId(_map, _id);
    }

    function addKeeper(uint256 _id, address[] calldata _assets, uint256[] calldata _amounts,
        IAssetMeta _meta) public {
        CollateralLib.addKeeper(_map, _id, _assets, _amounts, _meta);
    }

    function getSatoshiValue(uint256 _id) public view returns (uint256) {
        return CollateralLib.getSatoshiValue(_map, _id);
    }
}
