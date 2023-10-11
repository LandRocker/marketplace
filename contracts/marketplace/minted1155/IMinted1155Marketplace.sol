// SPDX-License-Identifier: MIT
pragma solidity 0.8.6;

import {IMarketplace} from "./../IMarketplace.sol";
import {MarketPlaceLib} from "./../MarketplaceLib.sol";

/**
 * @title IMinted1155Marketplace
 * @dev Interface for a marketplace managing minted ERC1155 asset sell orders.
 */
interface IMinted1155Marketplace is IMarketplace {
    // Struct representing a minted ERC1155 sell order.
    struct Minted1155Sell {
        MarketPlaceLib.Sell sellData; // Information about the sell order (status, expire date, etc.).
        uint256 tokenId; // The unique identifier of the ERC1155 asset.
        uint256 quantity; // The quantity of the asset being sold in each transaction.
        address seller; // The address of the seller of the asset.
    }

    /**
     * @dev Emitted when a new sell order is created for a minted ERC1155 asset.
     * @param _sellId The unique identifier of the sell order.
     * @param seller The address of the seller of the asset.
     * @param collection The address of the ERC1155 collection or contract.
     * @param _price The price of each unit of the asset.
     * @param _expireDate The expiration date for the sell order.
     * @param _tokenId The unique identifier of the ERC1155 asset.
     * @param _quantity The quantity of the asset being sold in each transaction.
     */
    event SellCreated(
        uint256 _sellId,
        address seller,
        address collection,
        uint256 _price,
        uint64 _expireDate,
        uint256 _tokenId,
        uint256 _quantity
    );

    /**
     * @dev Emitted when an existing sell order for a minted ERC1155 asset is updated.
     * @param _sellId The unique identifier of the sell order.
     * @param creator The address of the entity updating the sell order.
     * @param expireDate The updated expiration date for the sell order.
     * @param price The updated price of each unit of the asset.
     * @param _tokenId The updated unique identifier of the ERC1155 asset.
     * @param _quantity The updated quantity of the asset being sold in each transaction.
     */
    event SellUpdated(
        uint256 _sellId,
        address creator,
        uint64 expireDate,
        uint256 price,
        uint256 _tokenId,
        uint256 _quantity
    );

    /**
     * @dev Emitted when a minted ERC1155 asset is successfully purchased.
     * @param _sellId The unique identifier of the sell order related to the purchase.
     * @param buyer The address of the buyer who made the purchase.
     * @param seller The address of the seller from whom the asset was bought.
     * @param collection The address of the ERC1155 collection or contract.
     * @param _tokenId The unique identifier of the ERC1155 asset.
     * @param _quantity The quantity of the asset purchased in the transaction.
     */
    event ItemBoughtMinted1155(
        uint256 _sellId,
        address buyer,
        address seller,
        address collection,
        uint256 _tokenId,
        uint256 _quantity
    );

    /**
     * @dev Creates a new sell order for a minted ERC1155 asset.
     * @param _price The price of each unit of the asset.
     * @param _expireDate The expiration date for the sell order.
     * @param _tokenId The unique identifier of the ERC1155 asset.
     * @param _quantity The quantity of the asset being sold in each transaction.
     */
    function createSell(
        uint256 _price,
        uint64 _expireDate,
        uint256 _tokenId,
        uint256 _quantity
    ) external;

    /**
     * @dev Edits an existing sell order for a minted ERC1155 asset.
     * @param _sellId The unique identifier of the sell order.
     * @param _price The updated price of each unit of the asset.
     * @param _expireDate The updated expiration date for the sell order.
     * @param _tokenId The updated unique identifier of the ERC1155 asset.
     * @param _quantity The updated quantity of the asset being sold in each transaction.
     */
    function editSell(
        uint256 _sellId,
        uint256 _price,
        uint64 _expireDate,
        uint256 _tokenId,
        uint256 _quantity
    ) external;

    /**
     * @dev Retrieves information about a minted ERC1155 sell order by its unique identifier.
     * @param _listID The unique identifier of the sell order.
     * @return sellData Information about the sell order (status, expire date, etc.).
     * @return tokenId The unique identifier of the ERC1155 asset.
     * @return quantity The quantity of the asset being sold in each transaction.
     * @return seller The address of the seller of the asset.
     */
    function minted1155Sells(
        uint256 _listID
    )
        external
        view
        returns (
            MarketPlaceLib.Sell memory sellData,
            uint256 tokenId,
            uint256 quantity,
            address seller
        );
}
