// // SPDX-License-Identifier: GPL-3.0
pragma solidity 0.8.6;

// import {IMarketplace} from "./../../marketplace/IMarketplace.sol";
// import {MarketPlaceLib} from "./../../marketplace/MarketplaceLib.sol";

// /**
//  * @title INonMinted1155Marketplace
//  * @dev Interface for a marketplace managing non-minted ERC1155 asset sell orders.
//  */
// interface INonMinted1155MarketplaceUpgraded is IMarketplace {
//   // Struct defines the discount parameters for a user, including discount percentage, expiration date, usage count, and cap.
//     struct UserDiscount {
//         uint64 discountRate; // Discount percentage for the user.
//         uint64 expireDate; // Timestamp when the discount order expires.
//         uint64 usedDiscount; // Number of times the discount has been used.
//         uint64 usageLimit; // Maximum usage count for the discount.
//         uint256 discountCap; // Maximum discounted amount (cap) allowed.
//     }

//     // Struct representing a non-minted sell order for an ERC1155 asset.
//     struct NonMinted1155Sell {
//         MarketPlaceLib.Sell sellData; // Information about the sell order (status, expire date, etc.).
//         uint256 listedAmount; // The total amount of the asset listed for sale.
//         uint256 sellUnit; // The unit of the asset being sold in each transaction.
//         uint256 soldAmount; // The amount of the asset that has been sold.
//         uint256 tokenId; // The unique identifier of the ERC1155 asset.
//     }

//     /**
//      * @dev Event emitted when a new sell order is created.
//      * @param sellId The unique identifier of the sell order.
//      * @param creator The address of the user who created the sell order.
//      * @param collection The address of the ERC1155 collection.
//      * @param expireDate The expiration date of the sell order.
//      * @param price The price per unit of the asset.
//      * @param listedAmount The total amount of the asset listed for sale.
//      * @param sellUnit The unit of the asset being sold in each transaction.
//      * @param tokenId The unique identifier of the ERC1155 asset.
//      */
//     event SellCreated(
//         uint256 sellId,
//         address creator,
//         address collection,
//         uint64 expireDate,
//         uint256 price,
//         uint256 listedAmount,
//         uint256 sellUnit,
//         uint256 tokenId
//     );

//     /**
//      * @dev Event emitted when an existing sell order is updated.
//      * @param sellId The unique identifier of the sell order.
//      * @param collection The address of the ERC1155 collection.
//      * @param expireDate The updated expiration date of the sell order.
//      * @param price The updated price per unit of the asset.
//      * @param listedAmount The updated total amount of the asset listed for sale.
//      * @param sellUnit The updated unit of the asset being sold in each transaction.
//      * @param tokenId The updated unit of the asset being sold in each transaction.

//      */
//     event SellUpdated(
//         uint256 sellId,
//         address collection,
//         uint64 expireDate,
//         uint256 price,
//         uint256 listedAmount,
//         uint256 sellUnit,
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
//      * @dev Emitted when a non-minted ERC1155 item is successfully purchased on the marketplace using LRT.
//      * @param sellId The unique identifier of the sell order.
//      * @param buyer The address of the buyer who purchased the item.
//      * @param tokenId The unique identifier of the ERC1155 asset that was purchased.
//      * @param sellUnit The amount of the asset that was purchased in this transaction.
//      * @param price Price of the asset after discount.
//      * @param totalPayment Price of the asset after discount, royalty and systemFee.
//      */
//     event AssetBought1155WithBalance(
//         uint256 sellId,
//         address buyer,
//         uint256 tokenId,
//         uint256 sellUnit,
//         uint256 price,
//         uint256 totalPayment
//     );

//     /**
//      * @dev Emitted when a non-minted ERC1155 item is successfully purchased on the marketplace using LRT vesting.
//      * @param sellId The unique identifier of the sell order.
//      * @param buyer The address of the buyer who purchased the item.
//      * @param tokenId The unique identifier of the ERC1155 asset that was purchased.
//      * @param sellUnit The amount of the asset that was purchased in this transaction.
//      * @param price Price of the asset.
//      * @param totalPayment Price of the asset after discount.
//      */
//     event AssetBought1155WithVesting(
//         uint256 sellId,
//         address buyer,
//         uint256 tokenId,
//         uint256 sellUnit,
//         uint256 price,
//         uint256 totalPayment
//     );

//     /**
//      * @dev Emitted when an nft1155Pool address updated.
//      * @param nft1155Pool the nft1155Pool address
//      */
//     event NFT1155PoolUpdated(address nft1155Pool);

//     /**
//      * @dev Initializes the marketplace contract.
//      * @param _accessRestriction The address of the AccessRestriction contract.
//      * @param _lrt The address of the LRT contract.
//      * @param _landRocker The address of the LandRocker contract.
//      * @param _lrtVestingAddress The address of the LRT vesting contract.
//      * @param _nft1155Pool Address of the nft1155Pool contract.
//      * @param _greeting The greeting message to be displayed on the marketplace.
//      */
//    function initializeNonMinted1155Marketplace(
//         address _accessRestriction,
//         address _lrt,
//         address _landRocker,
//         address _lrtVestingAddress,
//         address _nft1155Pool,
//         string memory _greeting
//     ) external;

  
//     /**
//      * @dev Creates a new non-minted sell order for an ERC1155 asset.
//      * @param _price The price of the asset.
//      * @param _floorPrice The floor price of the asset in LRT tokens.
//      * @param _collection The address of the ERC1155 collection.
//      * @param _expireDate The expiration date of the sell order.
//      * @param _listedAmount The total amount of the asset listed for sale.
//      * @param _sellUnit The unit of the asset being sold in each transaction.
//      * @param _tokenId The unit of the asset being sold in each transaction.

//      */
//     function createSell(
//         uint256 _price,
//         uint256 _floorPrice,
//         address _collection,
//         uint64 _expireDate,
//         uint256 _listedAmount,
//         uint256 _sellUnit,
//         uint256 _tokenId
//     ) external;

//     /**
//      * @dev Edits an existing non-minted sell order for an ERC1155 asset.
//      * @param _sellId The Id of the sell order to be edited.
//      * @param _price The updated price of the asset.
//      * @param _expireDate The updated expiration date of the sell order.
//      * @param _listedAmount The updated total amount of the asset listed for sale.
//      * @param _sellUnit The updated unit of the asset being sold in each transaction.
//      * @param _tokenId The unit of the asset being sold in each transaction.

//      */
//     function editSell(
//         uint256 _sellId,
//         uint256 _price,
//         uint64 _expireDate,
//         uint256 _listedAmount,
//         uint256 _sellUnit,
//         uint256 _tokenId
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
//      * @dev set the nftPoo11155 address
//      * @param _nft1155Pool The Id of the sell order to be canceled.
//      */
//     function setNFT1155Pool(address _nft1155Pool) external;

//     /**
//      * @dev Retrieves detailed information about a non-minted ERC1155 sell order by its unique identifier.
//      * This function allows querying information about a specific sell order, including its status, expiration date,
//      * listed amount, sell unit, sold amount, and the unique identifier (token Id) of the ERC1155 asset associated with it.
//      * @param _sellId The unique identifier of the sell order to retrieve information about.
//      * @return sellData A `MarketPlaceLib.Sell` struct containing information about the sell order.
//      * @return listedAmount The total amount of the asset listed for sale in the sell order.
//      * @return sellUnit The unit of the asset being sold in each transaction within the sell order.
//      * @return soldAmount The amount of the asset that has been sold so far in the sell order.
//      * @return tokenId The unique identifier (token Id) of the ERC1155 asset associated with the sell order.
//      */
//     function nonMinted1155Sells(
//         uint256 _sellId
//     )
//         external
//         view
//         returns (
//             MarketPlaceLib.Sell memory sellData,
//             uint256 listedAmount,
//             uint256 sellUnit,
//             uint256 soldAmount,
//             uint256 tokenId
//         );

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
