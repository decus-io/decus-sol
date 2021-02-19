// SPDX-License-Identifier: MIT
pragma solidity ^0.6.12;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

import {GroupLib} from "./GroupLib.sol";

contract GroupRegistry is AccessControl {
    using GroupLib for GroupLib.GroupMap;
    using Counters for Counters.Counter;

    // events
    event GroupAdded(uint256 indexed id, uint256[] keepers, string btcAddress, uint256 maxSatoshi);

    event GroupDeleted(uint256 indexed id);

    // const
    bytes32 public constant GROUP_ADMIN_ROLE = keccak256("GROUP_ADMIN_ROLE");

    // var
    Counters.Counter private _id_gen;
    GroupLib.GroupMap groups;
    mapping(string => uint256) address2id; // id starts from 1

    constructor(address admin, address group_admin) public {
        _setupRole(DEFAULT_ADMIN_ROLE, admin);

        _setRoleAdmin(GROUP_ADMIN_ROLE, DEFAULT_ADMIN_ROLE);

        _setupRole(GROUP_ADMIN_ROLE, group_admin);

        _id_gen.increment();
    }

    function exist(uint256 _id) external view returns (bool) {
        return groups.exist(_id);
    }

    function isGroupEmpty(uint256 _id) external view returns (bool) {
        return groups.isGroupEmpty(_id);
    }

    function isGroupKeeper(uint256 _id, uint256 _keeperID) external view returns (bool) {
        return groups.isGroupKeeper(_id, _keeperID);
    }

    function getGroupAllowance(uint256 _id) external view returns (uint256) {
        return groups.getGroupAllowance(_id);
    }

    function getGroupLastTimestamp(uint256 _id) external view returns (uint256) {
        return groups.getGroupLastTimestamp(_id);
    }

    function getGroupId(string memory _btcAddress) external view returns (uint256) {
        return address2id[_btcAddress];
    }

    function addGroup(
        uint256[] calldata _keepers,
        string memory _btcAddress,
        uint256 _maxSatoshi
    ) external returns (uint256) {
        require(hasRole(GROUP_ADMIN_ROLE, _msgSender()), "require group admin role");
        // TODO: verify btc address is controlled by the _keepers

        uint256 _id = _new_id(_btcAddress);
        groups.addGroup(_id, _keepers, _btcAddress, _maxSatoshi);
        emit GroupAdded(_id, _keepers, _btcAddress, _maxSatoshi);
        return _id;
    }

    function _new_id(string memory _btcAddress) internal returns (uint256) {
        require(address2id[_btcAddress] == 0, "group address already exist");

        uint256 id = _id_gen.current();
        _id_gen.increment();
        address2id[_btcAddress] = id;
        return id;
    }

    function deleteGroup(uint256 _id) external {
        require(hasRole(GROUP_ADMIN_ROLE, _msgSender()), "require group admin role");

        // TODO: check group balance is 0

        groups.deleteGroup(_id);

        emit GroupDeleted(_id);
    }

    function emptyGroupLastTimestamp(uint256 _id) external {
        require(hasRole(GROUP_ADMIN_ROLE, _msgSender()), "require group admin role");
        groups.emptyGroupLastTimestamp(_id);
    }

    function requestReceived(uint256 _id, uint256 _lastTimestamp) external {
        require(hasRole(GROUP_ADMIN_ROLE, _msgSender()), "require group admin role");
        groups.setGroupLastTimestamp(_id, _lastTimestamp);
    }

    function depositReceived(uint256 _id, uint256 _amountInSatoshi) external {
        require(hasRole(GROUP_ADMIN_ROLE, _msgSender()), "require group admin role");
        groups.addGroupSatoshi(_id, _amountInSatoshi);
    }

    function withdrawRequested(uint256 _id, uint256 _amountInSatoshi) external {
        require(hasRole(GROUP_ADMIN_ROLE, _msgSender()), "require group admin role");
        groups.removeGroupSatoshi(_id, _amountInSatoshi);
    }
}
