// SPDX-License-Identifier: MIT
pragma solidity 0.8.6;

/** @title INFT_MarketplaceV2 interface*/
import {IMarketplace} from "./../IMarketplace.sol";
import {MarketPlaceLib} from "./../MarketplaceLib.sol";

/**
 * @title IAssetMarketplace interface
 * @dev This interface defines the functions and data structures for an off-chain asset marketplace.
 */
interface IAssetMarketplace {
    //To represent a sell listing for an off-chain asset.
    struct AssetSell {
        uint32 status; // Status of the sell listing. 0: Started, 1: Sold, 2: Canceled
        uint8 assetType; // Type of asset being sold. 0: Fuel, 1: Material
        uint64 expireDate; // Expiration date of the sell listing (timestamp).
        uint256 price; // Price at which the asset is listed for sale.
        uint256 quantity; // Quantity of the asset available for sale.
    }

    //To define the domain separator for signing and verifying messages.
    struct EIP712Domain {
        string name; // The name of the domain. It identifies the smart contract or the context in which the signature is used.
        string version; // To represent the version of the domain.
        uint256 chainId; // To represent the Ethereum chain ID.
        address verifyingContract; // The address of the contract that will perform the signature verification.
        bytes32 salt; // To add an additional layer of uniqueness to the domain separator. It can be used to differentiate between different instances of the same contract or domain.
    }

    /**
     * @dev Emitted when a new sell listing is created.
     * @param _sellId The ID of the created sell listing.
     * @param assetType Type of asset being sold (0: Fuel, 1: Material).
     * @param expireDate Expiration date of the sell listing (timestamp).
     * @param price Price at which the asset is listed for sale.
     * @param quantity Quantity of the asset available for sale.
     */
    event SellCreated(
        uint256 _sellId,
        uint8 assetType,
        uint64 expireDate,
        uint256 price,
        uint256 quantity
    );

    /**
     * @dev Emitted when an existing sell listing is updated.
     * @param _sellId The ID of the updated sell listing.
     * @param assetType Type of asset being sold (0: Fuel, 1: Material).
     * @param expireDate Expiration date of the sell listing (timestamp).
     * @param price Price at which the asset is listed for sale.
     * @param quantity Quantity of the asset available for sale.
     */
    event SellUpdated(
        uint256 _sellId,
        uint8 assetType,
        uint64 expireDate,
        uint256 price,
        uint256 quantity
    );

    /**
     * @dev Emitted when an off-chain asset is bought.
     * @param _sellId The ID of the sell listing that was bought.
     * @param assetType Type of asset being sold (0: Fuel, 1: Material).
     * @param buyer Address of the buyer.
     * @param quantity Quantity of the asset bought.
     * @param lrtAmount Amount of LRT tokens spent.
     */
    event OffChainItemBought(
        uint256 _sellId,
        uint8 assetType,
        address buyer,
        uint256 quantity,
        uint256 lrtAmount
    );

    /**
     * @dev Emitted when a user buys an off-chain asset.
     * @param chainIdHash Hash of the chain ID.
     * @param assetType Type of asset being sold (0: Fuel, 1: Material).
     * @param buyer Address of the buyer.
     * @param quantity Quantity of the asset bought.
     * @param lrtAmount Amount of LRT tokens spent.
     */
    event UserOffChainItemBought(
        bytes32 chainIdHash,
        uint8 assetType,
        address buyer,
        uint256 quantity,
        uint256 lrtAmount
    );

    /**
     * @dev Emitted when a sell listing is canceled.
     * @param _sellId The ID of the canceled sell listing.
     */
    event SellCanceled(uint256 _sellId);
    /**
     * @dev Emitted when funds are withdrawn from the marketplace.
     * @param _amount The amount of funds withdrawn.
     * @param recipient Address of the recipient.
     */
    event Withdrawed(uint256 _amount, address recipient);

    /**
     * @dev Cancel a sell listing.
     * @param _sellId The ID of the sell listing to be canceled.
     */
    function cancelSell(uint256 _sellId) external;

    /**
     * @dev Buy an item from the marketplace.
     * @param _sellId The ID of the sell listing to buy.
     */
    function buyItem(uint256 _sellId) external;

    /**
     * @dev Fulfill an off-chain order.
     * @param orderIdHash Hash of the order ID.
     * @param seller Address of the seller.
     * @param status Status of the order.
     * @param assetType Type of asset being sold (0: Fuel, 1: Material).
     * @param expireDate Expiration date of the order (timestamp).
     * @param price Price of the asset.
     * @param quantity Quantity of the asset.
     * @param v ECDSA signature V value.
     * @param r ECDSA signature R value.
     * @param s ECDSA signature S value.
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
    ) external;

    /**
     * @dev Withdraw funds from the marketplace.
     * @param _amount The amount of funds to withdraw.
     */
    function withdraw(uint256 _amount) external;

    /**
     * @dev Create a new sell listing for an off-chain asset.
     * @param _price Price at which the asset is listed for sale.
     * @param assetType Type of asset being sold (0: Fuel, 1: Material).
     * @param _expireDate Expiration date of the sell listing (timestamp).
     * @param quantity Quantity of the asset available for sale.
     */
    function createSell(
        uint256 _price,
        uint8 assetType,
        uint64 _expireDate,
        uint256 quantity
    ) external;

    /**
     * @dev Edit an existing sell listing for an off-chain asset.
     * @param _sellId The ID of the sell listing to be edited.
     * @param _price New price at which the asset is listed for sale.
     * @param assetType Type of asset being sold (0: Fuel, 1: Material).
     * @param _expireDate New expiration date of the sell listing (timestamp).
     * @param quantity New quantity of the asset available for sale.
     */
    function editSell(
        uint256 _sellId,
        uint256 _price,
        uint8 assetType,
        uint64 _expireDate,
        uint256 quantity
    ) external;

    /**
     * @dev Get information about a specific asset sell listing.
     * @param sellId The ID of the sell listing to query.
     * @return status Status of the sell listing.
     * @return assetType Type of asset being sold.
     * @return expireDate Expiration date of the sell listing.
     * @return price Price of the asset.
     * @return quantity Quantity of the asset.
     */
    function assetSells(
        uint256 sellId
    )
        external
        view
        returns (
            uint32 status,
            uint8 assetType,
            uint64 expireDate,
            uint256 price,
            uint256 quantity
        );

    /**
     * @dev Check if an off-chain order has been fulfilled.
     * @param orderHash Hash of the order to check.
     * @return status True if the order has been fulfilled, false otherwise.
     */
    function orderFulfilled(
        bytes32 orderHash
    ) external view returns (bool status);
}
