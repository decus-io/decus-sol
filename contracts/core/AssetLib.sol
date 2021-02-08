// SPDX-License-Identifier: MIT
pragma solidity >=0.6.0 <0.8.0;

import "@openzeppelin/contracts/math/SafeMath.sol";

import {IAssetMeta} from "../interface/IAssetMeta.sol";

library AssetLib {
    using SafeMath for uint256;

    struct Asset {
        address token;
        uint256 amount;
    }

    function getSatoshiValue(Asset storage _asset, IAssetMeta _meta)
        internal
        view
        returns (uint256)
    {
        return _asset.amount.div(_meta.getSatoshiDivisor(_asset.token));
    }
}
