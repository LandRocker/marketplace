// SPDX-License-Identifier: GPL-3.0
pragma solidity 0.8.6;

import {ReentrancyGuardUpgradeable} from "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import {UUPSUpgradeable} from "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import {CountersUpgradeable} from "@openzeppelin/contracts-upgradeable/utils/CountersUpgradeable.sol";
import {IAccessRestriction} from "./../../access/IAccessRestriction.sol";
import {ILRT} from "./../../tokens/erc20/ILRT.sol"; 
import {ILandRocker} from "./../../landrocker/ILandRocker.sol"; 
import {IBlueprintMarketplaceUpgraded} from "./IBlueprintMarketplaceUpgraded.sol";

/**
 * @title BlueprintMarketplace
 * @dev This contract implements an blueprint marketplace that allows users to buy and sell off-chain blueprints using LRT tokens.
 */
contract BlueprintMarketplaceUpgraded is
    Initializable,
    UUPSUpgradeable,
    ReentrancyGuardUpgradeable,
    IBlueprintMarketplaceUpgraded
{
    // Use counters library for incrementing sell Ids
    using CountersUpgradeable for CountersUpgradeable.Counter;

    IAccessRestriction public accessRestriction;
    ILRT public lrt; 
    ILandRocker public landRocker;

    bytes32 public constant FULL_FILL_ORDER_SIGN =
        keccak256(
            "fullFillOrder(bytes32 orderIdHash,uint32 status,uint256 blueprintId,uint64 expireDate,uint256 price)"
        );
   
    /**
     * @dev Mapping to store orders fulfilled
     */
    mapping(bytes32 => bool) public override orderFulfilled;

    string public override greeting;

    // Modifiers

    /**
     * @dev Reverts if the caller is not the owner.
     */
    modifier onlyOwner() {
        accessRestriction.ifOwner(msg.sender);
        _;
    }

    /**
     * @dev Reverts if the caller is not an admin.
     */
    modifier onlyAdmin() {
        accessRestriction.ifAdmin(msg.sender);
        _;
    }   

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    /**
     * @dev Initializes the contract.
     * @param _accessRestriction The address of the access restriction contract.
     * @param _lrt The address of the LRT token contract.
     * @param _landRocker The address of the LandRocker contract. 
     */
    function initializeBlueprintMarketplace(
        address _accessRestriction,
        address _lrt,
        address _landRocker ,
        string memory _greeting
    ) external override reinitializer(2) {
        __UUPSUpgradeable_init();
        accessRestriction = IAccessRestriction(_accessRestriction);
        lrt = ILRT(_lrt);
        landRocker = ILandRocker(_landRocker); 
        greeting = _greeting;
    }           

    /**
     * @dev Allows a user to fulfill an off-chain order using a valid signature.
     * @param _orderIdHash The hash of the order Id being fulfilled.
     * @param _seller The address of the seller.
     * @param _status The status of the order.
     * @param _blueprintId The Unique identifier of blueprint in the order.
     * @param _expireDate The expiration date of the order (timestamp).
     * @param _price The price of the order.
     * @param _v The recovery id of the signature.
     * @param _r The R component of the signature.
     * @param _s The S component of the signature.
     */
    function fulfillOrder(
        bytes32 _orderIdHash,
        address _seller,
        uint32 _status,
        uint256 _blueprintId,
        uint64 _expireDate,
        uint256 _price,
        uint8 _v,
        bytes32 _r,
        bytes32 _s
    ) external override nonReentrant {
        // Verify that the provided signature matches the order details
        _verifySigner(
            _buildDomainSeparator(),
            keccak256(
                abi.encode(
                    FULL_FILL_ORDER_SIGN,
                    _orderIdHash,
                    _status,
                    _blueprintId,
                    _expireDate,
                    _price
                )
            ),
            _seller,
            _v,
            _r,
            _s
        );

        // Prevent double fulfillment by checking if the order has already been fulfilled
        require(
            !orderFulfilled[_orderIdHash],
            "BlueprintMarketplace::Order already fulfilled"
        );

        //Ensure that the listing is started
        require(
            _status == 0,
            "BlueprintMarketplace::Listed blueprint has not valid status"
        );

        // Check if the order's expiration date has passed
        _checkHasExpired(_expireDate);

        // Check if the user has allowed the contract to spend at least `price` amount of LRT
        require(
            lrt.allowance(msg.sender, address(this)) >= _price,
            "BlueprintMarketplace::Allowance error"
        );

        // Ensure that the buyer has enough LRT tokens to make the purchase
        require(
            lrt.balanceOf(msg.sender) >= _price,
            "BlueprintMarketplace::Insufficient token balance"
        );

        // Mark the order as fulfilled to prevent double fulfillment
        orderFulfilled[_orderIdHash] = true;

        // Transfer the `price` amount of LRT tokens from the user to the contract
        require(
            lrt.transferFrom(msg.sender, address(this), _price),
            "BlueprintMarketplace::Unsuccessful transfer to marketplace"
        );

        // Retrieve the system fee percentage from LandRocker contract
        uint256 systemFee = landRocker.systemFee();
        // Calculate the total payment after system fee deduction
        uint256 totalPayment = ((10000 - systemFee) * _price) / 10000;

        require(
            lrt.transfer(_seller, totalPayment),
            "BlueprintMarketplace::Unsuccessful transfer to seller"
        );

        emit FulFilledOrder(
            _orderIdHash,
            _blueprintId,
            _seller,
            msg.sender,
            _price
        );
    }

    /**
     * @dev Allows the admin to withdraw LRT tokens from the contract.
     * @param _amount The amount of LRT tokens to withdraw.
     */
    function withdraw(uint256 _amount) external override onlyAdmin {
        // Ensure that the withdrawal amount is greater than zero
        require(
            _amount > 0,
            "BlueprintMarketplace::Insufficient amount, equal to zero"
        );

        // Check if the contract has a sufficient balance of tokens to fulfill the withdrawal
        require(
            lrt.balanceOf(address(this)) >= _amount,
            "BlueprintMarketplace::No balance to withdraw"
        );

        // Get the treasury address where the tokens will be sent
        address treasury = landRocker.treasury();

        require(
            lrt.transfer(treasury, _amount),
            "BlueprintMarketplace::Unsuccessful transfer"
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
     * @dev Checks if the given expiration date has passed.
     * @param _expireDate The expiration date to check.
     */
    function _checkHasExpired(uint64 _expireDate) private view {
        // Check if the `_expireDate` is either 0 (no expiration) or greater than the current block timestamp.
        require(
            _expireDate == 0 ||
                (_expireDate > 0 && uint64(block.timestamp) <= _expireDate),
            "BlueprintMarketplace::The sale has expired"
        );
    }

    /**
     * @dev Builds the EIP712 domain separator.
     * @return The domain separator hash.
     */
    function _buildDomainSeparator() private view returns (bytes32) {
        return
            keccak256(
                abi.encode(
                    keccak256(
                        "EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"
                    ),
                    keccak256(bytes("BlueprintMarketplace")), // Hash name
                    keccak256(bytes("1")), // Hash version
                    block.chainid,
                    address(this) // Verifying Contract
                )
            );
    }

    /**
     * @dev Computes the typed data hash for signature verification.
     * @param _domainSeperator The domain separator hash.
     * @param _structHash The hash of the struct being signed.
     * @return The typed data hash.
     */
    function _toTypedDataHash(
        bytes32 _domainSeperator,
        bytes32 _structHash
    ) private pure returns (bytes32) {
        return
            keccak256(
                abi.encodePacked("\x19\x01", _domainSeperator, _structHash)
            );
    }

    /**
     * @dev Verifies the signer of a message against a given signature.
     * @param _domainSeparator The domain separator hash.
     * @param _hashStruct The hash of the struct being signed.
     * @param _seller The expected signer's address.
     * @param _v The recovery id of the signature.
     * @param _r The R component of the signature.
     * @param _s The S component of the signature.
     */
    function _verifySigner(
        bytes32 _domainSeparator,
        bytes32 _hashStruct,
        address _seller,
        uint8 _v,
        bytes32 _r,
        bytes32 _s
    ) private pure {
        //Calculate the hash of the message data
        bytes32 hash = _toTypedDataHash(_domainSeparator, _hashStruct);

        //Recover the address of the signer from the provided ECDSA signature
        address signer = ecrecover(hash, _v, _r, _s);

        //Ensure that the recovered signer's address matches the expected _seller address
        require(signer == _seller, "BlueprintMarketplace::Invalid signature");
    }
}
