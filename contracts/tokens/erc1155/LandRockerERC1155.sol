// SPDX-License-Identifier: GPL-3.0
pragma solidity 0.8.6;

import {ERC1155Supply} from "@openzeppelin/contracts/token/ERC1155/extensions/ERC1155Supply.sol";
import {ERC1155} from "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import {IERC1155} from "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";
import {IERC165} from "@openzeppelin/contracts/utils/introspection/IERC165.sol";
import {CountersUpgradeable} from "@openzeppelin/contracts-upgradeable/utils/CountersUpgradeable.sol";
import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import {Strings} from "@openzeppelin/contracts/utils/Strings.sol";

import {IAccessRestriction} from "../../access/IAccessRestriction.sol";
import {LandRockerERC2981} from "../../royalty/LandRockerERC2981.sol";
import {ILandRockerERC1155} from "./ILandRockerERC1155.sol";

contract LandRockerERC1155 is
    ERC1155Supply,
    LandRockerERC2981,
    ILandRockerERC1155,
    Initializable
{
    // Counter for generating unique token Ids
    using CountersUpgradeable for CountersUpgradeable.Counter;

    // Access control contract reference
    IAccessRestriction public accessRestriction;

    /**
     * @dev Public state variable representing the name of the token.
     */
    string public override tokenName;

    /**
     * @dev Public state variable representing the symbol of the token.
     */
    string public override tokenSymbol;

    CountersUpgradeable.Counter private _tokenIdCounter;

    /**
     * @dev Mapping to store floor prices for each tokenId
     */
    mapping(uint256 => uint256) public override floorPrices;

    /**
     * @dev Indicates a failure with the `operator`’s approval. Used in transfers.
     * @param operator Address that may be allowed to operate on tokens without being their owner.
     * @param owner Address of the current owner of a token.
     */
    error ERC1155MissingApprovalForAll(address operator, address owner);

    /**
     * @dev Reverts if address is invalid
     * @param _addr The address to validate
     */
    modifier validAddress(address _addr) {
        require(_addr != address(0), "LandRockerERC1155::Not valid address");
        _;
    }

    /**
     * @dev Modifier: Only accessible by administrators
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
     * @dev Modifier: Only accessible by approved contracts
     */
    modifier onlyApprovedContract() {
        accessRestriction.ifApprovedContract(msg.sender);
        _;
    }

    /**
     * @dev Reverts if amount is 0
     * @param _amount The amount to validate
     */
    modifier onlyValidAmount(uint256 _amount) {
        require(
            _amount > 0,
            "LandRockerERC1155::Insufficient amount, equal to zero"
        );
        _;
    }

    constructor() ERC1155("") {}

    /**
     * @dev Initializes the LandRockerERC1155 contract with the provided parameters.
     * @param _name The name of the contract.
     * @param _symbol The symbol of the contract.
     * @param _receiver The address of the royalty recipient.
     * @param _feeNumerator The numerator of the royalty fee.
     * @param _baseTokenURI The base URI for token metadata.
     * @param _accessRestrictionAddress The address of the access restriction contract.
     */
    function erc1155Init(
        string memory _name,
        string memory _symbol,
        address _receiver,
        uint96 _feeNumerator,
        string memory _baseTokenURI,
        address _accessRestrictionAddress
    ) external override initializer {
        tokenName = _name;
        tokenSymbol = _symbol;
        _setURI(_baseTokenURI);
        accessRestriction = IAccessRestriction(_accessRestrictionAddress);
        _setDefaultRoyalty(_receiver, _feeNumerator);
        emit RoyaltySet(_receiver, _feeNumerator);
    }

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
    )
        external
        override
        onlyApprovedContract
        validAddress(_to)
        onlyValidAmount(_amount)
        returns (uint256)
    {
        uint256 currentId = _tokenIdCounter.current();

        // Mint the specified amount of tokens to the given address
        _mint(_to, currentId, _amount, "");
        // Increment the token Id counter for uniqueness
        _tokenIdCounter.increment();

        emit Token1155Distributed(_to, _tokenIdCounter.current(), _amount,_category);


        return currentId;
    }

    /**
     * @dev Mints additional tokens to a specified address under a given category.
     * @param _to Address to receive the additional tokens.
     * @param _tokenId The Id of the token.
     * @param _amount The amount to mint.
     * @param _category Identifies the token's use case, such as auction or staking.
     */
    function mint(
        address _to,
        uint256 _tokenId,
        uint256 _amount,
        bytes32 _category
    )
        external
        override
        onlyApprovedContract
        validAddress(_to)
        onlyValidAmount(_amount)
    {
        // Mint the specified amount of tokens to the given address
        _mint(_to, _tokenId, _amount, "");

        emit Token1155Distributed(_to, _tokenId, _amount,_category);
    }

    /**
     * @dev Burn tokens held by a specific address.
     * @param _from Address from which to burn tokens.
     * @param _tokenId The Id of the token.
     * @param _amount The amount to burn.
     */
    function burn(
        address _from,
        uint256 _tokenId,
        uint256 _amount
    )
        external
        override
        onlyApprovedContract
        validAddress(_from)
        onlyValidAmount(_amount)
    {
        // Burn the specified amount of tokens
        _burn(_from, _tokenId, _amount);

        // Reset the token's royalty
        _resetTokenRoyalty(_tokenId);
    }

    /**
     * @dev Set the base URI for token metadata.
     * @param _baseURI The new base URI.
     */
    function setBaseURI(string memory _baseURI) external override onlyAdmin {
        // Check if the provided base URI is valid
        require(
            bytes(_baseURI).length > 0,
            "LandRockerERC1155::Base URI is invalid"
        );

        // Set the new base URI
        _setURI(_baseURI);

        emit BaseUriSet(_baseURI);
    }

    /**
     * @dev Set default royalty parameters.
     * @param _receiver The address that will receive royalties.
     * @param _feeNumerator The percentage of transaction value to collect as royalties.
     */
    function setDefaultRoyalty(
        address _receiver,
        uint96 _feeNumerator
    ) external override onlyAdmin {
        require(_feeNumerator > 0, "LandRockerERC1155::Royalty fee is invalid");
        require(
            _receiver != address(0),
            "LandRockerERC1155::Not valid address"
        );

        RoyaltyInfo memory royalty = _defaultRoyaltyInfo;

        require(
            _feeNumerator <= royalty.royaltyFraction,
            "LandRockerERC1155::New default lower than previous"
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
     * @dev set the amount of floor price for each token
     * @param _tokenId The Id of the token.
     * @param _floorPrice The amount to floor price.
     */
    function setFloorPrice(
        uint256 _tokenId,
        uint256 _floorPrice
    )
        external
        override
        onlyAdminOrApprovedContract
        onlyValidAmount(_floorPrice)
    {
        floorPrices[_tokenId] = _floorPrice;
        emit FloorPriceUpdated(_tokenId, _floorPrice);
    }

    /**
     * @dev Mint some tokens to the to address - See {IERC1155-supportsInterface}.
     * @param to Address to mint the token to.
     * @param _tokenIds  The Ids being minted.
     * @param  amounts  Amount of tokens to mint given Id.
     * @param data Additional field to pass data to function.
     */
    function mintBatch(
        address to,
        uint256[] memory _tokenIds,
        uint256[] memory amounts,
        bytes memory data
    ) public {
        _mintBatch(to, _tokenIds, amounts, data);
    }

    /**
     * @dev See {IERC1155-safeBatchTransferFrom}.
     */
    function safeBatchTransferFrom(
        address from,
        address to,
        uint256[] memory ids,
        uint256[] memory values,
        bytes memory data
    ) public virtual override(IERC1155, ERC1155) {
        address sender = _msgSender();
        if (from != sender && !isApprovedForAll(from, sender)) {
            revert ERC1155MissingApprovalForAll(sender, from);
        }
        _safeBatchTransferFrom(from, to, ids, values, data);
    }

    /**
     * @dev See {IERC165-supportsInterface}.
     */
    function supportsInterface(
        bytes4 interfaceId
    )
        public
        view
        virtual
        override(LandRockerERC2981, ERC1155, IERC165)
        returns (bool)
    {
        return
            LandRockerERC2981.supportsInterface(interfaceId) ||
            ERC1155.supportsInterface(interfaceId);
    }

    /**
     * @dev Check if a token with a given Id exists.
     * @param _tokenId The Id of the token.
     * @return true if the token exists, otherwise false.
     */
    function exists(
        uint256 _tokenId
    )
        public
        view
        virtual
        override(ERC1155Supply, ILandRockerERC1155)
        returns (bool)
    {
        return ERC1155Supply.exists(_tokenId);
    }

    /**
     * @dev Get the URI for a given token Id.
     * @param _tokenId The Id of the token.
     * @return The URI string.
     */
    function uri(
        uint256 _tokenId
    )
        public
        view
        virtual
        override(ERC1155, ILandRockerERC1155)
        returns (string memory)
    {
        return
            string(
                abi.encodePacked(
                    super.uri(_tokenId),
                    Strings.toString(_tokenId)
                )
            );
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
     * @dev Hook executed before any token transfer.
     * @param operator The address that initiates the transfer.
     * @param from The address from which tokens are transferred.
     * @param to The address to which tokens are transferred.
     * @param ids The Ids of the tokens being transferred.
     * @param amounts The amounts of tokens being transferred.
     * @param data Additional data.
     */
    function _beforeTokenTransfer(
        address operator,
        address from,
        address to,
        uint256[] memory ids,
        uint256[] memory amounts,
        bytes memory data
    ) internal virtual override {
        // Implement your logic here
        super._beforeTokenTransfer(operator, from, to, ids, amounts, data);
    }
}
