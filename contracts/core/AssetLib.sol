// SPDX-License-Identifier: MIT
pragma solidity ^0.8.3;

import {IAssetMeta} from "../interface/IAssetMeta.sol";

library AssetLib {
    struct Asset {
        address token;
        uint256 amount;
    }

    function getSatoshiValue(Asset storage _asset, IAssetMeta _meta)
        internal
        view
        returns (uint256)
    {
        return _asset.amount / _meta.getSatoshiDivisor(_asset.token);
    }
}
