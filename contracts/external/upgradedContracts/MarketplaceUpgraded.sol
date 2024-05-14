// SPDX-License-Identifier: GPL-3.0
pragma solidity 0.8.6;

// Import OpenZeppelin contracts for ReentrancyGuard and Upgradeable proxies
import {ReentrancyGuardUpgradeable} from "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import {UUPSUpgradeable} from "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import {ERC165Checker} from "@openzeppelin/contracts/utils/introspection/ERC165Checker.sol";
import {ILandRockerERC2981} from "../../royalty/ILandRockerERC2981.sol";

// Import interfaces from the project
import {IAccessRestriction} from "./../../access/IAccessRestriction.sol";
import {ILRT} from "./../../tokens/erc20/ILRT.sol";
import {ILandRocker} from "./../../landrocker/ILandRocker.sol";
import {IMarketplace} from "./../../marketplace/IMarketplace.sol";
// import "hardhat/console.sol";

/**
 * @title Marketplace Contract
 * @dev A base contract for marketplace-related functionality. Provides access control and upgradeability features.
 */

abstract contract MarketplaceUpgraded is
    Initializable,
    UUPSUpgradeable,
    ReentrancyGuardUpgradeable,
    IMarketplace
{
    IAccessRestriction internal _accessRestriction;
    ILRT internal _lrt;

    ILandRocker internal _landrocker;

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
     * @param _accessRestrictionAddress The address of the access restriction contract.
     * @param _lrtAddress The address of the LRT (LanDrocker Token) contract.
     * @param _landRockerAddress The address of the LandRocker contract.
     */
    function initialize(
        address _accessRestrictionAddress,
        address _lrtAddress,
        address _landRockerAddress
    ) public virtual onlyInitializing {
        __UUPSUpgradeable_init();
        _accessRestriction = IAccessRestriction(_accessRestrictionAddress);
        _lrt = ILRT(_lrtAddress);
        _landrocker = ILandRocker(_landRockerAddress);
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
        // Ensure that the transfer was successful; otherwise, revert the transaction.
        require(
            _lrt.transfer(treasury, _amount),
            "Marketplace::Unsuccessful transfer"
        );
        emit Withdrawn(_amount, treasury);
    }

    /**
     * @dev Authorizes a contract upgrade.
     * @param newImplementation The address of the new contract implementation.
     */
    function _authorizeUpgrade(
        address newImplementation
    ) internal override onlyOwner {}

    /**
     * @dev Internal function to process the purchase of a token, including royalty distribution.
     * @param _tokenId The ID of the token being purchased.
     * @param _collection The address of the collection to which the token belongs.
     * @param _totalPayment The total payment made by the buyer, including fees.
     * @param _recipient The address of the buyer receiving the token.
     */
    function _processPurchase(
        uint256 _tokenId,
        address _collection,
        uint256 _totalPayment,
        address _recipient
    ) internal {
        // Retrieve royalty information for the purchased token
        (address royaltyRecipient, uint256 royaltyAmount) = _getRoyaltyInfo(
            _tokenId,
            _collection,
            _totalPayment
        );
        // Check if there's a royalty fee and a valid recipient
        if (royaltyAmount > 0 && royaltyRecipient != address(0)) {
            // Transfer funds to the seller after deducting royalty fee
            require(
                _lrt.transfer(_recipient, _totalPayment - royaltyAmount),
                "Marketplace::Unsuccessful transfer"
            );

            // Transfer funds to the royalty recipient
            require(
                _lrt.transfer(royaltyRecipient, royaltyAmount),
                "Marketplace::Unsuccessful transfer"
            );
        } else {
            // Transfer funds to the seller without any royalty deduction
            require(
                _lrt.transfer(_recipient, _totalPayment),
                "Marketplace::Unsuccessful transfer"
            );
        }
    }

    /**
     * @dev Internal function to calculate the total payment after deducting the system fee.
     * @param _price The original price of the token.
     * @return uint256 The total payment after deducting the system fee.
     */
    function _deductSystemFee(
        uint256 _price
    ) internal view returns (uint256) {
        // Retrieve the system fee percentage from LandRocker contract
        uint256 systemFee = _landrocker.systemFee();
        // Calculate the total payment after system fee deduction
        uint256 totalPayment = ((10000 - systemFee) * _price) / 10000;

        return totalPayment;
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
     * @dev Retrieve Royalty Information for a Token Transaction *
     * @param _tokenId The unique identifier of the token involved in the transaction.
     * @param _collection The address of the token contract to check for ERC2981 support.
     * @param _totalPayment The total payment made in the transaction.
     * @return royaltyRecipient The address that should receive the royalty payment.
     *         royaltyAmount The amount of royalty, expressed as an integer (e.g., 10000 for 10%).
     */
    function _getRoyaltyInfo(
        uint256 _tokenId,
        address _collection,
        uint256 _totalPayment
    ) internal view returns (address, uint256) {
        address royaltyRecipient;
        uint256 royaltyAmount;

        // Check if the token contract supports ERC2981
        if (
            ERC165Checker.supportsInterface(
                _collection,
                type(ILandRockerERC2981).interfaceId
            )
        ) {
            // Retrieve royalty information from the ERC2981 interface
            (royaltyRecipient, royaltyAmount) = ILandRockerERC2981(_collection)
                .royaltyInfo(_tokenId, _totalPayment);
        }

        return (royaltyRecipient, royaltyAmount);
    }
}
