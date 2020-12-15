// SPDX-License-Identifier: MIT
pragma solidity ^0.6.12;

import "@openzeppelin/contracts/access/AccessControl.sol";

import {CollateralToken} from "../keeper/CollateralToken.sol";


contract KeeperSystem is AccessControl {
    bytes32 public constant KEEPER_ADMIN_ROLE = keccak256("KEEPER_ADMIN_ROLE");

    event KeeperCreated(address indexed keeper, uint256 indexed tokenId, address[] btc, uint256[] amount);

    event DependenciesSet(address indexed collateral_token);

    CollateralToken collateral_token;

    constructor(address admin, address keeper_admin) public {
        _setupRole(DEFAULT_ADMIN_ROLE, admin);

        _setRoleAdmin(KEEPER_ADMIN_ROLE, DEFAULT_ADMIN_ROLE);

        _setupRole(KEEPER_ADMIN_ROLE, keeper_admin);
    }

    function setDependencies(CollateralToken _collateral_token) external {
        require(hasRole(DEFAULT_ADMIN_ROLE, _msgSender()), "require admin role");

        collateral_token = _collateral_token;

        emit DependenciesSet(address(collateral_token));
    }

    function addKeeper(address keeper, address[] calldata btc, uint256[] calldata amount) external {
        require(hasRole(KEEPER_ADMIN_ROLE, _msgSender()), "require keeper admin role");
        // TODO: require no duplicate keeper

        uint256 id = collateral_token.mint(keeper);
        // TODO: 1. transfer btc to this account 2. save btc info,

        emit KeeperCreated(keeper, id, btc, amount);
    }

    //    function addKeeperBatch() external {
    //        // TODO: 0. correct input param 1. transfer btc in batch. 2. save keeper info
    //    }

}
