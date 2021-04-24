// SPDX-License-Identifier: MIT
pragma solidity ^0.8.3;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

import {IAssetMeta} from "../interface/IAssetMeta.sol";
import {AssetLib} from "../core/AssetLib.sol";

library CollateralLib {
    using AssetLib for AssetLib.Asset;

    struct KeeperCollateral {
        uint256[] indexes;
        uint256 satoshi;
        bool exists;
    }

    struct CollateralMap {
        AssetLib.Asset[] assets;
        mapping(address => KeeperCollateral) data; // keeper address to collateral
    }

    function addKeeper(
        CollateralMap storage _map,
        address _keeper,
        address[] calldata _assets,
        uint256[] calldata _amounts,
        IAssetMeta _meta
    ) internal {
        require(_assets.length == _amounts.length, "length not match");

        KeeperCollateral storage collateral = _map.data[_keeper];
        require(!collateral.exists, "nft id already exist");

        for (uint256 i = 0; i < _assets.length; i++) {
            uint256 _index = _map.assets.length;
            _map.assets.push(AssetLib.Asset(_assets[i], _amounts[i]));
            collateral.indexes.push(_index);
            collateral.satoshi += _map.assets[_index].getSatoshiValue(_meta);
        }
        collateral.exists = true;
    }

    function deleteKeeper(CollateralMap storage _map, address _keeper) internal {
        KeeperCollateral storage collateral = _map.data[_keeper];
        require(collateral.exists, "keeper not exist");

        for (uint256 i = 0; i < collateral.indexes.length; i++) {
            AssetLib.Asset storage _a = _map.assets[collateral.indexes[i]];
            IERC20(_a.token).approve(_keeper, _a.amount);
        }
        delete _map.data[_keeper];
    }

    function exist(CollateralMap storage _map, address _keeper) internal view returns (bool) {
        return _map.data[_keeper].exists;
    }

    function getSatoshiValue(CollateralMap storage _map, address _keeper)
        internal
        view
        returns (uint256)
    {
        return _map.data[_keeper].satoshi;
    }
}
