// SPDX-License-Identifier: MIT
pragma solidity ^0.6.12;

import {NFTBase} from "./NFTBase.sol";


contract KeeperNFT is NFTBase {
    constructor (address minter)
    public NFTBase("Keeper Collateral Token", "KCT", minter) {
    }
}
