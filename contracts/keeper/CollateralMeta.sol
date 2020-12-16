// SPDX-License-Identifier: MIT
pragma solidity ^0.6.12;


import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

import {CollateralLib} from "./CollateralLib.sol";


contract CollateralMeta {
    using SafeMath for uint256;
    mapping(address => CollateralLib.AssetInfo) public assets;

    constructor(address[] memory _assets) public {
        for (uint8 i = 0; i < _assets.length; i++) {
            address asset = _assets[i];
            uint8 decimal = ERC20(asset).decimals();
            require(decimal <= 18, "asset decimal not supported");
            assets[asset] = CollateralLib.AssetInfo(asset, 10 ** uint256(decimal), true);
        }
    }

    // TOOD: use external or public?
    function exists(address _asset) external view returns (bool) {
        return assets[_asset].exists;
    }

    // TODO: cannot return struct
    //    function getInfo(address _asset) external view returns (CollateralLib.AssetInfo)

    function getDivisor(address _asset) external view returns (uint256) {
        CollateralLib.AssetInfo storage info = assets[_asset];
        require(info.exists, "not supported collateral asset");
        return info.divisor;
    }
}
