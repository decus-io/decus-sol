// SPDX-License-Identifier: MIT
pragma solidity >=0.6.0 <0.8.0;

library BTCUtils {
    uint256 public constant BTC_DECIMAL = 8;

    //    function getBTCDecimal() external pure returns (uint256) { return BTC_DECIMAL; }

    function getSatoshiMultiplierForEBTC() internal pure returns (uint256) {
        return 10**10;
    }

    function getSatoshiDivisor(uint256 decimal) internal pure returns (uint256) {
        require(decimal >= BTC_DECIMAL, "asset decimal not supported");

        uint256 res = 10**uint256(decimal - BTC_DECIMAL);
        require(res > 0, "Power overflow");

        return res;
    }
}
