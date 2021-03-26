// SPDX-License-Identifier: MIT
pragma solidity ^0.6.12;
pragma experimental ABIEncoderV2;

import "@openzeppelin/contracts/math/SafeMath.sol";

library GroupLib {
    using SafeMath for uint256;

    struct Group {
        uint256 id;
        uint256 required;
        uint256 maxSatoshi;
        uint256 currSatoshi;
        string btcAddress;
        address[] keepers;
    }

    function allowance(Group storage _group) internal view returns (uint256) {
        return _group.maxSatoshi.sub(_group.currSatoshi);
    }

    using GroupLib for GroupLib.Group;

    struct GroupMap {
        Group[] groups;
        mapping(uint256 => uint256) id2index;
    }

    using GroupLib for GroupLib.GroupMap;

    function exist(GroupMap storage _map, uint256 _id) internal view returns (bool) {
        return _map.id2index[_id] != 0;
    }

    function nGroups(GroupMap storage _map) internal view returns (uint256) {
        return _map.groups.length;
    }

    function getKeeperGroups(
        GroupMap storage _map,
        address _keeper,
        uint256 _start
    ) internal view returns (uint256) {
        uint256 res;
        for (uint256 i = _start; i < _map.groups.length; i++) {
            if (i - _start >= 256) {
                break;
            }
            uint256 _groupId = _map.groups[i].id;
            if (isGroupKeeper(_map, _groupId, _keeper)) {
                res |= (1 << (i - _start));
            }
        }
        return res;
    }

    function getGroupInfo(GroupMap storage _map, uint256 _id) internal view returns (Group memory) {
        return _map.groups[_map.id2index[_id] - 1];
    }

    function isGroupEmpty(GroupMap storage _map, uint256 _id) internal view returns (bool) {
        return _map.groups[_map.id2index[_id] - 1].currSatoshi == 0;
    }

    function isGroupKeeper(
        GroupMap storage _map,
        uint256 _id,
        address _keeper
    ) internal view returns (bool) {
        address[] memory keepers = _map.groups[_map.id2index[_id] - 1].keepers;
        for (uint256 i = 0; i < keepers.length; i++) {
            if (keepers[i] == _keeper) {
                return true;
            }
        }

        return false;
    }

    function getGroupKeepers(GroupMap storage _map, uint256 _id)
        internal
        view
        returns (address[] memory)
    {
        return _map.groups[_map.id2index[_id] - 1].keepers;
    }

    function getGroupAllowance(GroupMap storage _map, uint256 _id) internal view returns (uint256) {
        return _map.groups[_map.id2index[_id] - 1].allowance();
    }

    function getGroupRequired(GroupMap storage _map, uint256 _id) internal view returns (uint256) {
        return _map.groups[_map.id2index[_id] - 1].required;
    }

    function addGroupSatoshi(
        GroupMap storage _map,
        uint256 _id,
        uint256 amountSatoshi
    ) internal {
        Group storage g = _map.groups[_map.id2index[_id] - 1];
        uint256 _currSatoshi = g.currSatoshi.add(amountSatoshi);
        require(_currSatoshi <= g.maxSatoshi, "amount exceed max allowance");
        g.currSatoshi = _currSatoshi;
    }

    function removeGroupSatoshi(
        GroupMap storage _map,
        uint256 _id,
        uint256 amountSatoshi
    ) internal {
        Group storage g = _map.groups[_map.id2index[_id] - 1];
        g.currSatoshi = g.currSatoshi.sub(amountSatoshi);
        // SafeMath ensures no overflow
    }

    function fillGroupSatoshi(GroupMap storage _map, uint256 _id) internal {
        Group storage g = _map.groups[_map.id2index[_id] - 1];
        require(g.currSatoshi == 0, "currSatoshi is not empty");
        g.currSatoshi = g.maxSatoshi;
    }

    function emptyGroupSatoshi(GroupMap storage _map, uint256 _id) internal {
        Group storage g = _map.groups[_map.id2index[_id] - 1];
        require(g.currSatoshi == g.maxSatoshi, "currSatoshi is not full");
        g.currSatoshi = 0;
    }

    function addGroup(
        GroupMap storage _map,
        uint256 _id,
        uint256 _required,
        uint256 _maxSatoshi,
        string memory _btcAddress,
        address[] calldata _keepers
    ) internal {
        // similar to openzeppelin EnumerableMap implementation
        uint256 keyIndex = _map.id2index[_id];
        require(keyIndex == 0, "group id already exist");
        // TODO: check btc address duplication

        _map.groups.push(
            Group({
                id: _id,
                required: _required,
                maxSatoshi: _maxSatoshi,
                currSatoshi: 0,
                btcAddress: _btcAddress,
                keepers: _keepers
            })
        );

        _map.id2index[_id] = _map.groups.length;
    }

    function deleteGroup(GroupMap storage _map, uint256 _id) internal {
        // similar to openzeppelin EnumerableMap implementation
        uint256 keyIndex = _map.id2index[_id];
        require(keyIndex > 0, "group id not exist");

        uint256 toDeleteIndex = keyIndex - 1;
        uint256 lastIndex = _map.groups.length - 1;

        Group storage lastEntry = _map.groups[lastIndex];

        _map.groups[toDeleteIndex] = lastEntry;
        _map.id2index[lastEntry.id] = toDeleteIndex + 1;

        _map.groups.pop();
        delete _map.id2index[_id];
    }

    function setMaxSatoshi(
        GroupMap storage _map,
        uint256 _index,
        uint256 _maxSatoshi
    ) internal {
        Group storage g = _map.groups[_index];
        // TODO: require _maxSatoshi > _map.groups[i].currSatoshi?
        require(g.currSatoshi == 0, "require empty holding");
        // to guarantee only one utxo for each group
        g.maxSatoshi = _maxSatoshi;
    }

    function setMaxSatoshiAll(GroupMap storage _map, uint256 _maxSatoshi) internal {
        for (uint256 i = 0; i < _map.groups.length; i++) {
            _map.setMaxSatoshi(i, _maxSatoshi);
        }
    }
}
