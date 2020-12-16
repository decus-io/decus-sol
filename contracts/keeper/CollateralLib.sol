// SPDX-License-Identifier: MIT
pragma solidity ^0.6.12;


import "@openzeppelin/contracts/math/SafeMath.sol";


library CollateralLib {
    using SafeMath for uint256;

    struct AssetInfo {
        address asset;  // contract address
        uint256 divisor;  // 10 ** decimal
        bool exists;
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
