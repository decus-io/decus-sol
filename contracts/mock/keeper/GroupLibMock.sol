// SPDX-License-Identifier: MIT

pragma solidity ^0.8.3;

import {IAssetMeta} from "../../interface/IAssetMeta.sol";
import {GroupLib} from "../../keeper/GroupLib.sol";
import {AssetLib} from "../../core/AssetLib.sol";

contract GroupLibMock {
    GroupLib.GroupMap _map;

    function exist(uint256 _id) public view returns (bool) {
        return GroupLib.exist(_map, _id);
    }

    function isGroupEmpty(uint256 _id) public view returns (bool) {
        return GroupLib.isGroupEmpty(_map, _id);
    }

    function isGroupKeeper(uint256 _id, address _keeper) public view returns (bool) {
        return GroupLib.isGroupKeeper(_map, _id, _keeper);
    }

    function nGroups() public view returns (uint256) {
        return GroupLib.nGroups(_map);
    }

    function getGroupInfo(uint256 _id) public view returns (GroupLib.Group memory) {
        return GroupLib.getGroupInfo(_map, _id);
    }

    function getKeeperGroupIds(address _keeper) public view returns (uint256[] memory) {
        return GroupLib.getKeeperGroupIds(_map, _keeper);
    }

    function getKeeperGroups(address _keeper, uint256 _start) public view returns (uint256) {
        return GroupLib.getKeeperGroups(_map, _keeper, _start);
    }

    function getGroupKeepers(uint256 _id) public view returns (address[] memory) {
        return GroupLib.getGroupKeepers(_map, _id);
    }

    function getGroupAllowance(uint256 _id) public view returns (uint256) {
        return GroupLib.getGroupAllowance(_map, _id);
    }

    function addGroupSatoshi(uint256 _id, uint256 amountSatoshi) public {
        GroupLib.addGroupSatoshi(_map, _id, amountSatoshi);
    }

    function removeGroupSatoshi(uint256 _id, uint256 amountSatoshi) public {
        GroupLib.removeGroupSatoshi(_map, _id, amountSatoshi);
    }

    function fillGroupSatoshi(uint256 _id) public {
        GroupLib.fillGroupSatoshi(_map, _id);
    }

    function emptyGroupSatoshi(uint256 _id) public {
        GroupLib.emptyGroupSatoshi(_map, _id);
    }

    function addGroup(
        uint256 _id,
        uint256 _required,
        uint256 _maxSatoshi,
        string memory _btcAddress,
        address[] calldata _keepers
    ) public {
        return GroupLib.addGroup(_map, _id, _required, _maxSatoshi, _btcAddress, _keepers);
    }

    function deleteGroup(uint256 _id) public {
        return GroupLib.deleteGroup(_map, _id);
    }

    function setMaxSatoshi(uint256 _index, uint256 _maxSatoshi) public {
        return GroupLib.setMaxSatoshi(_map, _index, _maxSatoshi);
    }

    function setMaxSatoshiAll(uint256 _maxSatoshi) public {
        return GroupLib.setMaxSatoshiAll(_map, _maxSatoshi);
    }
}
