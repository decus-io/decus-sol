// SPDX-License-Identifier: MIT
pragma solidity ^0.6.12;

import {GroupRegistry} from "../keeper/GroupRegistry.sol";
import {KeeperRegistry} from "../keeper/KeeperRegistry.sol";

import "../interface/ERC20Mintable.sol";

contract GroupMinter {
    event Submission(bytes32 indexed txid);
    event Confirmation(address indexed keeper, bytes32 indexed txid);
    event Revocation(address indexed keeper, bytes32 indexed txid);
    event Minted(bytes32 indexed txid);

    struct MintData {
        uint256 groupId;
        address destination;
        uint8 voutIndex;
        uint256 value;
        bool minted;
    }

    // txid => MintData
    // only one mint request on one bitcoin transaction
    mapping(bytes32 => MintData) mintData;
    mapping(bytes32 => mapping(uint256 => bool)) confirmations;

    modifier onlyGroupMember(uint256 _groupId, address _keeper) {
        require(_groupId != 0, "error group");
        uint256 keeperId = keepers.getId(_keeper);
        if (keeperId == 0 || !groups.isGroupMember(_groupId, keeperId)) {
            revert("not group member");
        }
        _;
    }

    modifier onlyConfirmer(bytes32 _txid, address _keeper) {
        uint256 _groupId = mintData[_txid].groupId;
        if (_groupId == 0) {
            revert("mint data not exists");
        }
        uint256 keeperId = keepers.getId(_keeper);
        if (keeperId == 0 || !groups.isGroupMember(_groupId, keeperId)) {
            revert("not group member");
        }
        _;
    }

    modifier notConfirmed(bytes32 _txid, address _keeper) {
        if (confirmations[_txid][keepers.getId(_keeper)]) {
            revert("already confirmed");
        }
        _;
    }

    modifier confirmed(bytes32 _txid, address _keeper) {
        if (!confirmations[_txid][keepers.getId(_keeper)]) {
            revert("not confirm");
        }
        _;
    }

    modifier notNull(address _address) {
        if (_address == address(0)) {
            revert("addresss is zero");
        }
        _;
    }

    ERC20Mintable public token;
    GroupRegistry groups;
    KeeperRegistry keepers;

    constructor(
        ERC20Mintable _token,
        GroupRegistry _groups,
        KeeperRegistry _keepers
    ) public {
        token = _token;
        groups = _groups;
        keepers = _keepers;
    }

    function isMintDataExists(bytes32 _txid) public view returns (bool) {
        return mintData[_txid].groupId != 0;
    }

    function isConfirmed(bytes32 _txid) public view returns (bool) {
        uint256 groupId = mintData[_txid].groupId;
        if (groupId == 0) {
            return false;
        }

        uint256[] memory _keepers = groups.keepers(groupId);
        uint256 count = 0;
        for (uint256 i = 0; i < _keepers.length; i++) {
            if (confirmations[_txid][_keepers[i]]) {
                count += 1;
            }
            if (count * 2 > _keepers.length) {
                return true;
            }
        }
        return false;
    }

    function isMinted(bytes32 _txid) public view returns (bool) {
        return mintData[_txid].minted;
    }

    function getMintData(bytes32 _txid)
        external
        view
        returns (
            uint256 groupId,
            address destination,
            uint8 voutIndex,
            uint256 value,
            bool minted
        )
    {
        MintData storage data = mintData[_txid];
        return (data.groupId, data.destination, data.voutIndex, data.value, data.minted);
    }

    function add(
        uint256 _groupId,
        address _destination,
        bytes32 _txid,
        uint8 _index,
        uint256 _value
    ) public notNull(_destination) onlyGroupMember(_groupId, msg.sender) {
        require(!isMintDataExists(_txid), "mint data exists");
        mintData[_txid] = MintData({
            groupId: _groupId,
            destination: _destination,
            voutIndex: _index,
            value: _value,
            minted: false
        });
        emit Submission(_txid);
    }

    function confirm(bytes32 _txid)
        public
        onlyConfirmer(_txid, msg.sender)
        notConfirmed(_txid, msg.sender)
    {
        require(isMintDataExists(_txid), "mint data not exists");
        confirmations[_txid][keepers.getId(msg.sender)] = true;
        emit Confirmation(msg.sender, _txid);
        execute(_txid);
    }

    function revoke(bytes32 _txid)
        public
        onlyConfirmer(_txid, msg.sender)
        confirmed(_txid, msg.sender)
    {
        require(!isMinted(_txid), "already minted");
        confirmations[_txid][keepers.getId(msg.sender)] = false;
        Revocation(msg.sender, _txid);
    }

    function execute(bytes32 _txid) public {
        require(!isMinted(_txid), "already minted");
        if (isConfirmed(_txid)) {
            MintData storage data = mintData[_txid];
            token.mint(data.destination, data.value);
            emit Minted(_txid);
        }
    }

    function submit(
        uint256 _groupId,
        address _destination,
        bytes32 _txid,
        uint8 _index,
        uint256 _value
    ) public {
        add(_groupId, _destination, _txid, _index, _value);
        confirm(_txid);
    }
}
