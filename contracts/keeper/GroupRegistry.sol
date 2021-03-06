// SPDX-License-Identifier: MIT
pragma solidity ^0.6.12;

import "@openzeppelin/contracts/access/AccessControl.sol";

import {GroupLib} from "./GroupLib.sol";

contract GroupRegistry is AccessControl {
    using GroupLib for GroupLib.GroupMap;

    // events
    event GroupAdded(uint256 indexed id, uint256[] keepers, string btcAddress, uint256 maxSatoshi);

    event GroupDeleted(uint256 indexed id);

    // const
    bytes32 public constant GROUP_ADMIN_ROLE = keccak256("GROUP_ADMIN_ROLE");

    // var
    GroupLib.GroupMap groups;

    constructor(address admin, address group_admin) public {
        _setupRole(DEFAULT_ADMIN_ROLE, admin);

        _setRoleAdmin(GROUP_ADMIN_ROLE, DEFAULT_ADMIN_ROLE);

        _setupRole(GROUP_ADMIN_ROLE, group_admin);
    }

    function exist(uint256 _id) external view returns (bool) {
        return groups.exist(_id);
    }

    function isGroupEmpty(uint256 _id) external view returns (bool) {
        return groups.isGroupEmpty(_id);
    }

    function getGroupAllowance(uint256 _id) external view returns (uint256) {
        return groups.getGroupAllowance(_id);
    }

    function addGroup(
        uint256 _id,
        uint256[] calldata _keepers,
        string memory _btcAddress,
        uint256 _maxSatoshi
    ) external {
        require(hasRole(GROUP_ADMIN_ROLE, _msgSender()), "require group admin role");
        // TODO: generate btc Address inside the contract?
        // TODO: verify btc address is controlled by the _keepers
        require(!groups.exist(_id), "group id already exist");

        groups.addGroup(_id, _keepers, _btcAddress, _maxSatoshi);
        emit GroupAdded(_id, _keepers, _btcAddress, _maxSatoshi);
    }

    function deleteGroup(uint256 _id) external {
        require(hasRole(GROUP_ADMIN_ROLE, _msgSender()), "require group admin role");

        // TODO: check group balance is 0

        groups.deleteGroup(_id);

        emit GroupDeleted(_id);
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
