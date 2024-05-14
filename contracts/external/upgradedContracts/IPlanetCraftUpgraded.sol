// // SPDX-License-Identifier: GPL-3.0
pragma solidity 0.8.6;

// import {MarketPlaceLib} from "./../../marketplace/MarketplaceLib.sol";
// import {IMarketplace} from "./../../marketplace/IMarketplace.sol";

// /**
//  * @title IPlanetCraft
//  * @dev Interface for a PlanetCraft managing  planet crafts.
//  */
// interface IPlanetCraftUpgraded {
//     /**
//      * @dev Emitted when funds are withdrawn from the contract.
//      * @param amount The amount of funds withdrawn.
//      * @param recipient The address that received the withdrawn funds.
//      */
//     event Withdrawn(uint256 amount, address recipient);

//     /**
//      * @dev Emitted when a planet craft fee is successfully paid using LRT.
//      * @param craftId The unique identifier of the planet craft.
//      * @param payer The address of the payer who paid the craft.
//      * @param craftFee The fee of the planet craft that was paid in this transaction.
//      */
//     event PaidCraftFeeWithBalance(
//         uint256 craftId,
//         address payer,
//         uint256 craftFee
//     );

//     /**
//      * @dev Emitted when a planet craft fee is successfully paid using LRT vesting.
//      * @param craftId The unique identifier of the planet craft.
//      * @param payer The address of the payer who paid the craft fee.
//      * @param craftFee The fee of the planet craft that was paid in this transaction.
//      */
//     event PaidCraftFeeWithVesting(
//         uint256 craftId,
//         address payer,
//         uint256 craftFee
//     );

//     /**
//      * @dev Emitted when craft fee are set.
//      * @param craftId The ID of the craft.
//      * @param craftFee The fee of the craft.
//      */
//     event CraftFeeSet(uint256 craftId, uint256 craftFee);

//     /**
//      * @dev Emitted when craft fee are updated.
//      * @param craftId The ID of the craft.
//      * @param craftFee The fee of the craft.
//      */
//     event CraftFeeUpdated(uint256 craftId, uint256 craftFee);

//     /**
//      * @dev Emitted when tokens are crafted and sent to a recipient.
//      * @param tokenId The ID of the token that was crafted.
//      * @param craftId The ID of the craft.
//      * @param recipient The address of the recipient who received the crafted tokens.
//      * @param amount The amount of tokens that were crafted.
//      * @param collection The collection of landrocker11555.

//      */
//     event Crafted1155Tokens(
//         address collection,
//         uint256 tokenId,
//         uint256 craftId,
//         address recipient,
//         uint256 amount
//     );

//     /**
//      * @dev Emitted when tokens are crafted and sent to a recipient.
//      * @param collection The address of the collection the crafted token belongs to.
//      * @param tokenId The ID of the token that was crafted.
//      * @param craftId The ID of the craft.
//      * @param recipient The address of the recipient who received the crafted tokens.
//      */
//     event Crafted721Tokens(
//         address collection,
//         uint256 tokenId,
//         uint256 craftId,
//         address recipient
//     );

//     /**
//      * @dev Emitted when a new NFT collection is added to the marketplace.
//      * @param collection The address of the NFT collection.
//      * @param isActive A boolean indicating if the collection is active for sell.
//      */
//     event CollectionAdded(address collection, bool isActive);

//     /**
//      * @dev Initializes the PlanetCraft contract.
//      * @param _accessRestrictionAddress The address of the AccessRestriction contract.
//      * @param _lrt The address of the LRT contract.
//      * @param _landRockerAddress The address of the LandRocker contract.
//      * @param _lrtVestingAddress The address of the LRT vesting contract.
//      * @param _greeting // grreting
//      */
//     function initializePlanetCraft(
//         address _accessRestrictionAddress,
//         address _lrt,
//         address _landRockerAddress,
//         address _lrtVestingAddress,
//         string memory _greeting
//     ) external;

//     /**
//      * @dev sets a fee for a specific  planet craft indicated by craftId.
//      * @param _craftFee The fee of the planet craft.
//      */
//     function setCraftFee(uint256 _craftFee) external;

//     /**
//      * @dev sets a fee for a specific  planet craft indicated by craftId.
//      * @param _craftId The Id of the planet craft to be updated.
//      * @param _craftFee The fee of the planet craft.
//      */
//     function editCraftFee(uint256 _craftId, uint256 _craftFee) external;

//     /**
//      * @dev Allows a payer to pay a craft fee.
//      * @param _craftId The Id of the planet craft to be paid.
//      */
//     function preCraft(uint256 _craftId) external;

//     /**
//      * @dev Allows the contract owner to withdraw funds from the contract.
//      * @param _amount The amount to be withdrawn.
//      */
//     function withdraw(uint256 _amount) external;

//     /**
//      * @dev Crafts a specific amount of a token and sends it to the recipient.
//      * @param _tokenId ID of the token to craft.
//      * @param _craftId The unique identifier of the craft.
//      * @param _recipient Address of the recipient who will receive the crafted tokens.
//      * @param _amount Amount of tokens to craft.
//      */
//     function craft1155(
//         uint256 _tokenId,
//         uint256 _craftId,
//         address _recipient,
//         uint256 _amount
//     ) external;

//     /**
//      * @dev Crafts a specific amount of a token and sends it to the recipient.
//      * @param _craftId The unique identifier of the craft.
//      * @param _recipient The address of the recipient who received the crafted token.
//      * @param _collection The address of the collection the crafted token belongs to.
//      */
//     function craft721(
//         uint256 _craftId,
//         address _recipient,
//         address _collection
//     ) external;

//     /**
//      * @dev Set whether a specific NFT collection is considered a valid NFT721 collection in the marketplace.
//      * @param _addr The address of the NFT collection contract.
//      * @param _isActive A boolean indicating whether the collection is valid or not.
//      */
//     function setLandRockerCollection(address _addr, bool _isActive) external;

//     /**
//      * @dev Check if a specific NFT collection is considered valid for NFT1155 listings in the marketplace.
//      * @param _collection The address of the NFT collection contract.
//      * @return A boolean indicating if the collection is valid or not.
//      */
//     function landrocker1155Collections(
//         address _collection
//     ) external view returns (bool);

//     /**
//      * @dev Check if a specific NFT collection is considered valid for NFT721 listings in the marketplace.
//      * @param _collection The address of the NFT collection contract.
//      * @return A boolean indicating if the collection is valid or not.
//      */
//     function landrocker721Collections(
//         address _collection
//     ) external view returns (bool);

//     /**
//      * @dev Retrieves detailed information about a planet craft by its unique identifier.
//      * This function allows querying information about a specific planet craft, including the fee associated with it.
//      * @param _craftId The unique identifier of the planet craft to retrieve information about.
//      * @return craftFee The fee of the craft.
//      */
//     function craftsFee(
//         uint256 _craftId
//     ) external view returns (uint256 craftFee);

//     function greeting() external view returns (string memory);
// }
