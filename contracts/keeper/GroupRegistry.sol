// SPDX-License-Identifier: MIT
pragma solidity ^0.6.12;

import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

import {GroupLib} from "./GroupLib.sol";

contract GroupRegistry is AccessControl {
    using GroupLib for GroupLib.GroupMap;
    using Counters for Counters.Counter;
    using SafeMath for uint256;

    // events
    event GroupAdded(
        uint256 indexed id,
        uint256 required,
        uint256 maxSatoshi,
        string btcAddress,
        address[] keepers
    );

    event GroupDeleted(uint256 indexed id);

    // const
    bytes32 public constant GROUP_ADMIN_ROLE = keccak256("GROUP_ADMIN_ROLE");

    // var
    Counters.Counter private _id_gen;
    GroupLib.GroupMap groups;
    mapping(string => uint256) address2id; // id starts from 1

    constructor() public {
        _setupRole(DEFAULT_ADMIN_ROLE, _msgSender());

        _id_gen.increment(); // group id starts from 1
    }

    function nGroups() external view returns (uint256) {
        return groups.nGroups();
    }

    function exist(uint256 _id) external view returns (bool) {
        return groups.exist(_id);
    }

    function isGroupKeeper(uint256 _id, address _keeper) external view returns (bool) {
        return groups.isGroupKeeper(_id, _keeper);
    }

    function getGroupInfo(uint256 _id)
        external
        view
        returns (
            uint256 required,
            uint256 maxSatoshi,
            uint256 currSatoshi,
            string memory btcAddress,
            address[] memory keepers
        )
    {
        return groups.getGroupInfo(_id);
    }

    function getKeeperGroups(address _keeper, uint256 _start) external view returns (uint256) {
        return groups.getKeeperGroups(_keeper, _start);
    }

    function getGroupKeepers(uint256 _id) external view returns (address[] memory) {
        return groups.getGroupKeepers(_id);
    }

    function getGroupAllowance(uint256 _id) external view returns (uint256) {
        return groups.getGroupAllowance(_id);
    }

    function getGroupRequired(uint256 _id) external view returns (uint256) {
        return groups.getGroupRequired(_id);
    }

    function getGroupId(string memory _btcAddress) external view returns (uint256) {
        return address2id[_btcAddress];
    }

    function addGroup(
        uint256 _required,
        uint256 _maxSatoshi,
        string memory _btcAddress,
        address[] calldata _keepers
    ) external returns (uint256) {
        require(hasRole(GROUP_ADMIN_ROLE, _msgSender()), "require group admin role");
        // TODO: verify btc address is controlled by the _keepers

        uint256 _id = _new_id(_btcAddress);
        groups.addGroup(_id, _required, _maxSatoshi, _btcAddress, _keepers);
        emit GroupAdded(_id, _required, _maxSatoshi, _btcAddress, _keepers);
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
        require(_id != 0, "group id 0 is not allowed");

        // TODO: check group balance is 0

        groups.deleteGroup(_id);

        emit GroupDeleted(_id);
    }

    function depositReceived(uint256 _id, uint256 _amountInSatoshi) external {
        require(hasRole(GROUP_ADMIN_ROLE, _msgSender()), "require group admin role");
        require(_id != 0, "group id 0 is not allowed");

        groups.addGroupSatoshi(_id, _amountInSatoshi);
    }

    function withdrawRequested(uint256 _id, uint256 _amountInSatoshi) external {
        require(hasRole(GROUP_ADMIN_ROLE, _msgSender()), "require group admin role");
        require(_id != 0, "group id 0 is not allowed");

        groups.removeGroupSatoshi(_id, _amountInSatoshi);
    }
}
