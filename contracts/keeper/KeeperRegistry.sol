// SPDX-License-Identifier: MIT
pragma solidity ^0.6.12;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";

import {AssetMeta} from "../core/AssetMeta.sol";
import {KeeperNFT} from "../keeper/KeeperNFT.sol";
import {CollateralLib} from "../keeper/CollateralLib.sol";
import {IKeeperImport} from "../interface/IKeeperImport.sol";

contract KeeperRegistry is AccessControl, IKeeperImport {
    using SafeMath for uint256;
    using CollateralLib for CollateralLib.CollateralMap;

    // events
    event KeeperAdded(
        address indexed keeper,
        uint256 indexed tokenId,
        address[] btc,
        uint256[] amount
    );

    event KeeperDeleted(address indexed keeper, uint256 indexed tokenId);

    event KeeperImported(
        address indexed from,
        address[] assets,
        uint256[] amounts,
        address[] keepers,
        uint256[] keeper_amounts
    );

    event DependenciesSet(address indexed token, address indexed meta);

    // const
    bytes32 public constant KEEPER_ADMIN_ROLE = keccak256("KEEPER_ADMIN_ROLE");

    // var
    KeeperNFT collateral_token;
    AssetMeta collateral_meta;
    CollateralLib.CollateralMap keeper_collaterals;

    // view func
    function containId(uint256 _id) public view returns (bool) {
        return keeper_collaterals.containId(_id);
    }

    function getId(address keeper) public view returns (uint256) {
        // TODO: only one id is allowed
        return collateral_token.tokenOfOwnerByIndex(keeper, 0);
    }

    // write func
    constructor(address admin, address keeper_admin) public {
        _setupRole(DEFAULT_ADMIN_ROLE, admin);

        _setRoleAdmin(KEEPER_ADMIN_ROLE, DEFAULT_ADMIN_ROLE);

        _setupRole(KEEPER_ADMIN_ROLE, keeper_admin);
    }

    function setDependencies(KeeperNFT _token, AssetMeta _meta) external {
        require(hasRole(DEFAULT_ADMIN_ROLE, _msgSender()), "require admin role");

        collateral_token = _token;
        collateral_meta = _meta;

        emit DependenciesSet(address(collateral_token), address(collateral_meta));
    }

    function addKeeper(
        address _keeper,
        address[] calldata _assets,
        uint256[] calldata _amounts,
        string memory _btcPubkey
    ) external {
        // transfer assets
        for (uint256 i = 0; i < _assets.length; i++) {
            require(
                IERC20(_assets[i]).transferFrom(_keeper, address(this), _amounts[i]),
                "transfer failed"
            );
        }

        uint256 id = _addKeeper(_keeper, _assets, _amounts);

        collateral_token.setBtcPubkey(id, _btcPubkey);
    }

    function deleteKeeper(uint256 _id) external {
        require(hasRole(KEEPER_ADMIN_ROLE, _msgSender()), "require keeper admin role");

        address _keeper = collateral_token.ownerOf(_id);

        keeper_collaterals.deleteKeeper(_id, _keeper);

        collateral_token.burn(_id);

        emit KeeperDeleted(_keeper, _id);
    }

    function importKeepers(
        address _from,
        address[] calldata _assets,
        uint256[] calldata _amounts,
        address[] calldata _keepers,
        uint256[] calldata _keeper_amounts
    ) external override {
        require(hasRole(KEEPER_ADMIN_ROLE, _msgSender()), "require keeper admin role");
        require(_assets.length == _amounts.length, "length not match");

        uint256 _keeper_num = _keepers.length;
        uint256 _asset_num = _assets.length;

        require(
            _keeper_amounts.length == _asset_num.mul(_keeper_num),
            "amounts length does not match"
        );

        // check amounts match
        uint256[] memory _sum_amounts = new uint256[](_asset_num);
        for (uint256 i = 0; i < _keeper_num; i++) {
            uint256 base = i.mul(_asset_num);
            for (uint256 j = 0; j < _asset_num; j++) {
                _sum_amounts[j] = _sum_amounts[j].add(_keeper_amounts[base + j]);
            }
        }
        for (uint256 i = 0; i < _asset_num; i++) {
            require(_amounts[i] == _sum_amounts[i], "amounts do not match");
        }

        // transfer
        for (uint8 i = 0; i < _asset_num; i++) {
            require(
                IERC20(_assets[i]).transferFrom(_from, address(this), _amounts[i]),
                "transfer failed"
            );
        }

        // add keeper
        for (uint256 i = 0; i < _keeper_num; i++) {
            uint256 base = i.mul(_asset_num);
            _addKeeper(_keepers[i], _assets, _keeper_amounts[base:base + _asset_num]);
        }

        emit KeeperImported(_from, _assets, _amounts, _keepers, _keeper_amounts);
    }

    function _addKeeper(
        address _keeper,
        address[] calldata _assets,
        uint256[] calldata _amounts
    ) private returns (uint256) {
        // only allow one nft per keeper
        require(collateral_token.balanceOf(_keeper) == 0, "keeper existed");

        uint256 _id = collateral_token.mint(_keeper);

        keeper_collaterals.addKeeper(_id, _assets, _amounts, collateral_meta);

        emit KeeperAdded(_keeper, _id, _assets, _amounts);

        return _id;
    }
}
