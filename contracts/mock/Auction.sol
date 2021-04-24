// SPDX-License-Identifier: MIT
pragma solidity ^0.8.3;

import {IKeeperImport} from "../interface/IKeeperImport.sol";
import {WBTC, HBTC} from "./external/MockBTC.sol";

contract Auction {
    IKeeperImport keeper_contract;
    address[] assets;

    constructor(IKeeperImport _contract, address[] memory _assets) {
        keeper_contract = _contract;
        assets = _assets;
    }

    function end() external {
        //        keeper_contract.importKeepers(address(this), assets, );
    }
}
