// SPDX-License-Identifier: GPL-3.0
pragma solidity 0.8.6;

import {IERC1155} from "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";

/**
 * @title ILandRockerERC1155
 * @dev Interface for the LandRockerERC1155 contract, extending the ERC1155 standard.
 */
interface ILandRockerERC1155 is IERC1155 {
    /**
     * @dev Event emitted when the base URI for token metadata is set.
     * @param uri the URI for token metadata
     */
    event BaseUriSet(string uri);

    /**
     * @dev Event emitted when the royalty fee for a receiver is set.
     * @param receiver The address that will receive royalties.
     * @param feeNumerator The percentage of transaction value to collect as royalties.
     */
    event RoyaltySet(address receiver, uint96 feeNumerator);

    /**
     * @dev Event emitted when the default royalty fee is deleted.
     */
    event RoyaltyDeleted();

    /**
     * @dev Emitted when floor price is updated
     * @param tokenId  tokenId
     * @param floorPrice New floor price
     */
    event FloorPriceUpdated(uint256 tokenId, uint256 floorPrice);

    /**
     * @dev Triggers when tokens are minted and sent to a specified address.
     * @param to The recipient's address receiving the tokens.
     * @param tokenId The unique identifier of the ERC-1155 token.
     * @param amount The quantity of tokens distributed.
     * @param category Identifies the token's use case, such as auction or staking.
     */
    event Token1155Distributed(
        address to,
        uint256 tokenId,
        uint256 amount,
        bytes32 category

    );

    /**
     * @dev Initializes the ERC1155 contract with various parameters.
     * @param _name The name of the ERC1155 contract.
     * @param _symbol The symbol of the ERC1155 contract.
     * @param _receiver The address of the royalty recipient.
     * @param _feeNumerator The numerator of the royalty fee.
     * @param _baseURI The base URI for token metadata.
     * @param _accessRestriction The address of the AccessRestriction contract.
     */
    function erc1155Init(
        string memory _name,
        string memory _symbol,
        address _receiver,
        uint96 _feeNumerator,
        string memory _baseURI,
        address _accessRestriction
    ) external;

    /**
     * @dev Mint tokens and assign them to a given address.
     * @param _to Address to receive the minted tokens.
     * @param _amount The amount to mint.
     * @param _category Identifies the token's use case, such as auction or staking.
     * @return currentId The Id of the newly minted tokens.
     */
    function safeMint(
        address _to,
        uint256 _amount,
        bytes32 _category
    ) external returns (uint256);

    /**
     * @dev Mints additional tokens to a specified address under a given category.
     * @param _to Address to receive the additional tokens.
     * @param _tokenId The Id of the token.
     * @param _amount The amount to mint.
     * @param _category Identifies the token's use case, such as auction or staking.
     */
    function mint(address _to,uint256 _tokenId,  uint256 _amount,bytes32 _category) external;

    /**
     * @dev Set the base URI for token metadata.
     * @param _newUri The new base URI.
     */
    function setBaseURI(string memory _newUri) external;

    /**
     * @dev Set default royalty parameters.
     * @param _receiver The address that will receive royalties.
     * @param _feeNumerator The percentage of transaction value to collect as royalties.
     */
    function setDefaultRoyalty(
        address _receiver,
        uint96 _feeNumerator
    ) external;

    /**
     * @dev Sets floor price of collection
     * @param _tokenId The Id of the token.
     * @param _floorPrice The floor price.
     */
    function setFloorPrice(uint256 _tokenId, uint256 _floorPrice) external;

    /**
     * @dev Removes default royalty information.
     */
    function deleteDefaultRoyalty() external;

    /**
     * @dev Burn tokens held by a specific address.
     * @param _from Address from which to burn tokens.
     * @param _id The Id of the token.
     * @param _amount The amount to burn.
     */
    function burn(address _from, uint256 _id, uint256 _amount) external;

    /**
     * @dev Check if a token with a given Id exists.
     * @param _tokenId The Id of the token.
     * @return true if the token exists, otherwise false.
     */
    function exists(uint256 _tokenId) external view returns (bool);

    /**
     * @dev Retrieves the URI for a specific token.
     * @param _tokenId The Id of the token.
     * @return The URI for the specified token.
     */
    function uri(uint256 _tokenId) external view returns (string memory);

    /**
     * @dev Returns the token collection name.
     */
    function name() external view returns (string memory);

    /**
     * @dev Returns the token collection symbol.
     */
    function symbol() external view returns (string memory);

    /**
     * @dev Returns the name of the ERC1155 contract.
     * @return The name of the ERC1155 contract.
     */
    function tokenName() external view returns (string memory);

    /**
     * @dev Returns the symbol of the ERC1155 contract.
     * @return The symbol of the ERC1155 contract.
     */
    function tokenSymbol() external view returns (string memory);

    /**
     * @dev Returns the floor price
     * @param tokenId The Id of the token.
     * @return The floor price amount.
     */
    function floorPrices(uint256 tokenId) external view returns (uint256);
}
