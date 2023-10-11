// SPDX-License-Identifier: MIT
pragma solidity 0.8.6;

import {ERC1155Supply} from "@openzeppelin/contracts/token/ERC1155/extensions/ERC1155Supply.sol";
import {ERC1155} from "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import {IERC165} from "@openzeppelin/contracts/utils/introspection/IERC165.sol";
import {ERC2981} from "@openzeppelin/contracts/token/common/ERC2981.sol";
import {CountersUpgradeable} from "@openzeppelin/contracts-upgradeable/utils/CountersUpgradeable.sol";
import {Strings} from "@openzeppelin/contracts/utils/Strings.sol";

import {IAccessRestriction} from "../../access/IAccessRestriction.sol";
import {ILandRockerERC1155} from "./ILandRockerERC1155.sol";

contract LandRockerERC1155 is ERC1155Supply, ERC2981, ILandRockerERC1155 {
    // Counter for generating unique token IDs
    using CountersUpgradeable for CountersUpgradeable.Counter;

    CountersUpgradeable.Counter private _id;
    // Access control contract reference
    IAccessRestriction public accessRestriction;

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

    /**
     * @dev Constructor to initialize the LandRockerERC1155 contract
     * @param _accessRestrictionAddress Address of the access restriction contract
     * @param _receiver is the address that will receive royalties when tokens are traded
     * @param feeNumerator represents the percentage of the transaction value that will be collected as royalties.
     * @param _baseURI representing the base URI for metadata associated with tokens.
     */
    constructor(
        address _accessRestrictionAddress,
        address _receiver,
        uint96 feeNumerator,
        string memory _baseURI
    ) ERC1155(_baseURI) {
        accessRestriction = IAccessRestriction(_accessRestrictionAddress);
        _setDefaultRoyalty(_receiver, feeNumerator);
    }

    /**
     * @dev Mint tokens and assign them to a given address.
     * @param _to Address to receive the minted tokens.
     * @param _amount The amount to mint.
     * @return currentId The ID of the newly minted tokens.
     */
    function safeMint(
        address _to,
        uint256 _amount
    )
        external
        override
        onlyApprovedContract
        validAddress(_to)
        onlyValidAmount(_amount)
        returns (uint256)
    {
        uint256 currentId = _id.current();

        // Mint the specified amount of tokens to the given address
        _mint(_to, currentId, _amount, "");
        // Increment the token ID counter for uniqueness
        _id.increment();

        return currentId;
    }

    /**
     * @dev Increase the amount of an already minted token.
     * @param _tokenId The ID of the token.
     * @param _to Address to receive the additional tokens.
     * @param _amount The amount to mint.
     */
    function mint(
        uint256 _tokenId,
        address _to,
        uint256 _amount
    )
        external
        override
        onlyApprovedContract
        validAddress(_to)
        onlyValidAmount(_amount)
    {
        // Mint the specified amount of tokens to the given address
        _mint(_to, _tokenId, _amount, "");
    }

    /**
     * @dev Burn tokens held by a specific address.
     * @param _from Address from which to burn tokens.
     * @param _tokenId The ID of the token.
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
        uint256 userBalance = balanceOf(_from, _tokenId);
        // Check if the user has enough tokens to burn
        require(
            userBalance >= _amount,
            "LandRockerERC1155::Insufficient balance to burn"
        );
        // Burn the specified amount of tokens
        _burn(_from, _tokenId, _amount);
        // Reset the token's royalty
        _resetTokenRoyalty(_tokenId);
    }

    /**
     * @dev Set the base URI for token metadata.
     * @param baseURI_ The new base URI.
     */
    function setBaseURI(string memory baseURI_) external override onlyAdmin {
        // Check if the provided base URI is valid
        require(
            bytes(baseURI_).length > 0,
            "LandRockerERC1155::Base uri is invalid"
        );
        // Set the new base URI
        _setURI(baseURI_);
        emit BaseUriSet(baseURI_);
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
        // Set the default royalty parameters
        _setDefaultRoyalty(_receiver, _feeNumerator);
        emit RoyaltySet(_receiver, _feeNumerator);
    }

    /**
     * @dev See {IERC165-supportsInterface}.
     */
    function supportsInterface(
        bytes4 interfaceId
    ) public view virtual override(ERC2981, ERC1155, IERC165) returns (bool) {
        return
            ERC2981.supportsInterface(interfaceId) ||
            ERC1155.supportsInterface(interfaceId);
    }

    /**
     * @dev Check if a token with a given ID exists.
     * @param _tokenId The ID of the token.
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
     * @dev Get the URI for a given token ID.
     * @param tokenId The ID of the token.
     * @return The URI string.
     */
    function uri(
        uint256 tokenId
    )
        public
        view
        virtual
        override(ERC1155, ILandRockerERC1155)
        returns (string memory)
    {
        return
            string(
                abi.encodePacked(super.uri(tokenId), Strings.toString(tokenId))
            );
    }

    /**
     * @dev Hook executed before any token transfer.
     * @param operator The address that initiates the transfer.
     * @param from The address from which tokens are transferred.
     * @param to The address to which tokens are transferred.
     * @param ids The IDs of the tokens being transferred.
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
