// SPDX-License-Identifier: MIT

pragma solidity ^0.8.3;

import "../../core/AssetLib.sol";

contract AssetLibMock {
    AssetLib.Asset _asset;

    function setAsset(address _token, uint256 _amount) public {
        _asset.token = _token;
        _asset.amount = _amount;
    }

    function getSatoshiValue(IAssetMeta _meta) public view returns (uint256) {
        return AssetLib.getSatoshiValue(_asset, _meta);
    }
}
