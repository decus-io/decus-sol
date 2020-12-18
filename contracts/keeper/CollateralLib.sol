// SPDX-License-Identifier: MIT
pragma solidity ^0.6.12;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";


library CollateralLib {
    using SafeMath for uint256;

    struct AssetInfo {
        address asset;  // contract address
        uint256 divisor;  // 10 ** decimal
        bool exists;
    }

    // struct
    struct CollateralAsset {
        address asset;
        uint256 amount;
    }

    struct KeeperCollateral {
        uint256[] indexes;
        bool exists;
    }

    struct CollateralMap {
        CollateralAsset[] assets;
        mapping(uint256 => KeeperCollateral) data;  // nft to collateral
    }

    function addKeeper(CollateralMap storage _map, uint256 _id, address[] calldata _assets, uint256[] calldata _amounts) internal {
        require(_assets.length == _amounts.length, "length not match");

        KeeperCollateral storage keeper = _map.data[_id];
        require(!keeper.exists, "nft id already exist");

        for (uint i = 0; i < _assets.length; i++) {
            uint256 _index = _map.assets.length;
            _map.assets.push(CollateralAsset(_assets[i], _amounts[i]));
            keeper.indexes.push(_index);
        }
        keeper.exists = true;
    }

    function deleteKeeper(CollateralMap storage _map, uint256 _id, address _recipient) internal {
        KeeperCollateral storage keeper = _map.data[_id];
        require(keeper.exists, "nft id not exist");

        for (uint i = 0; i < keeper.indexes.length; i++) {
            CollateralAsset storage _a = _map.assets[keeper.indexes[i]];
            IERC20(_a.asset).approve(_recipient, _a.amount);
        }
        delete _map.data[_id];
        // TODO: make sure it clear the indexes
    }

    function contain_id(CollateralMap storage _map, uint256 _id) internal view returns (bool) {
        return _map.data[_id].exists;
    }


    //    struct CollateralRaw {
    //        address asset;
    //        uint256 amount;
    //    }
    //
    //    struct Collateral {
    //        bytes32 quote;  // e.g. BTC
    //        uint256 value;  // in quote
    //    }
    //
    //    function fromCollateralRaw(CollateralRaw storage _c) public view returns (uint256) {
    //        uint256 decimal = 8;
    //        return (_c.amount).div(10 ** decimal);
    //    }

    //    function collateralInBtc(Collateral storage _c) public view returns (uint256) {
    //        return ;
    //    }
}
