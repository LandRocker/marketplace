// // SPDX-License-Identifier: GPL-3.0

pragma solidity 0.8.6;

// import {IMarketplace} from "./../../marketplace/IMarketplace.sol";
// import {MarketPlaceLib} from "./../../marketplace/MarketplaceLib.sol";

// /**
//  * @title INonMinted721Marketplace interface
//  * @dev This interface defines the functions and events for a non-minted721 NFT marketplace.
//  */
// interface INonMinted721MarketplaceUpgraded is IMarketplace {
//     // Struct defines the discount parameters for a user, including discount percentage, expiration date, usage count, and cap.
//     struct UserDiscount {
//         uint64 discountRate; // Discount percentage for the user.
//         uint64 expireDate; // Timestamp when the discount order expires.
//         uint64 usedDiscount; // Number of times the discount has been used.
//         uint64 usageLimit; // Maximum usage count for the discount.
//         uint256 discountCap; // Maximum discounted amount (cap) allowed.
//     }
//     // Struct representing a non-minted sell order for an ERC1155 asset.
//     struct NonMinted721Sell {
//         MarketPlaceLib.Sell sellData; // Information about the sell order (status, expire date, etc.).
//         uint256 tokenId; //unique token id
//     }
//     /**
//      * @dev Emitted when a new non-minted721 NFT listing is created in the marketplace.
//      * @param sellId The unique identifier of the listing.
//      * @param creator The address of the listing creator.
//      * @param collection The address of the NFT collection contract.
//      * @param expireDate The expiration date of the listing.
//      * @param price The price of the NFT.
//      * @param tokenId The unique identifier of the ERC721 asset.

//      */
//     event SellCreated(
//         uint256 sellId,
//         address creator,
//         address collection,
//         uint64 expireDate,
//         uint256 price,
//         uint256 tokenId
//     );
//     /**
//      * @dev Emitted when an existing non-minted721 NFT listing is updated in the marketplace.
//      * @param sellId The unique identifier of the listing.
//      * @param collection The address of the NFT collection contract.
//      * @param expireDate The new expiration date of the listing.
//      * @param price The new price of the NFT.
//      * @param tokenId The unique identifier of the ERC721 asset. 

//      */
//     event SellUpdated(
//         uint256 sellId,
//         address collection,
//         uint64 expireDate,
//         uint256 price,
//         uint256 tokenId
//     );

//     /**
//      * @notice Signals that a user discount has been set or updated.
//      * @dev This event is emitted when a user discount is set or updated, providing information about the user's discount parameters.
//      * @param user Address of the user for whom the discount is set or updated.
//      * @param discountRate The discount percentage or value assigned to the user.
//      * @param expireDate Unix timestamp indicating the expiration date of the user's discount.
//      * @param usageLimit Number of times the discount has been used by the user.
//      * @param discountCap Maximum limit on the total usage count of the discount by the user.
//      */
//     event UserDiscountSet(
//         address user,
//         uint64 discountRate,
//         uint64 expireDate,
//         uint64 usageLimit,
//         uint256 discountCap
//     );

//     /**
//      * @dev Emitted when an asset is successfully bought with LRT balance.
//      * @param sellId ID of the sell order.
//      * @param buyer Address of the buyer.
//      * @param collection Address of the token collection.
//      * @param price Amount paid for the purchase after discount.
//      * @param totalPayment Price of the asset after discount, royalty and systemFee.
//      * @param tokenId unique token id.
//      */
//     event AssetBought721WithBalance(
//         uint256 sellId,
//         address buyer,
//         address collection,
//         uint256 price,
//         uint256 totalPayment,
//         uint256 tokenId
//     );

//     /**
//      * @dev Emitted when an asset is successfully bought with vested LRT balance.
//      * @param sellId ID of the sell order.
//      * @param buyer Address of the buyer.
//      * @param collection Address of the token collection.
//      * @param price Price of the asset.
//      * @param totalPayment Amount paid for the purchase after discount.
//      * @param tokenId unique token id.
//      */
//     event AssetBought721WithVesting(
//         uint256 sellId,
//         address buyer,
//         address collection,
//         uint256 price,
//         uint256 totalPayment,
//         uint256 tokenId
//     );

//     /**
//      * @dev Emitted when an nft721Pool address updated.
//      * @param nft721Pool the nft721Pool address
//      */
//     event NFT721PoolUpdated(address nft721Pool);

//     /**
//      * @dev Initializes the marketplace contract.
//      * @param _accessRestriction The address of the AccessRestriction contract.
//      * @param _lrt The address of the LRT contract.
//      * @param _landRocker The address of the LandRocker contract.
//      * @param _lrtVestingAddress The address of the LRT vesting contract.
//      * @param _nft721Pool Address of the NFT721Pool contract.
//      */
//     function initializeNonMinted721Marketplace(
//         address _accessRestriction,
//         address _lrt,
//         address _landRocker,
//         address _lrtVestingAddress,
//         address _nft721Pool,
//         string memory _greeting
//     ) external;

 
//     /**
//      * @dev Create a new non-minted721 NFT listing in the marketplace.
//      * @param _price The price of the NFT.
//      * @param _floorPrice The floor price of the asset in LRT tokens.
//      * @param _collection The address of the NFT collection contract.
//      * @param _tokenId unique token id.
//      * @param _expireDate The expiration date of the listing.
//      */
//     function createSell(
//         uint256 _price,
//         uint256 _floorPrice,
//         address _collection,
//         uint256 _tokenId,
//         uint64 _expireDate
//     ) external;

//     /**
//      * @dev Update an existing non-minted721 NFT listing in the marketplace.
//      * @param _sellId The unique identifier of the listing to be updated.
//      * @param _price The new price of the NFT.
//      * @param _collection The address of the NFT collection contract.
//      * @param _expireDate The new expiration date of the listing.
//      */
//     function editSell(
//         uint256 _sellId,
//         uint256 _price,
//         address _collection,
//         uint64 _expireDate
//     ) external;

//     /**
//      * @notice Sets or updates a discount for a specific user.
//      * @dev This function is used to provide special pricing or privileges to selected users within the system.
//      * @param _user Address of the user for whom the discount is being set or updated.
//      * @param _discountRate Percentage discount to be applied for the user's transactions. Expressed as a value between 0 and 100.
//      * @param _expireDate The timestamp indicating the date and time when the discount expires.
//      * @param _usageLimit Number of times the discount can be utilized before expiration.
//      * @param _discountCap Maximum amount of discount that can be applied for the user's transactions within the specified period.
//      */
//     function setUserDiscount(
//         address _user,
//         uint64 _discountRate,
//         uint64 _expireDate,
//         uint64 _usageLimit,
//         uint256 _discountCap
//     ) external;

//     /**
//      * @dev set the nft721Pool address
//      * @param _nft721Pool The address of nft721 pool.
//      */
//     function setNFT721Pool(address _nft721Pool) external;

//     /**
//      * @dev Retrieve information about a specific non-minted721 NFT listing.
//      * @param _listId The unique identifier of the listing.
//      * @return sellData A `MarketPlaceLib.Sell` struct containing information about the sell order.
//        @return tokenId unique token id
//      */
//     function nonMinted721Sells(
//         uint256 _listId
//     )
//         external
//         view
//         returns (MarketPlaceLib.Sell memory sellData, uint256 tokenId);

//     /**
//      * @notice Retrieves the discount parameters for a given user.
//      * @dev This function returns the discount details including discount percentage, expiration date, usage count, and cap for a specified user.
//      * @param user The address of the user for whom to retrieve discount parameters.
//      * @return discountRate The discount percentage applicable to the user.
//      * @return expireDate The expiration timestamp of the user's discount.
//      * @return usedDiscount The number of times the user has used the discount.
//      * @return usageLimit The maximum allowed usage count for the user's discount.
//      * @return discountCap The maximum discounted amount (cap) applicable to the user.
//      */
//     function userDiscounts(
//         address user
//     )
//         external
//         view
//         returns (
//             uint64 discountRate,
//             uint64 expireDate,
//             uint64 usedDiscount,
//             uint64 usageLimit,
//             uint256 discountCap
//         );

//     function greeting() external view returns (string memory);
// }
