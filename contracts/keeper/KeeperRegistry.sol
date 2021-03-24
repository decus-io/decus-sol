// SPDX-License-Identifier: MIT
pragma solidity ^0.6.12;
pragma experimental ABIEncoderV2;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";

import {AssetMeta} from "../core/AssetMeta.sol";
import {CollateralLib} from "../keeper/CollateralLib.sol";
import {IKeeperImport} from "../interface/IKeeperImport.sol";

contract KeeperRegistry is AccessControl, IKeeperImport {
    using SafeMath for uint256;
    using CollateralLib for CollateralLib.CollateralMap;

    struct Context {
        uint256 base;
        uint256 assetLength;
    }

    // events
    event KeeperAdded(address indexed keeper, address[] btc, uint256[] amount);

    event KeeperDeleted(address indexed keeper);

    event KeeperImported(
        address indexed from,
        address[] assets,
        uint256[] amounts,
        address[] keepers,
        uint256[] keeper_amounts
    );

    event DependenciesSet(address indexed meta);

    // const
    bytes32 public constant KEEPER_ADMIN_ROLE = keccak256("KEEPER_ADMIN_ROLE");

    // var
    AssetMeta public asset_meta;
    CollateralLib.CollateralMap collaterals;

    // view func
    function exist(address _keeper) public view returns (bool) {
        return collaterals.exist(_keeper);
    }

    // write func
    constructor() public {
        _setupRole(DEFAULT_ADMIN_ROLE, _msgSender());

        _setRoleAdmin(KEEPER_ADMIN_ROLE, DEFAULT_ADMIN_ROLE);
    }

    function setDependencies(AssetMeta _meta) external {
        require(hasRole(DEFAULT_ADMIN_ROLE, _msgSender()), "require admin role");

        asset_meta = _meta;

        emit DependenciesSet(address(asset_meta));
    }

    function addKeeper(
        address _keeper,
        address[] calldata _assets,
        uint256[] calldata _amounts
    ) external {
        // transfer assets
        for (uint256 i = 0; i < _assets.length; i++) {
            require(
                IERC20(_assets[i]).transferFrom(_keeper, address(this), _amounts[i]),
                "transfer failed"
            );
        }

        _addKeeper(_keeper, _assets, _amounts);
    }

    function deleteKeeper(address _keeper) external {
        // require admin role because we need to make sure keeper is not in any working groups
        require(hasRole(KEEPER_ADMIN_ROLE, _msgSender()), "require keeper admin role");

        collaterals.deleteKeeper(_keeper);

        emit KeeperDeleted(_keeper);
    }

    function importKeepers(
        address _from,
        address[] calldata _assets,
        address[] calldata _keepers,
        uint256[] calldata _keeper_amounts
    ) external override {
        Context memory context = Context({base: 0, assetLength: _assets.length});

        require(
            _keeper_amounts.length == context.assetLength.mul(_keepers.length),
            "amounts length does not match"
        );

        // check amounts match
        uint256[] memory _sum_amounts = new uint256[](context.assetLength);
        for (uint256 i = 0; i < _keepers.length; i++) {
            uint256 base = i.mul(context.assetLength);
            for (uint256 j = 0; j < context.assetLength; j++) {
                _sum_amounts[j] = _sum_amounts[j].add(_keeper_amounts[base + j]);
            }
        }

        // transfer
        for (uint8 i = 0; i < context.assetLength; i++) {
            require(
                IERC20(_assets[i]).transferFrom(_from, address(this), _sum_amounts[i]),
                "transfer failed"
            );
        }

        // add keeper
        for (uint256 i = 0; i < _keepers.length; i++) {
            context.base = i.mul(context.assetLength);
            _addKeeper(
                _keepers[i],
                _assets,
                _keeper_amounts[context.base:context.base + context.assetLength]
            );
        }

        emit KeeperImported(_from, _assets, _sum_amounts, _keepers, _keeper_amounts);
    }

    function _addKeeper(
        address _keeper,
        address[] calldata _assets,
        uint256[] calldata _amounts
    ) private {
        // only allow one nft per keeper
        require(!collaterals.exist(_keeper), "keeper existed");

        collaterals.addKeeper(_keeper, _assets, _amounts, asset_meta);

        emit KeeperAdded(_keeper, _assets, _amounts);
    }
}
