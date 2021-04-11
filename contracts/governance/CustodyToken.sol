// SPDX-License-Identifier: MIT
pragma solidity ^0.6.12;

//import "github.com/OpenZeppelin/openzeppelin-contracts/contracts/math/SafeMath.sol";
//import "github.com/OpenZeppelin/openzeppelin-contracts/contracts/access/Ownable.sol";

import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

import "../interface/ICustodyToken.sol";
import "../utils/SafeDecimalMath.sol";

contract CustodyToken is ICustodyToken, Ownable {
    using SafeMath for uint256;
    using SafeDecimalMath for uint256;

    // Used for authentication
    address public monetaryPolicy;

    uint256 internal constant MAX_UINT256 = ~uint256(0);

    uint256 internal _totalGons;
    uint256 internal _totalSupply;
    uint256 internal _gonsPerFragment;
    mapping(address => uint256) internal _gonBalances;

    string private _name;
    string private _symbol;
    uint8 private _decimals;

    constructor(string memory name_, string memory symbol_) internal {
        _name = name_;
        _symbol = symbol_;
        _decimals = 18;

        _totalSupply = 0;
        _gonBalances[msg.sender] = 0;
        _gonsPerFragment = 10**27;
    }

    /**
     * @param monetaryPolicy_ The address of the monetary policy contract to use for authentication.
     */
    function setMonetaryPolicy(address monetaryPolicy_) external onlyOwner {
        monetaryPolicy = monetaryPolicy_;
        emit MonetaryPolicyUpdated(monetaryPolicy_);
    }

    /**
     * @dev Notifies Fragments contract about a new rebase cycle.
     * @param supplyDelta The number of new fragment tokens to add into circulation via expansion.
     * @return The total number of fragments after the supply adjustment.
     */
    function rebase(
        uint256 epoch,
        uint256 supplyDelta,
        bool negative
    ) external override onlyMonetaryPolicy returns (uint256) {
        if (supplyDelta == 0) {
            emit Rebased(epoch, _totalSupply);
            return _totalSupply;
        }

        if (negative) {
            _totalSupply = _totalSupply.sub(uint256(supplyDelta));
        } else {
            _totalSupply = _totalSupply.add(uint256(supplyDelta));
        }

        _gonsPerFragment = _totalGons.divideDecimalPrecise(_totalSupply);

        // From this point forward, _gonsPerFragment is taken as the source of truth.
        // We recalculate a new _totalSupply to be in agreement with the _gonsPerFragment
        // conversion rate.
        // This means our applied supplyDelta can deviate from the requested supplyDelta,
        // but this deviation is guaranteed to be < (_totalSupply^2)/(TOTAL_GONS - _totalSupply).
        //
        // In the case of _totalSupply <= MAX_UINT128 (our current supply cap), this
        // deviation is guaranteed to be < 1, so we can omit this step. If the supply cap is
        // ever increased, it must be re-included.
        // _totalSupply = TOTAL_GONS.div(_gonsPerFragment)

        emit Rebased(epoch, _totalSupply);
        return _totalSupply;
    }

    function name() external view override returns (string memory) {
        return _name;
    }

    function symbol() external view override returns (string memory) {
        return _symbol;
    }

    function decimals() external view override returns (uint8) {
        return _decimals;
    }

    function totalGons() external view override returns (uint256) {
        return _totalGons;
    }

    function gonBalanceOf(address account) external view override returns (uint256) {
        return _gonBalances[account];
    }

    function totalSupply() external view override returns (uint256) {
        return _totalSupply;
    }

    function balanceOf(address account) external view override returns (uint256) {
        return _gonBalances[account].divideDecimalPrecise(_gonsPerFragment);
    }

    function _mint(address account, uint256 amount) internal {
        require(account != address(0), "ERC20: mint to the zero address");

        uint256 deltaGons = amount.multiplyDecimalPrecise(_gonsPerFragment);
        _totalSupply = _totalSupply.add(amount);
        _totalGons = _totalGons.add(deltaGons);
        _gonBalances[account] = _gonBalances[account].add(deltaGons);
        emit Transfer(address(0), account, amount);
    }

    function _burn(address account, uint256 amount) internal {
        require(account != address(0), "ERC20: burn from the zero address");

        uint256 deltaGons = amount.multiplyDecimalPrecise(_gonsPerFragment);
        _gonBalances[account] = _gonBalances[account].sub(deltaGons);
        _totalGons = _totalGons.sub(deltaGons);
        _totalSupply = _totalSupply.sub(amount);
        emit Transfer(account, address(0), amount);
    }

    modifier onlyMonetaryPolicy() {
        require(msg.sender == monetaryPolicy);
        _;
    }
}
