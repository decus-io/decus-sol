// SPDX-License-Identifier: MIT

pragma solidity >=0.6.0 <0.8.0;

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

    function isGroupKeeper(uint256 _id, uint256 _keeperId) public view returns (bool) {
        return GroupLib.isGroupKeeper(_map, _id, _keeperId);
    }

    function nGroups() public view returns (uint256) {
        return GroupLib.nGroups(_map);
    }

    function getGroupInfo(uint256 _id)
        public
        view
        returns (
            uint256 maxSatoshi,
            uint256 currSatoshi,
            uint256 lastWithdrawTimestamp,
            string memory btcAddress,
            uint256[] memory keepers
        )
    {
        return GroupLib.getGroupInfo(_map, _id);
    }

    function getKeeperGroups(uint256 _keeperId, uint256 _start) public view returns (uint256) {
        return GroupLib.getKeeperGroups(_map, _keeperId, _start);
    }

    function getGroupKeepers(uint256 _id) public view returns (uint256[] memory) {
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
        uint256[] calldata _keepers,
        string memory _btcAddress,
        uint256 _maxSatoshi
    ) public {
        return GroupLib.addGroup(_map, _id, _keepers, _btcAddress, _maxSatoshi);
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
