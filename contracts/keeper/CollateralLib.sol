// SPDX-License-Identifier: MIT
pragma solidity >=0.6.0 <0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";

import {IAssetMeta} from "../interface/IAssetMeta.sol";
import {AssetLib} from "../core/AssetLib.sol";


library CollateralLib {
    using SafeMath for uint256;
    using AssetLib for AssetLib.Asset;

    struct KeeperCollateral {
        uint256[] indexes;
        bool exists;
        uint256 satoshi;
    }

    struct CollateralMap {
        AssetLib.Asset[] assets;
        mapping(uint256 => KeeperCollateral) data;  // nft to collateral
    }

    function addKeeper(CollateralMap storage _map, uint256 _id, address[] calldata _assets, uint256[] calldata _amounts,
        IAssetMeta _meta) internal {
        require(_assets.length == _amounts.length, "length not match");

        KeeperCollateral storage keeper = _map.data[_id];
        require(!keeper.exists, "nft id already exist");

        for (uint i = 0; i < _assets.length; i++) {
            uint256 _index = _map.assets.length;
            _map.assets.push(AssetLib.Asset(_assets[i], _amounts[i]));
            keeper.indexes.push(_index);
            keeper.satoshi = keeper.satoshi.add(_map.assets[_index].getSatoshiValue(_meta));
        }
        keeper.exists = true;
    }

    function deleteKeeper(CollateralMap storage _map, uint256 _id, address _recipient) internal {
        KeeperCollateral storage keeper = _map.data[_id];
        require(keeper.exists, "nft id not exist");

        for (uint i = 0; i < keeper.indexes.length; i++) {
            AssetLib.Asset storage _a = _map.assets[keeper.indexes[i]];
            IERC20(_a.token).approve(_recipient, _a.amount);
        }
        delete _map.data[_id];
        // TODO: make sure it clear the indexes
    }

    function containId(CollateralMap storage _map, uint256 _id) internal view returns (bool) {
        return _map.data[_id].exists;
    }

    function getSatoshiValue(CollateralMap storage _map, uint256 _id) internal view returns (uint256) {
        return _map.data[_id].satoshi;
    }
}
