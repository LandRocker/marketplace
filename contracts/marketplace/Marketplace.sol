// SPDX-License-Identifier: MIT
pragma solidity 0.8.6;

// Import OpenZeppelin contracts for ReentrancyGuard and Upgradeable proxies
import {ReentrancyGuardUpgradeable} from "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import {IERC2981} from "@openzeppelin/contracts/interfaces/IERC2981.sol";
import {ERC165Checker} from "@openzeppelin/contracts/utils/introspection/ERC165Checker.sol";

// Import interfaces from the project
import {IAccessRestriction} from "./../access/IAccessRestriction.sol";
import {ILRT} from "./../tokens/erc20/ILRT.sol";
import {ILandRocker} from "./../landrocker/ILandRocker.sol";
import {IMarketplace} from "./IMarketplace.sol";
import {ILRTVesting} from "./../vesting/ILRTVesting.sol";

//import "hardhat/console.sol";

/**
 * @title Marketplace Contract
 * @dev A base contract for marketplace-related functionality. Provides access control and upgradeability features.
 */
abstract contract Marketplace is
    Initializable,
    UUPSUpgradeable,
    ReentrancyGuardUpgradeable,
    IMarketplace
{
    IAccessRestriction internal _accessRestriction;
    ILRT internal _lrt;
    ILandRocker internal _landrocker;
    ILRTVesting internal _lrtVesting;

    // Modifiers

    /**
     * @dev Reverts if the caller is not the owner.
     */
    modifier onlyOwner() {
        _accessRestriction.ifOwner(msg.sender);
        _;
    }

    /**
     * @dev Reverts if the caller is not an admin.
     */
    modifier onlyAdmin() {
        _accessRestriction.ifAdmin(msg.sender);
        _;
    }

    /**
     * @dev Reverts if the given expiration date is invalid.
     * @param _expireDate The expiration date to check.
     */
    modifier validExpirationDate(uint64 _expireDate) {
        require(
            _expireDate == 0 ||
                (_expireDate > 0 && _expireDate > uint64(block.timestamp)),
            "Marketplace::Expiration date is invalid"
        );
        _;
    }

    // Initialization

    /**
     * @dev Initializes the Marketplace contract with required addresses.
     * @param accessRestriction_ The address of the access restriction contract.
     * @param lrt_ The address of the LRT (LanDrocker Rock Token) contract.
     * @param landRocker_ The address of the LandRocker contract.
     * @param lrtVesting_ The address of the LRT Vesting contract.
     */
    function initialize(
        address accessRestriction_,
        address lrt_,
        address landRocker_,
        address lrtVesting_
    ) public virtual initializer {
        __UUPSUpgradeable_init();
        _accessRestriction = IAccessRestriction(accessRestriction_);
        _lrt = ILRT(lrt_);
        _landrocker = ILandRocker(landRocker_);
        _lrtVesting = ILRTVesting(lrtVesting_);
    }

    // Internal Functions

    /**
     * @dev Withdraws a specified amount of LRT tokens to the treasury.
     * @param _amount The amount of LRT tokens to withdraw.
     */
    function _withdraw(uint256 _amount) internal onlyAdmin {
        // Ensure that the withdrawal amount is greater than zero.
        require(_amount > 0, "Marketplace::Insufficient amount, equal to zero");

        // Check if the contract holds enough LRT tokens to perform the withdrawal.
        require(
            _lrt.balanceOf(address(this)) >= _amount,
            "Marketplace::No balance to withdraw"
        );

        // Get the address of the treasury where the withdrawn LRT tokens will be sent.
        address treasury = _landrocker.treasury();

        // Attempt to transfer the specified amount of LRT tokens to the treasury.
        bool success = _lrt.transfer(treasury, _amount);

        // Ensure that the transfer was successful; otherwise, revert the transaction.
        require(success, "Marketplace::Unsuccessful transfer");
        emit Withdrawed(_amount, treasury);
    }

    /**
     * @dev Checks if a given expiration date is valid (either zero or in the future).
     * @param _expireDate The expiration date to check.
     */
    function _checkHasExpired(uint64 _expireDate) internal view {
        // Check if the `_expireDate` is either 0 (no expiration) or greater than the current block timestamp.
        require(
            _expireDate == 0 ||
                (_expireDate > 0 && uint64(block.timestamp) <= _expireDate),
            "Marketplace::The sale has expired"
        );
    }

    /**
     * @dev Checks if the caller has approved the contract to spend enough LRT tokens.
     * @param price The price of the item being purchased.
     */
    function _checkFund(uint256 price) internal view {
        // Check if the caller (msg.sender) has approved an allowance of LRT tokens for this contract
        // that is greater than or equal to the specified purchase price.
        require(
            _lrt.allowance(msg.sender, address(this)) >= price,
            "Marketplace::Allowance error"
        );
    }

    /**
     * @dev Authorizes a contract upgrade.
     * @param newImplementation The address of the new contract implementation.
     */
    function _authorizeUpgrade(
        address newImplementation
    ) internal override onlyOwner {}
}
