// SPDX-License-Identifier: GPL-3.0
pragma solidity 0.8.6;

import {IMarketplace} from "./../../marketplace/IMarketplace.sol";
import {MarketPlaceLib} from "./../../marketplace/MarketplaceLib.sol";

/**
 * @title IMinted1155Marketplace
 * @dev Interface for a marketplace managing minted ERC1155 asset sell orders.
 */
interface IMinted1155MarketplaceUpgraded is IMarketplace {
    // Struct representing a minted ERC1155 sell order.
    struct Minted1155Sell {
        MarketPlaceLib.Sell sellData; // Information about the sell order (status, expire date, etc.).
        uint256 tokenId; // The unique identifier of the ERC1155 asset.
        uint256 quantity; // The quantity of the asset being sold in each transaction.
        address seller; // The address of the seller of the asset.
    }

    /**
     * @dev Emitted when a new sell order is created for a minted ERC1155 asset.
     * @param sellId The unique identifier of the sell order.
     * @param seller The address of the seller of the asset.
     * @param collection The address of the ERC1155 collection or contract.
     * @param price The price of each unit of the asset.
     * @param expireDate The expiration date for the sell order.
     * @param tokenId The unique identifier of the ERC1155 asset.
     * @param quantity The quantity of the asset being sold in each transaction.
     */
    event SellCreated(
        uint256 sellId,
        address seller,
        address collection,
        uint256 price,
        uint64 expireDate,
        uint256 tokenId,
        uint256 quantity
    );

    /**
     * @dev Emitted when an existing sell order for a minted ERC1155 asset is updated.
     * @param sellId The unique identifier of the sell order.
     * @param creator The address of the entity updating the sell order.
     * @param collection The address of the ERC1155 collection or contract.
     * @param expireDate The updated expiration date for the sell order.
     * @param price The updated price of each unit of the asset.
     * @param tokenId The updated unique identifier of the ERC1155 asset.
     * @param quantity The updated quantity of the asset being sold in each transaction.
     */
    event SellUpdated(
        uint256 sellId,
        address creator,
        address collection,
        uint64 expireDate,
        uint256 price,
        uint256 tokenId,
        uint256 quantity
    );

    /**
     * @dev Emitted when a minted ERC1155 asset is successfully purchased.
     * @param sellId The unique identifier of the sell order related to the purchase.
     * @param buyer The address of the buyer who made the purchase.
     * @param seller The address of the seller from whom the asset was bought.
     * @param collection The address of the ERC1155 collection or contract.
     * @param tokenId The unique identifier of the ERC1155 asset.
     * @param quantity The quantity of the asset purchased in the transaction.
     * @param totalPayment The total payment in purchase

     */
    event UserAssetBought1155(
        uint256 sellId,
        address buyer,
        address seller,
        address collection,
        uint256 tokenId,
        uint256 quantity,
        uint256 totalPayment
    );

    /**
     * @dev Emitted when a Minted1155 NFT collection is added for validation.
     * @param collection The address of the added NFT collection.
     * @param isActive A boolean indicating collection status
     */
    event CollectionAdded(address collection, bool isActive);

    /**
     * @dev Initializes the contract with necessary addresses.
     * @param _accessRestriction Address of the access restriction contract.
     * @param _lrt Address of the LRT token contract.
     * @param _landRocker Address of the LandRocker contract.
     */
    function initializeMinted1155MarketplaceUpgraded(
        address _accessRestriction,
        address _lrt,
        address _landRocker,
        string memory _greeting
    ) external;

    /**
     * @dev Creates a new sell order for a minted ERC1155 asset.
     * @param _price The price of each unit of the asset.
     * @param _collection The address of the ERC1155 collection or contract.
     * @param _expireDate The expiration date for the sell order.
     * @param _tokenId The unique identifier of the ERC1155 asset.
     * @param _quantity The quantity of the asset being sold in each transaction.
     */
    function createSell(
        uint256 _price,
        address _collection,
        uint64 _expireDate,
        uint256 _tokenId,
        uint256 _quantity
    ) external;

    /**
     * @dev Edits an existing sell order for a minted ERC1155 asset.
     * @param _sellId The unique identifier of the sell order.
     * @param _price The updated price of each unit of the asset.
     * @param _collection The address of the ERC1155 collection or contract.
     * @param _expireDate The updated expiration date for the sell order.
     * @param _tokenId The updated unique identifier of the ERC1155 asset.
     * @param _quantity The updated quantity of the asset being sold in each transaction.
     */
    function editSell(
        uint256 _sellId,
        uint256 _price,
        address _collection,
        uint64 _expireDate,
        uint256 _tokenId,
        uint256 _quantity
    ) external;

    /**
     * @dev Set the LandRocker collection address and enable or disable
     * @param _addr The address of the LandRocker collection.
     * @param _isActive Enable or disable collection status.
     */
    function setLandRockerCollection(address _addr, bool _isActive) external;

    /**
     * @dev Check if a collection is a LandRocker 1155 collection.
     * @param _collection The address of the collection to check.
     */
    function landrocker1155Collections(
        address _collection
    ) external view returns (bool);

    /**
     * @dev Retrieves information about a minted ERC1155 sell order by its unique identifier.
     * @param _listId The unique identifier of the sell order.
     * @return sellData Information about the sell order (status, expire date, etc.).
     * @return tokenId The unique identifier of the ERC1155 asset.
     * @return quantity The quantity of the asset being sold in each transaction.
     * @return seller The address of the seller of the asset.
     */
    function minted1155Sells(
        uint256 _listId
    )
        external
        view
        returns (
            MarketPlaceLib.Sell memory sellData,
            uint256 tokenId,
            uint256 quantity,
            address seller
        );

    function greeting() external view returns (string memory);
}
