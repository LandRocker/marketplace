// SPDX-License-Identifier: GPL-3.0

pragma solidity 0.8.6;

import {IMarketplace} from "./../../marketplace/IMarketplace.sol";
import {MarketPlaceLib} from "./../../marketplace/MarketplaceLib.sol";

/**
 * @title IMinted721Marketplace interface
 * @dev Interface for a marketplace that deals with Minted721 tokens.
 */
interface IMinted721MarketplaceUpgraded is IMarketplace {
    // Struct representing a minted ERC721 sell order.
    struct Minted721Sell {
        // Details about the NFT listing, including price and expiration date.
        MarketPlaceLib.Sell sellData;
        // The unique identifier (token Id) of the Minted721 NFT.
        uint256 tokenId;
        // The Ethereum address of the NFT seller.
        address seller;
    }

    /**
     * @dev Emitted when a new Minted721 sell listing is created.
     * @param sellId The Id of the newly created sell listing.
     * @param creator The address of the listing creator.
     * @param collection The address of the NFT collection.
     * @param expireDate The expiration date of the listing.
     * @param price The price of the NFT.
     * @param tokenId The Id of the Minted721 NFT.
     */
    event SellCreated(
        uint256 sellId,
        address creator,
        address collection,
        uint64 expireDate,
        uint256 price,
        uint256 tokenId
    );
    /**
     * @dev Emitted when an existing Minted721 sell listing is updated.
     * @param sellId The Id of the updated sell listing.
     * @param creator The address of the listing creator.
     * @param collection The address of the NFT collection.
     * @param expireDate The updated expiration date of the listing.
     * @param price The updated price of the NFT.
     * @param tokenId The updated Id of the Minted721 NFT.
     */
    event SellUpdated(
        uint256 sellId,
        address creator,
        address collection,
        uint64 expireDate,
        uint256 price,
        uint256 tokenId
    );

    /**
     * @dev Emitted when a Minted721 NFT is purchased from the Marketplace.
     * @param sellId The Id of the sell listing that was purchased.
     * @param buyer The address of the buyer.
     * @param seller The address of the seller.
     * @param collection The address of the NFT collection.
     * @param tokenId The Id of the purchased Minted721 NFT.
     * @param totalPayment The total payment in purchase

     */
    event UserAssetBought721(
        uint256 sellId,
        address buyer,
        address seller,
        address collection,
        uint256 tokenId,
        uint256 totalPayment
    );
    /**
     * @dev Emitted when a Minted721 NFT collection is added for validation.
     * @param collection The address of the added NFT collection.
     * @param isActive A boolean indicating collection status
     */
    event CollectionAdded(address collection, bool isActive);

    /**
     * @dev Initialize the contract with essential addresses and parameters.
     * @param _accessRestriction The address of the access restriction contract.
     * @param _lrt The address of the LRT token contract.
     * @param _landRocker The address of the LandRocker contract.
     */
    function initilizeMinted721Marketplace(
        address _accessRestriction,
        address _lrt,
        address _landRocker,
        string memory _greeting
    ) external;

    /**
     * @dev Create a new sell listing for a Minted721 token.
     * @param _price The price of the token.
     * @param _collection The address of the token's collection.
     * @param _expireDate The expiration date of the listing.
     * @param _tokenId The Id of the Minted721 token.
     */
    function createSell(
        uint256 _price,
        address _collection,
        uint64 _expireDate,
        uint256 _tokenId
    ) external;

    /**
     * @dev Edit an existing sell listing for a Minted721 token.
     * @param _sellId The Id of the sell listing to be edited.
     * @param _price The updated price of the token.
     * @param _collection The updated address of the token's collection.
     * @param _expireDate The updated expiration date of the listing.
     * @param _tokenId The updated Id of the Minted721 token.
     */
    function editSell(
        uint256 _sellId,
        uint256 _price,
        address _collection,
        uint64 _expireDate,
        uint256 _tokenId
    ) external;

    /**
     * @dev Set the LandRocker collection address and enable or disable token validation.
     * @param _addr The address of the LandRocker collection.
     * @param _isActive Enable or disable token validation.
     */
    function setLandRockerCollection(address _addr, bool _isActive) external;

    /**
     * @dev Check if a collection is a LandRocker 721 collection.
     * @param _collection The address of the collection to check.
     */
    function landrocker721Collections(
        address _collection
    ) external view returns (bool);

    /**
     * @dev Get the data for a specific Minted721 sell listing.
     * @param _listId The Id of the sell listing to retrieve.
     */
    function minted721Sells(
        uint256 _listId
    )
        external
        view
        returns (
            MarketPlaceLib.Sell memory sellData,
            uint256 tokenId,
            address seller
        );

    function greeting() external view returns (string memory);
}
