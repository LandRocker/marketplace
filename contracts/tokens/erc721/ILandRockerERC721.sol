// SPDX-License-Identifier: GPL-3.0
pragma solidity 0.8.6;

import {IERC721} from "@openzeppelin/contracts/token/ERC721/IERC721.sol";

/**
 * @title ILandRockerERC721
 * @dev An interface for ERC721-based tokens with additional functionality.
 */
interface ILandRockerERC721 is IERC721 {
    /**
     * @dev Emitted when the base URI for token metadata is set.
     * @param uri The base URI for token metadata.
     */
    event BaseUriSet(string uri);

    /**
     * @dev Emitted when the royalty fee and recipient address are set.
     * @param receiver The address of the royalty recipient.
     * @param feeNumerator The numerator of the royalty fee.
     */
    event RoyaltySet(address receiver, uint96 feeNumerator);

    /**
     * @dev Emitted when the floor price of the collection are set.
     * @param tokenId The Id of the token to be burned.
     * @param floorPrice The floor price.
     */
    event FloorPriceUpdated(uint256 tokenId, uint256 floorPrice);

    /**
     * @dev Triggers when tokens are minted and sent to a specified address.
     * @param to The recipient's address receiving the tokens.
     * @param tokenId The unique identifier of the ERC-721 token.
     * @param category Identifies the token's use case, such as auction or staking.
     */
    event Token721Distributed(address to, uint256 tokenId, bytes32 category);

    /**
     * @dev Event emitted when the default royalty fee is deleted.
     */
    event RoyaltyDeleted();

    /**
     * @dev Safely mints a new token and assigns it to the given address.
     * @param _to The address to which the token will be assigned.
     * @param _category Identifies the token's use case, such as auction or staking.
     * @return The Id of the newly created token.

     */
    function safeMint(
        address _to,
        bytes32 _category
    ) external returns (uint256);

    /**
     * @dev Safely mints a new token and assigns it to the given address.
     * @param _to The address to which the token will be assigned.
     * @param _tokenId The Id of the token.
     * @param _category Identifies the token's use case, such as auction or staking.
     */
    function mint(address _to, uint256 _tokenId, bytes32 _category) external;

    /**
     * @dev Burns (destroys) a token with the specified tokenId.
     * @param _tokenId The Id of the token to be burned.
     */
    function burn(uint256 _tokenId) external;

    /**
     * @dev Sets the base URI for token metadata.
     * @param _baseURI The base URI to set.
     */
    function setBaseURI(string calldata _baseURI) external;

    /**
     * @dev Sets the default royalty fee and recipient address for tokens.
     * @param _receiver The address of the royalty recipient.
     * @param _feeNumerator The numerator of the royalty fee.
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
     * @dev Deletes the default royalty fee and recipient address for tokens.
     */
    function deleteDefaultRoyalty() external;

    /**
     * @dev Initializes the ERC721 contract with various parameters.
     * @param _name The name of the ERC721 contract.
     * @param _symbol The symbol of the ERC721 contract.
     * @param _accessRestriction The address of access restriction (if applicable).
     * @param _receiver The address of the royalty recipient.
     * @param _feeNumerator The numerator of the royalty fee.
     * @param _baseURI The base URI for token metadata.
     */
    function erc721Init(
        string memory _name,
        string memory _symbol,
        address _accessRestriction,
        address _receiver,
        uint96 _feeNumerator,
        string memory _baseURI
    ) external;

    /**
     * @dev Checks if a token with the given tokenId exists.
     * @param _tokenId The Id of the token to check.
     * @return A boolean indicating whether the token exists.
     */
    function exists(uint256 _tokenId) external view returns (bool);

    /**
     * @dev Retrieves the URI for a specific token.
     * @param _tokenId The Id of the token.
     * @return The URI for the specified token.
     */
    function uri(uint256 _tokenId) external view returns (string memory);

    /**
     * @dev Returns the base URI for token metadata.
     * @return The base URI for token metadata.
     */
    function tokenBaseURI() external view returns (string memory);

    /**
     * @dev Returns the name of the ERC721 contract.
     * @return The name of the ERC721 contract.
     */
    function tokenName() external view returns (string memory);

    /**
     * @dev Returns the symbol of the ERC721 contract.
     * @return The symbol of the ERC721 contract.
     */
    function tokenSymbol() external view returns (string memory);

    /**
     * @dev Returns the floor price
     * @param tokenId The Id of the token.
     * @return The floor price amount.
     */
    function floorPrices(uint256 tokenId) external view returns (uint256);
}
