// SPDX-License-Identifier: GPL-3.0
pragma solidity 0.8.6;

import {Counters} from "@openzeppelin/contracts/utils/Counters.sol";
import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {IERC165} from "@openzeppelin/contracts/utils/introspection/IERC165.sol";
import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

import {IAccessRestriction} from "../../access/IAccessRestriction.sol";
import {LandRockerERC2981} from "../../royalty/LandRockerERC2981.sol";
import {ILandRockerERC721} from "./ILandRockerERC721.sol";
import "hardhat/console.sol";

/**
 * @title LandRockerERC721
 * @dev A contract for ERC721 tokens with royalty support.
 * This contract inherits from ERC721 and implements the ILandRockerERC721 and ERC2981 interfaces.
 */
contract LandRockerERC721 is
    ERC721,
    LandRockerERC2981,
    ILandRockerERC721,
    Initializable
{
    using Counters for Counters.Counter;

    IAccessRestriction public accessRestriction;

    /**
     * @dev Public state variable representing the base URI for token metadata.
     */
    string public override tokenBaseURI;

    /**
     * @dev Public state variable representing the name of the token.
     */
    string public override tokenName;

    /**
     * @dev Public state variable representing the symbol of the token.
     */
    string public override tokenSymbol;

    /**
     * @dev Mapping to store floor prices for each tokenId
     */
    mapping(uint256 => uint256) public override floorPrices;

    Counters.Counter private _tokenIds;

    /**
     * @dev Modifier to ensure an address is valid.
     * @param _addr The address to validate.
     */
    modifier validAddress(address _addr) {
        require(_addr != address(0), "LandRockerERC721::Not valid address");
        _;
    }

    /**
     * @dev Modifier to ensure only an admin can call the function.
     */
    modifier onlyAdmin() {
        accessRestriction.ifAdmin(msg.sender);
        _;
    }

    /**
     * @dev Modifier to ensure only approved contracts can call the function.
     */
    modifier onlyAdminOrApprovedContract() {
        accessRestriction.ifAdminOrApprovedContract(msg.sender);
        _;
    }

    /**
     * @dev Modifier to ensure only approved contracts can call the function.
     */
    modifier onlyApprovedContract() {
        accessRestriction.ifApprovedContract(msg.sender);
        _;
    }

    constructor() ERC721("", "") {}

    /**
     * @dev Initializes the LandRockerERC721 contract with the provided parameters.
     * @param _name The name of the contract.
     * @param _symbol The symbol of the contract.
     * @param _accessRestriction The address of the access restriction contract.
     * @param _receiver The address of the royalty recipient.
     * @param _feeNumerator The numerator of the royalty fee.
     * @param _baseTokenURI The base URI for token metadata.
     */
    function erc721Init(
        string memory _name,
        string memory _symbol,
        address _accessRestriction,
        address _receiver,
        uint96 _feeNumerator,
        string memory _baseTokenURI
    ) external override initializer {
        tokenName = _name;
        tokenSymbol = _symbol;
        tokenBaseURI = _baseTokenURI;
        accessRestriction = IAccessRestriction(_accessRestriction);
        _setDefaultRoyalty(_receiver, _feeNumerator);
    }

    /**
     * @dev Safely mints a new token and assigns it to the given address.
     * @param _to The address to which the token will be assigned.
     * @param _category Identifies the token's use case, such as auction or staking.
     * @return The Id of the newly created token.
     */
    function safeMint(
        address _to,
        bytes32 _category
    )
        external
        override
        onlyApprovedContract
        validAddress(_to)
        returns (uint256)
    {
        uint256 currentId = _tokenIds.current();
        _safeMint(_to, currentId);

        _tokenIds.increment();

        emit Token721Distributed(_to, _tokenIds.current(), _category);

        return currentId;
    }

    /**
     * @dev Safely mints a new token and assigns it to the given address.
     * @param _to The address to which the token will be assigned.
     * @param _tokenId The Id of the token.
     * @param _category Identifies the token's use case, such as auction or staking.
     */
    function mint(
        address _to,
        uint256 _tokenId,
        bytes32 _category
    ) external override onlyApprovedContract validAddress(_to) {
        _safeMint(_to, _tokenId);
        emit Token721Distributed(_to, _tokenId, _category);
    }

    /**
     * @dev Sets the base URI for token metadata.
     * @param _baseTokenURI The new base URI.
     */
    function setBaseURI(
        string calldata _baseTokenURI
    ) external override onlyAdmin {
        require(
            bytes(_baseTokenURI).length > 0,
            "LandRockerERC721::Base URI is invalid"
        );

        tokenBaseURI = _baseTokenURI;
        // Emit an event to indicate the updated token base URI
        emit BaseUriSet(_baseTokenURI);
    }

    /**
     * @dev Sets the default royalty for the contract.
     * @param _receiver The address of the royalty recipient.
     * @param _feeNumerator The numerator of the royalty fee.
     */
    function setDefaultRoyalty(
        address _receiver,
        uint96 _feeNumerator
    ) external override onlyAdmin validAddress(_receiver) {
        require(_feeNumerator > 0, "LandRockerERC721::Royalty fee is invalid");

        RoyaltyInfo memory royalty = _defaultRoyaltyInfo;

        require(
            _feeNumerator <= royalty.royaltyFraction,
            "LandRockerERC721::New default lower than previous"
        );

        // Call the internal function to set the default royalty
        _setDefaultRoyalty(_receiver, _feeNumerator);
        // Emit an event to indicate the updated royalty details
        emit RoyaltySet(_receiver, _feeNumerator);
    }

    /**
     * @dev Removes default royalty information.
     */
    function deleteDefaultRoyalty() external override onlyAdmin {
        _deleteDefaultRoyalty();
        // Emit an event to indicate the royalty details has been deleted
        emit RoyaltyDeleted();
    }

    /**
     * @dev Burns a token.
     * @param _tokenId The Id of the token to burn.
     */
    function burn(uint256 _tokenId) external override onlyApprovedContract {
        super._burn(_tokenId);

        _resetTokenRoyalty(_tokenId);
    }

    /**
     * @dev Sets floor price of collection
     * @param _tokenId The Id of the token.
     * @param _floorPrice The floor price
     */
    function setFloorPrice(
        uint256 _tokenId,
        uint256 _floorPrice
    ) external override onlyAdminOrApprovedContract {
        floorPrices[_tokenId] = _floorPrice;
        emit FloorPriceUpdated(_tokenId, _floorPrice);
    }

    /**
     * @dev Checks if a token with the given Id exists.
     * @param _tokenId The Id of the token to check.
     * @return true if the token exists, false otherwise.
     */
    function exists(uint256 _tokenId) external view override returns (bool) {
        return _exists(_tokenId);
    }

    /**
     * @dev Gets the URI for a specific token.
     * @param _tokenId The Id of the token.
     * @return The URI for the token's metadata.
     */
    function uri(
        uint256 _tokenId
    ) public view virtual override returns (string memory) {
        return tokenURI(_tokenId);
    }

    /**
     * @dev Checks if a contract supports a specific interface.
     * @param interfaceId The Id of the interface to check.
     * @return true if the contract supports the interface, false otherwise.
     */
    function supportsInterface(
        bytes4 interfaceId
    )
        public
        view
        virtual
        override(LandRockerERC2981, ERC721, IERC165)
        returns (bool)
    {
        return
            LandRockerERC2981.supportsInterface(interfaceId) ||
            ERC721.supportsInterface(interfaceId);
    }

    /**
     * @dev Returns the name of the contract.
     * @return The contract's name.
     */
    function name() public view virtual override returns (string memory) {
        return tokenName;
    }

    /**
     * @dev Returns the symbol of the contract.
     * @return The contract's symbol.
     */
    function symbol() public view virtual override returns (string memory) {
        return tokenSymbol;
    }

    /**
     * @dev A hook that is called before transferring tokens.
     * @param from The sender's address.
     * @param to The recipient's address.
     * @param firstTokenId The Id of the first token in the batch.
     * @param batchSize The number of tokens in the batch.
     */
    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 firstTokenId,
        uint256 batchSize
    ) internal virtual override(ERC721) {
        // Implement your logic here
        super._beforeTokenTransfer(from, to, firstTokenId, batchSize);
    }

    /**
     * @dev Returns the base URI for token metadata.
     * @return The base URI.
     */
    function _baseURI() internal view virtual override returns (string memory) {
        return tokenBaseURI;
    }
}
