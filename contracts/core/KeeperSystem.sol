// SPDX-License-Identifier: MIT
pragma solidity ^0.6.12;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

import {CollateralToken} from "../keeper/CollateralToken.sol";
import {CollateralMeta} from "../keeper/CollateralMeta.sol";


contract KeeperSystem is AccessControl {
    // events
    event KeeperCreated(address indexed keeper, uint256 indexed tokenId, address[] btc, uint256[] amount);

    event DependenciesSet(address indexed token, address indexed meta);

    // struct
    struct Collateral {
        address asset;
        uint256 amount;
    }

    struct KeeperCollateral {
        uint256[] indexes;
        uint256 nft_id;
        bool exists;
    }

    // const
    bytes32 public constant KEEPER_ADMIN_ROLE = keccak256("KEEPER_ADMIN_ROLE");


    // var
    CollateralToken collateral_token;
    CollateralMeta collateral_meta;
    Collateral[] public collaterals;
    mapping(address => KeeperCollateral) public keeper_collateral;


    //func
    constructor(address admin, address keeper_admin) public {
        _setupRole(DEFAULT_ADMIN_ROLE, admin);

        _setRoleAdmin(KEEPER_ADMIN_ROLE, DEFAULT_ADMIN_ROLE);

        _setupRole(KEEPER_ADMIN_ROLE, keeper_admin);
    }

    function setDependencies(CollateralToken _token, CollateralMeta _meta) external {
        require(hasRole(DEFAULT_ADMIN_ROLE, _msgSender()), "require admin role");

        collateral_token = _token;
        collateral_meta = _meta;

        emit DependenciesSet(address(collateral_token), address(collateral_meta));
    }

    function addKeeper(address _keeper, address[] calldata _assets, uint256[] calldata _amounts) external {
        require(hasRole(KEEPER_ADMIN_ROLE, _msgSender()), "require keeper admin role");

        // only allow one nft per keeper
        require(collateral_token.balanceOf(_keeper) == 0, "keeper existed");

        // sanity check
        require(_assets.length == _amounts.length, "length not match");

        // 1. transfer btc to this account 2. save btc info
        KeeperCollateral storage keeper = keeper_collateral[_keeper];
        for (uint8 i = 0; i < _assets.length; i++) {
            require(ERC20(_assets[i]).transferFrom(_keeper, address(this), _amounts[i]), "transfer failed");
            uint _index = _addCollateral(_assets[i], _amounts[i]);
            keeper.indexes.push(_index);
        }

        uint256 _id = collateral_token.mint(_keeper);
        keeper.nft_id = _id;

        emit KeeperCreated(_keeper, _id, _assets, _amounts);
    }

    function _addCollateral(address _asset, uint256 _amount) internal returns (uint256) {
        uint256 index = collaterals.length;
        collaterals.push(Collateral(_asset, _amount));
        return index;
    }

    //    function addKeeperBatch() external {
    //        // TODO: 0. correct input param 1. transfer btc in batch. 2. save keeper info
    //    }

}
