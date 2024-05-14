// SPDX-License-Identifier: GPL-3.0
pragma solidity 0.8.6;

/** @title INFT_MarketplaceV2 interface*/
import {IMarketplace} from "./../../marketplace/IMarketplace.sol";
import {MarketPlaceLib} from "./../../marketplace/MarketplaceLib.sol";


/**
 * @title IAssetMarketplace interface
 * @dev This interface defines the functions and data structures for an off-chain asset marketplace.
 */
interface IAssetMarketplaceUpgraded {
     //To represent a sell listing for an off-chain asset.
    struct AssetSell {
        uint8 status; // Status of the sell listing. 0: Started, 1: Sold, 2: Canceled
        bytes16 assetName; // Name of asset being sold. Fuel,Ne,...
        uint64 expireDate; // Expiration date of the sell listing (timestamp).
        uint256 price; // Price at which the asset is listed for sale.
        uint256 sellUnit; // Quantity of the asset available for sale.
        uint256 listedAmount; // The total amount of the asset listed for sale.
        uint256 soldAmount; // The amount of the asset that has been sold.


    }

    //To define the domain separator for signing and verifying messages.
    struct EIP712Domain {
        string name; // The name of the domain. It identifies the smart contract or the context in which the signature is used.
        string version; // To represent the version of the domain.
        uint256 chainId; // To represent the chain Id.
        address verifyingContract; // The address of the contract that will perform the signature verification.
        bytes32 salt; // To add an additional layer of uniqueness to the domain separator.
    }

    /**
     * @dev Emitted when a new sell listing is created.
     * @param sellId The Id of the created sell listing.
     * @param assetName // Name of asset being sold. Fuel,Ne,....
     * @param expireDate Expiration date of the sell listing (timestamp).
     * @param price Price at which the asset is listed for sale.
     * @param sellUnit Quantity of the asset available for sale.
     * @param listedAmount The total amount of the asset listed for sale.

     */
    event SellCreated(
        uint256 sellId,
        bytes16 assetName,
        uint64 expireDate,
        uint256 price,
        uint256 sellUnit,
        uint256 listedAmount
    );

    /**
     * @dev Emitted when an existing sell listing is updated.
     * @param sellId The Id of the updated sell listing.
     * @param assetName // Name of asset being sold. Fuel,Ne,....
     * @param expireDate Expiration date of the sell listing (timestamp).
     * @param price Price at which the asset is listed for sale.
     * @param sellUnit Quantity of the asset available for sale.
     * @param listedAmount The total amount of the asset listed for sale.

     */
    event SellUpdated(
        uint256 sellId,
        bytes16 assetName,
        uint64 expireDate,
        uint256 price,
        uint256 sellUnit,
        uint256 listedAmount
    );

      /**
     * @dev Emitted when an off-chain asset is bought with user balance.
     * @param sellId The Id of the sell listing that was bought.
     * @param assetName // Name of asset being sold. Fuel,Ne,....
     * @param buyer Address of the buyer.
     * @param sellUnit Quantity of the asset bought.
     * @param totalPayment Amount of LRT tokens spent.
     */
    event AssetBoughtWithVest(
        uint256 indexed sellId,
        bytes16 indexed assetName,
        address indexed buyer,
        uint256 sellUnit,
        uint256 totalPayment
    );

    /**
     * @dev Emitted when an off-chain asset is bought with user balance.
     * @param sellId The Id of the sell listing that was bought.
     * @param assetName // Name of asset being sold. Fuel,Ne,....
     * @param buyer Address of the buyer.
     * @param quantity Quantity of the asset bought.
     * @param totalPayment Amount of LRT tokens spent.
     */
    event AssetBoughtWithBalance(
        uint256 indexed sellId,
        bytes16 indexed assetName,
        address indexed buyer,
        uint256 quantity,
        uint256 totalPayment
    );
    /**
     * @dev Emitted when a user buys an off-chain asset in secondary market.
     * @param orderIdHash Hash of the order Id.
     * @param assetName // Name of asset being sold. Fuel,Ne,....
     * @param buyer Address of the buyer.
     * @param quantity Quantity of the asset bought.
     * @param totalPayment Amount of LRT tokens spent.
     */
    event FulFilledOrder(
        bytes32 indexed orderIdHash,
        bytes16 indexed assetName,
        address seller,
        address indexed buyer,
        uint256 quantity,
        uint256 totalPayment
    );


    /**
     * @dev Emitted when a sell listing is canceled.
     * @param sellId The Id of the canceled sell listing.
     */
    event SellCanceled(uint256 sellId);
    /**
     * @dev Emitted when funds are withdrawn from the marketplace.
     * @param amount The amount of funds withdrawn.
     * @param recipient Address of the recipient.
     */
    event Withdrawn(uint256 amount, address recipient);

    /**
     * @dev Initializes the contract.
     * @param _accessRestriction The address of the access restriction contract.
     * @param _lrt The address of the LRT token contract.
     * @param _landRocker The address of the LandRocker contract.
     * @param _lrtVesting The address of the LRT Vesting contract.
     */
    function initializeAssetMarketplace(
        address _accessRestriction,
        address _lrt,
        address _landRocker,
        address _lrtVesting,
        string memory _greeting
    ) external;

    /**
     * @dev Create a new sell listing for an off-chain asset.
     * @param _price Price at which the asset is listed for sale.
     * @param _assetName // Name of asset being sold. Fuel,Ne,....
     * @param _expireDate Expiration date of the sell listing (timestamp).
     * @param _sellUnit Quantity of the asset available for sale.
     * @param _listedAmount The total amount of the asset listed for sale.

     */
    function createSell(
        uint256 _price,
        bytes16 _assetName,
        uint64 _expireDate,
        uint256 _sellUnit,
        uint256 _listedAmount

    ) external;

    /**
     * @dev Edit an existing sell listing for an off-chain asset.
     * @param _sellId The Id of the sell listing to be edited.
     * @param _price New price at which the asset is listed for sale.
     * @param _assetName // Name of asset being sold. Fuel,Ne,....
     * @param _expireDate New expiration date of the sell listing (timestamp).
     * @param _sellUnit New sellUnit of the asset available for sale.
     * @param _listedAmount The total amount of the asset listed for sale.

     */
    function editSell(
        uint256 _sellId,
        uint256 _price,
        bytes16 _assetName,
        uint64 _expireDate,
        uint256 _sellUnit,
        uint256 _listedAmount

    ) external;

    /**
     * @dev Cancel a sell listing.
     * @param _sellId The Id of the sell listing to be canceled.
     */
    function cancelSell(uint256 _sellId) external;

    /**
     * @dev Buy an item from the marketplace.
     * @param _sellId The Id of the sell listing to buy.
     */
    function buyItem(uint256 _sellId) external;

    /**
     * @dev Fulfill an off-chain order.
     * @param _orderIdHash Hash of the order Id.
     * @param _seller Address of the seller.
     * @param _status Status of the order.
     * @param _assetName Name of asset being sold. Fuel,Ne,....
     * @param _expireDate Expiration date of the order (timestamp).
     * @param _price Price of the asset.
     * @param _sellUnit Quantity of the asset.
     * @param _v ECDSA signature V value.
     * @param _r ECDSA signature R value.
     * @param _s ECDSA signature S value.
     */
    function fulfillOrder(
        bytes32 _orderIdHash,
        address _seller,
        uint32 _status,
        bytes16 _assetName,
        uint64 _expireDate,
        uint256 _price,
        uint256 _sellUnit,
        uint8 _v,
        bytes32 _r,
        bytes32 _s
    ) external;

    /**
     * @dev Withdraw funds from the marketplace.
     * @param _amount The amount of funds to withdraw.
     */
    function withdraw(uint256 _amount) external;

    /**
     * @dev Get information about a specific asset sell listing.
     * @param _sellId The Id of the sell listing to query.
     * @return status Status of the sell listing.
     * @return assetName Type of asset being sold.
     * @return expireDate Expiration date of the sell listing.
     * @return price Price of the asset.
     * @return sellUnit Quantity of the asset.
     */
    function assetSells(
        uint256 _sellId
    )
        external
        view
        returns (
            uint8 status,
            bytes16 assetName,
            uint64 expireDate,
            uint256 price,
            uint256 sellUnit,
            uint256 listedAmount,
            uint256 soldAmount
        );

    /**
     * @dev Check if an off-chain order has been fulfilled.
     * @param _orderHash Hash of the order to check.
     * @return status True if the order has been fulfilled, false otherwise.
     */
    function orderFulfilled(
        bytes32 _orderHash
    ) external view returns (bool status);

    function greeting() external view returns(string memory);
}
