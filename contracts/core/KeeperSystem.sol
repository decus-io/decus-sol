// SPDX-License-Identifier: MIT
pragma solidity ^0.6.12;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";

import {CollateralToken} from "../keeper/CollateralToken.sol";
import {CollateralMeta} from "../keeper/CollateralMeta.sol";
import {IKeeperImport} from "../interface/IKeeperImport.sol";


contract KeeperSystem is AccessControl, IKeeperImport {
    using SafeMath for uint256;

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
        require(_assets.length == _amounts.length, "length not match");

        // transfer assets
        for (uint i = 0; i < _assets.length; i++) {
            require(IERC20(_assets[i]).transferFrom(_keeper, address(this), _amounts[i]), "transfer failed");
        }

        _addKeeper(_keeper, _assets, _amounts);
    }

    function _addKeeper(address _keeper, address[] calldata _assets, uint256[] calldata _amounts) internal {
        // only allow one nft per keeper
        require(collateral_token.balanceOf(_keeper) == 0, "keeper existed");

        KeeperCollateral storage keeper = keeper_collateral[_keeper];
        for (uint i = 0; i < _assets.length; i++) {
            uint256 _index = collaterals.length;
            collaterals.push(Collateral(_assets[i], _amounts[i]));
            keeper.indexes.push(_index);
        }

        uint256 _id = collateral_token.mint(_keeper);
        keeper.nft_id = _id;

        emit KeeperCreated(_keeper, _id, _assets, _amounts);
    }

    function importKeepers(address _from, address[] calldata _assets, uint256[] calldata _amounts,
        address[] calldata _keepers, uint256[] calldata _keeper_amounts) external override returns (bool success) {
        require(hasRole(KEEPER_ADMIN_ROLE, _msgSender()), "require keeper admin role");
        require(_assets.length == _amounts.length, "length not match");

        uint256 _keeper_num = _keepers.length;
        uint256 _asset_num = _assets.length;

        require(_keeper_amounts.length == _asset_num.mul(_keeper_num), "amounts length does not match");

        // check amounts match
        uint256[] memory _sum_amounts = new uint256[](_asset_num);
        for (uint i = 0; i < _keeper_num; i++) {
            uint256 base = i.mul(_asset_num);
            for (uint j = 0; j < _asset_num; j++) {
                _sum_amounts[j] = _sum_amounts[j].add(_keeper_amounts[base + j]);
            }
        }
        for (uint i = 0; i < _asset_num; i++) {
            require(_amounts[i] == _sum_amounts[i], "amounts do not match");
        }

        // transfer
        for (uint8 i = 0; i < _asset_num; i++) {
            require(IERC20(_assets[i]).transferFrom(_from, address(this), _amounts[i]), "transfer failed");
        }

        // add keeper
        for (uint i = 0; i < _keeper_num; i++) {
            uint256 base = i.mul(_asset_num);
            _addKeeper(_keepers[i], _assets, _keeper_amounts[base : base + _asset_num]);
        }

        return true;
    }

}
