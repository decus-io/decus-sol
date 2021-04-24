// SPDX-License-Identifier: MIT
pragma solidity ^0.8.3;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

import {BTCUtils} from "../utils/BTCUtils.sol";
import {IAssetMeta} from "../interface/IAssetMeta.sol";

contract AssetMeta is IAssetMeta {
    // struct
    struct Asset {
        address token; // contract address
        uint256 divisor; // 10 ** decimal
        bool exists;
    }

    mapping(address => Asset) public assets;

    constructor(address[] memory _assets) {
        for (uint8 i = 0; i < _assets.length; i++) {
            address asset = _assets[i];
            uint256 decimal = ERC20(asset).decimals();
            assets[asset] = Asset(asset, BTCUtils.getSatoshiDivisor(decimal), true);
        }
    }

    // TOOD: use external or public?
    function exists(address _asset) external view override returns (bool) {
        return assets[_asset].exists;
    }

    function getSatoshiDivisor(address _asset) external view override returns (uint256) {
        Asset storage meta = assets[_asset];
        require(meta.exists, "not supported collateral asset");
        return meta.divisor;
    }
}
