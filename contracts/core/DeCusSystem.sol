// SPDX-License-Identifier: MIT
pragma solidity ^0.6.12;
pragma experimental ABIEncoderV2;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";

import {EBTC} from "../tokens/EBTC.sol";
import {DeCus} from "../tokens/DeCus.sol";
import {BTCUtils} from "../utils/BTCUtils.sol";
import {SignatureValidator} from "../utils/SignatureValidator.sol";
import {LibRequest} from "../utils/LibRequest.sol";

// TODO: refactor to import interface only
import {GroupRegistry} from "../keeper/GroupRegistry.sol";
import {ReceiptController} from "../user/ReceiptController.sol";
import {KeeperRegistry} from "../keeper/KeeperRegistry.sol";

contract DeCusSystem is AccessControl, Pausable, SignatureValidator {
    using SafeMath for uint256;

    event MintRequested(
        uint256 indexed groupId,
        uint256 indexed receiptId,
        address indexed from,
        uint256 amountInSatoshi
    );
    event CancelMintRequest(uint256 indexed receiptId);
    event MintVerified(uint256 indexed receiptId);
    event BurnRequested(uint256 indexed receiptId, address indexed user, string btcAddress);
    event Cooldown(address indexed keeper, uint256 endTime);

    // const
    uint256 public constant MINT_REQUEST_GRACE_PERIOD = 24 hours;
    bytes32 public constant GROUP_ADMIN_ROLE = keccak256("GROUP_ADMIN_ROLE");
    uint256 public constant KEEPER_COOLDOWN = 10 minutes;

    EBTC public ebtc;
    GroupRegistry public groupRegistry;
    KeeperRegistry public keeperRegistry;
    ReceiptController public receiptController;
    mapping(uint256 => bool) mintVerified; // receipt id

    mapping(address => uint256) public cooldownUntil;

    constructor() public {
        _setupRole(DEFAULT_ADMIN_ROLE, _msgSender());

        _setupRole(GROUP_ADMIN_ROLE, _msgSender());
    }

    function setDependencies(
        EBTC _ebtc,
        KeeperRegistry _keeperRegistry,
        GroupRegistry _groupRegistry,
        ReceiptController _receipts
    ) external onlyDefaultAdmin {
        // TODO: add timelock
        ebtc = _ebtc;
        keeperRegistry = _keeperRegistry;
        groupRegistry = _groupRegistry;
        receiptController = _receipts;
    }

    function addGroup(
        uint256 required,
        uint256 maxSatoshi,
        string memory btcAddress,
        address[] calldata keepers
    ) public {
        require(hasRole(GROUP_ADMIN_ROLE, _msgSender()), "require admin role");

        uint256 minSatoshi = groupRegistry.minKeeperSatoshi();
        for (uint256 i = 0; i < keepers.length; i++) {
            require(
                keeperRegistry.getSatoshiValue(keepers[i]) >= minSatoshi,
                "keepre has not enough collaterl"
            );
        }

        groupRegistry.addGroup(required, maxSatoshi, btcAddress, keepers);
    }

    function deleteGroup(uint256 _id) public {
        require(hasRole(GROUP_ADMIN_ROLE, _msgSender()), "require admin role");
        // TODO: check group has no asset
        groupRegistry.deleteGroup(_id);
    }

    function noAvailableGroup() public view returns (bool) {
        uint256 nGroup = groupRegistry.nGroups();
        for (uint256 i = 1; i < nGroup + 1; i++) {
            if (receiptController.isGroupAvailable(i)) {
                return false;
            }
        }
        return true;
    }

    function forceMintRequest(uint256 _groupId, uint256 _amountInSatoshi) public {
        // Use this function if we want to override a working group
        uint256 _receiptId = receiptController.getWorkingReceiptId(_groupId);
        require(receiptController.isStale(_receiptId), "group is occupied within grace period");
        require(noAvailableGroup(), "There are available groups in registry to request");

        receiptController.revokeRequest(_receiptId);

        mintRequest(_groupId, _amountInSatoshi);
    }

    function mintRequest(uint256 _groupId, uint256 _amountInSatoshi) public {
        // * check group has enough allowance
        // * generate receipt to fill all allowance
        // TODO: [OPTIONAL] user needs to deposit eth, eth will be returned once the mint request is done
        require(_amountInSatoshi > 0, "amount 0 is not allowed");
        require(_groupId != 0, "group id 0 is not allowed");
        require(
            groupRegistry.getGroupAllowance(_groupId) == _amountInSatoshi,
            "receipt need to fill all allowance"
        );

        uint256 _receiptId =
            receiptController.depositRequest(_msgSender(), _groupId, _amountInSatoshi);

        emit MintRequested(_groupId, _receiptId, _msgSender(), _amountInSatoshi);
    }

    function verifyMint(
        LibRequest.MintRequest memory request,
        address[] calldata keepers, // keepers must be in ascending orders
        bytes32[] calldata r,
        bytes32[] calldata s,
        uint256 packedV
    ) public {
        // any one can submit proof of deposit
        require(!mintVerified[request.receiptId], "receipt already verified");

        _verifyDeposit(request.receiptId, request, keepers, r, s, packedV);
        mintVerified[request.receiptId] = true;

        _approveDeposit(request.receiptId, request.txId, request.height);

        _mintToUser(request.receiptId);

        emit MintVerified(request.receiptId);
    }

    // function revokeMintRequest(uint256 _receiptId, uint256 _keeperId) public {
    //     // Originated from keepers, to revoke an unfinished request
    //     uint256 _groupId = receiptController.getGroupId(_receiptId);

    //     require(groupRegistry.isGroupKeeper(_groupId, _keeperId), "only keeper within the group");

    //     _revoke(_groupId, _receiptId);

    //     // TODO: emit event
    //     // User get ETH refunded
    // }

    function cancelMintRequest(uint256 _receiptId) public {
        // Originated from users, before verifyMint to cancel the btc deposit
        require(receiptController.getUserAddress(_receiptId) == _msgSender(), "only applicant");

        uint256 _groupId = receiptController.getGroupId(_receiptId);

        _revoke(_groupId, _receiptId);
        // TODO: get ETH refunded

        emit CancelMintRequest(_receiptId);
    }

    function _satisfyGroupKeepers(uint256 groupId, address[] calldata keepers)
        internal
        returns (bool)
    {
        uint256 required = groupRegistry.getGroupRequired(groupId);
        require(keepers.length >= required, "not enough keepers");

        uint256 cooldownTime = block.timestamp.add(KEEPER_COOLDOWN);
        address last;
        for (uint256 i = 0; i < keepers.length; i++) {
            address k = keepers[i];
            require(cooldownUntil[k] <= block.timestamp, "keeper is in cooldown");
            require(k > last, "keepers not in ascending orders");
            require(groupRegistry.isGroupKeeper(groupId, k), "keeper is not in group");

            _cooldown(k, cooldownTime);
            last = k;
        }
        return true;
    }

    function _verifyDeposit(
        uint256 receiptId,
        LibRequest.MintRequest memory request,
        address[] calldata keepers,
        bytes32[] calldata r,
        bytes32[] calldata s,
        uint256 packedV
    ) internal returns (bool) {
        require(
            receiptController.getUserAddress(receiptId) == request.recipient,
            "recipient not match"
        );
        require(
            receiptController.getAmountInSatoshi(receiptId) == request.amount,
            "receipt amount not match"
        );
        uint256 groupId = receiptController.getGroupId(receiptId);
        require(_satisfyGroupKeepers(groupId, keepers), "not satified group keepers");

        batchValidate(request, keepers, r, s, packedV);

        return true;
    }

    function _approveDeposit(
        uint256 _receiptId,
        bytes32 _txId,
        uint256 _height
    ) internal {
        receiptController.depositReceived(_receiptId, _txId, _height);

        uint256 _groupId = receiptController.getGroupId(_receiptId);

        groupRegistry.depositReceived(_groupId, receiptController.getAmountInSatoshi(_receiptId));
    }

    function _mintToUser(uint256 _receiptId) internal {
        address user = receiptController.getUserAddress(_receiptId);
        uint256 amountInSatoshi = receiptController.getAmountInSatoshi(_receiptId);
        // TODO: add fee deduction
        ebtc.mint(user, amountInSatoshi.mul(BTCUtils.getSatoshiMultiplierForEBTC()));
    }

    function _revoke(uint256 _groupId, uint256 _receiptId) internal {
        require(_groupId != 0, "group id 0 is not allowed");

        receiptController.revokeRequest(_receiptId);
    }

    function burnRequest(uint256 receiptId, string memory btcAddress) public {
        // TODO: add fee deduction
        uint256 amountInSatoshi = receiptController.getAmountInSatoshi(receiptId);
        uint256 amount = amountInSatoshi.mul(BTCUtils.getSatoshiMultiplierForEBTC());

        ebtc.burnFrom(_msgSender(), amount);

        uint256 _groupId = receiptController.getGroupId(receiptId);

        groupRegistry.withdrawRequested(_groupId, amountInSatoshi);

        receiptController.withdrawRequest(receiptId, btcAddress);

        emit BurnRequested(receiptId, msg.sender, btcAddress);
    }

    function verifyBurn(uint256 receiptId) public onlyDefaultAdmin {
        receiptController.withdrawCompleted(receiptId);
    }

    function prosecute(uint256 _receiptId) public {
        // TODO: bad behavior report
    }

    function ban(address keeper, uint256 banTime) external onlyDefaultAdmin {
        _cooldown(keeper, block.timestamp.add(banTime));
    }

    function _cooldown(address keeper, uint256 cooldownEnd) private {
        cooldownUntil[keeper] = cooldownEnd;
        emit Cooldown(keeper, cooldownEnd);
    }

    modifier onlyDefaultAdmin() {
        require(hasRole(DEFAULT_ADMIN_ROLE, msg.sender), "require admin role");
        _;
    }
}
