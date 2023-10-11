// SPDX-License-Identifier: MIT
pragma solidity 0.8.6;

import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import {CountersUpgradeable} from "@openzeppelin/contracts-upgradeable/utils/CountersUpgradeable.sol";

import {Marketplace} from "./../Marketplace.sol";
import {ILRTVesting} from "./../../vesting/ILRTVesting.sol";
import {IAssetMarketplace} from "./IAssetMarketplace.sol";
import {IAccessRestriction} from "./../../access/IAccessRestriction.sol";
import {ILRT} from "./../../tokens/erc20/ILRT.sol";
import {ILandRocker} from "./../../landrocker/ILandRocker.sol";

//import "hardhat/console.sol";

/**
 * @title AssetMarketplace
 * @dev This contract implements an asset marketplace that allows users to buy and sell off-chain assets using LRT tokens.
 */
contract AssetMarketplace is IAssetMarketplace, Initializable, UUPSUpgradeable {
    // Use counters library for incrementing sell IDs
    using CountersUpgradeable for CountersUpgradeable.Counter;

    ILRTVesting public lrtVesting;

    bytes32 public constant FULL_FILL_ORDER_SIGN =
        keccak256(
            "fullFillOrder(bytes32 orderIdHash,uint32 status,uint8 assetType,uint64 expireDate,uint256 price,uint256 quantity)"
        );

    /**
     * @dev Mapping to store sell for each off-chain asset sell
     */
    mapping(uint256 => AssetSell) public override assetSells;

    mapping(bytes32 => bool) public override orderFulfilled;

    IAccessRestriction public accessRestriction;
    ILRT public lrt;
    ILandRocker public landRocker;

    // Counter for sell IDs
    CountersUpgradeable.Counter private _sellIdCounter;

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

    /**
     * @dev Reverts if the given expiration date is invalid.
     * @param _expireDate The expiration date to check.
     */
    modifier validExpirationDate(uint64 _expireDate) {
        require(
            _expireDate == 0 ||
                (_expireDate > 0 && _expireDate > uint64(block.timestamp)),
            "AssetMarketplace::Expiration date is invalid"
        );
        _;
    }

    /**
     * @dev Reverts if the given quantity is greater than zero.
     * @param _quantity The quantity that needs to check.
     */
    modifier validQuantity(uint256 _quantity) {
        require(_quantity > 0, "AssetMarketplace::At least one item to sell");
        _;
    }

    string public greeting;

    /**
     * @dev Initializes the contract.
     * @param accessRestriction_ The address of the access restriction contract.
     * @param lrt_ The address of the LRT token contract.
     * @param landRocker_ The address of the LandRocker contract.
     * @param lrtVesting_ The address of the LRT Vesting contract.
     */
    function __AssetMarketplace_init(
        address accessRestriction_,
        address lrt_,
        address landRocker_,
        address lrtVesting_
    ) public initializer {
        __UUPSUpgradeable_init();
        accessRestriction = IAccessRestriction(accessRestriction_);
        lrt = ILRT(lrt_);
        landRocker = ILandRocker(landRocker_);
        lrtVesting = ILRTVesting(lrtVesting_);

        greeting = "Hello, upgradeable world!";
    }

    /**
     * @dev Allows the admin to withdraw LRT tokens from the contract.
     * @param _amount The amount of LRT tokens to withdraw.
     */
    function withdraw(uint256 _amount) external override onlyAdmin {
        // Ensure that the withdrawal amount is greater than zero
        require(
            _amount > 0,
            "AssetMarketplace::Insufficient amount, equal to zero"
        );

        // Check if the contract has a sufficient balance of tokens to fulfill the withdrawal
        require(
            lrt.balanceOf(address(this)) >= _amount,
            "AssetMarketplace::No balance to withdraw"
        );

        // Get the treasury address where the tokens will be sent
        address treasury = landRocker.treasury();

        bool success = lrt.transfer(treasury, _amount);

        require(success, "AssetMarketplace::Unsuccessful transfer");
        emit Withdrawed(_amount, treasury);
    }

    /**
     * @dev Allows an admin to create a sell listing for an off-chain asset.
     * @param _price The price at which the asset is listed for sale.
     * @param _assetType The type of asset being sold (e.g., 0 for Fuel, 1 for Material).
     * @param _expireDate The expiration date of the sell listing (timestamp).
     * @param _quantity The quantity of the asset available for sale.
     */
    function createSell(
        uint256 _price,
        uint8 _assetType,
        uint64 _expireDate,
        uint256 _quantity
    )
        external
        override
        onlyAdmin
        validExpirationDate(_expireDate)
        validQuantity(_quantity)
    {
        AssetSell storage assetSell = assetSells[_sellIdCounter.current()];
        //Set the listing to started
        assetSell.status = 0;
        assetSell.expireDate = _expireDate;
        assetSell.price = _price;
        assetSell.assetType = _assetType;
        assetSell.quantity = _quantity;

        emit SellCreated(
            _sellIdCounter.current(),
            _assetType,
            _expireDate,
            _price,
            _quantity
        );
        _sellIdCounter.increment();
    }

    /**
     * @dev Allows an admin to edit an existing sell listing for an off-chain asset.
     * @param _sellId The ID of the sell listing to edit.
     * @param _price The new price at which the asset is listed for sale.
     * @param _assetType The new type of asset being sold.
     * @param _expireDate The new expiration date of the sell listing (timestamp).
     * @param _quantity The new quantity of the asset available for sale.
     */
    function editSell(
        uint256 _sellId,
        uint256 _price,
        uint8 _assetType,
        uint64 _expireDate,
        uint256 _quantity
    )
        external
        override
        onlyAdmin
        validExpirationDate(_expireDate)
        validQuantity(_quantity)
    {
        AssetSell storage assetSell = assetSells[_sellId];
        //Ensure that the listing is not sold
        require(
            assetSell.status != 1,
            "AssetMarketplace::Sold listing asset cannot be edit"
        );

        //Set the listing to started
        assetSell.status = 0;
        assetSell.expireDate = _expireDate;
        assetSell.price = _price;
        assetSell.assetType = _assetType;
        assetSell.quantity = _quantity;
        emit SellUpdated(_sellId, _assetType, _expireDate, _price, _quantity);
    }

    /**
     * @dev Allows an admin to cancel a sell listing for an off-chain asset.
     * @param _sellId The ID of the sell listing to cancel.
     */
    function cancelSell(uint256 _sellId) external override onlyAdmin {
        AssetSell storage assetSell = assetSells[_sellId];
        //Ensure that the listing is started
        require(
            assetSell.status == 0,
            "AssetMarketplace::Cannot cancel active offer"
        );

        //Set the listing to canceled
        assetSell.status = 2;

        emit SellCanceled(_sellId);
    }

    /**
     * @dev Allows a user to purchase an off-chain asset from a sell listing.
     * @param _sellId The ID of the sell listing to purchase from.
     */
    function buyItem(uint256 _sellId) external override {
        AssetSell storage assetSell = assetSells[_sellId];
        uint256 price = assetSell.price;

        require(
            //Ensure that the listing is started
            assetSell.status == 0,
            "AssetMarketplace::Listed asset has not valid status"
        );

        // Check if the sell listing has not expired
        _checkHasExpired(assetSell.expireDate);

        // Check if the user has allowed the contract to spend at least `price` amount of LRT
        require(
            lrt.allowance(msg.sender, address(this)) >= price,
            "AssetMarketplace::Allowance error"
        );

        //To buy off-chain asset by the user balance
        if (lrt.balanceOf(msg.sender) >= price) {
            bool success = lrt.transferFrom(
                msg.sender,
                address(this),
                assetSell.price
            );
            // Check if the user has allowed the contract to spend at least `price` amount of LRT
            require(success, "AssetMarketplace::Unsuccessful transfer");

            // Set the sell listing's status to "sold"
            assetSell.status = 1;
            emit OffChainItemBought(
                _sellId,
                assetSell.assetType,
                msg.sender,
                assetSell.quantity,
                price
            );
        }
        //To buy off-chain asset by setting debt for the user because of insufficient user balance
        else {
            // Set the sell listing's status to "sold"
            assetSell.status = 1;

            emit OffChainItemBought(
                _sellId,
                assetSell.assetType,
                msg.sender,
                assetSell.quantity,
                price
            );

            // Set a debt for the user using the LRT Vesting contract
            lrtVesting.setDebt(msg.sender, price);
        }
    }

    /**
     * @dev Allows a user to fulfill an off-chain order using a valid signature.
     * @param orderIdHash The hash of the order ID being fulfilled.
     * @param seller The address of the seller.
     * @param status The status of the order.
     * @param assetType The type of asset in the order.
     * @param expireDate The expiration date of the order (timestamp).
     * @param price The price of the order.
     * @param quantity The quantity of assets in the order.
     * @param v The recovery id of the signature.
     * @param r The R component of the signature.
     * @param s The S component of the signature.
     */
    function fulfillOrder(
        bytes32 orderIdHash,
        address seller,
        uint32 status,
        uint8 assetType,
        uint64 expireDate,
        uint256 price,
        uint256 quantity,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) external override {
        // Verify that the provided signature matches the order details
        _verifySigner(
            _buildDomainSeparator(),
            keccak256(
                abi.encode(
                    FULL_FILL_ORDER_SIGN,
                    orderIdHash,
                    status,
                    assetType,
                    expireDate,
                    price,
                    quantity
                )
            ),
            seller,
            v,
            r,
            s
        );

        // Prevent double fulfillment by checking if the order has already been fulfilled
        require(!orderFulfilled[orderIdHash], "Order already fulfilled");

        //Ensure that the listing is started
        require(
            status == 0,
            "AssetMarketplace::Listed asset has not valid status"
        );

        // Check if the order's expiration date has passed
        _checkHasExpired(expireDate);

        // Check if the user has allowed the contract to spend at least `price` amount of LRT
        require(
            lrt.allowance(msg.sender, address(this)) >= price,
            "AssetMarketplace::Allowance error"
        );

        // To buy off-chain asset with the user's balance
        if (lrt.balanceOf(msg.sender) >= price) {
            // Transfer the `price` amount of LRT tokens from the user to the contract
            bool success = lrt.transferFrom(msg.sender, address(this), price);
            require(success, "AssetMarketplace::Unsuccessful transfer");

            emit UserOffChainItemBought(
                orderIdHash,
                assetType,
                msg.sender,
                quantity,
                price
            );

            // Mark the order as fulfilled to prevent double fulfillment
            orderFulfilled[orderIdHash] = true;
        }
        //To buy off-chain asset by setting debt for the user because of insufficient balance
        else {
            emit UserOffChainItemBought(
                orderIdHash,
                assetType,
                msg.sender,
                quantity,
                price
            );

            // Set a debt for the user using the LRT Vesting contract
            lrtVesting.setDebt(msg.sender, price);
            // Mark the order as fulfilled to prevent double fulfillment
            orderFulfilled[orderIdHash] = true;
        }
    }

    /**
     * @dev Checks if the given expiration date has passed.
     * @param _expireDate The expiration date to check.
     */
    function _checkHasExpired(uint64 _expireDate) internal view {
        // Check if the `_expireDate` is either 0 (no expiration) or greater than the current block timestamp.
        require(
            _expireDate == 0 ||
                (_expireDate > 0 && uint64(block.timestamp) <= _expireDate),
            "AssetMarketplace::The sale has expired"
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
        require(signer == _seller, "AssetMarketplace::Invalid signature");
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
                    keccak256(bytes("AssetMarketplace")),
                    keccak256(bytes("1")),
                    block.chainid,
                    address(this)
                )
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
