// SPDX-License-Identifier: MIT
pragma solidity 0.8.6;

import {Counters} from "@openzeppelin/contracts/utils/Counters.sol";
import {ERC2981} from "@openzeppelin/contracts/token/common/ERC2981.sol";
import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {IERC165} from "@openzeppelin/contracts/utils/introspection/IERC165.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

import {IAccessRestriction} from "../../access/IAccessRestriction.sol";
import {ILandRockerERC721} from "./ILandRockerERC721.sol";

import "hardhat/console.sol";

contract LandRockerERC721 is ERC721, ERC2981, ILandRockerERC721, Initializable {
    using Counters for Counters.Counter;

    string public override baseURI;
    string public override name_;
    string public override symbol_;

    IAccessRestriction public accessRestriction;

    Counters.Counter private _tokenIds;

    modifier validAddress(address _addr) {
        require(_addr != address(0), "LandRockerERC721::Not valid address");
        _;
    }
    /** NOTE modifier to check msg.sender has admin role */
    modifier onlyAdmin() {
        accessRestriction.ifAdmin(msg.sender);
        _;
    }
    /** NOTE modifier to check msg.sender has factory role */
    modifier onlyFactory() {
        accessRestriction.ifFactory(msg.sender);
        _;
    }

    modifier onlyApprovedContract() {
        accessRestriction.ifApprovedContract(msg.sender);
        _;
    }

    constructor() ERC721("", "") {}

    // function initialize(
    //     address accessRestriction_
    // ) public initializer {
    //     accessRestriction = IAccessRestriction(accessRestriction_);
    // }

    function erc721Init(
        string memory _name,
        string memory _symbol,
        address _accessRestriction,
        address _receiver,
        uint96 feeNumerator,
        string memory baseURI_
    ) external override initializer {
        name_ = _name;
        symbol_ = _symbol;
        accessRestriction = IAccessRestriction(_accessRestriction);
        _setDefaultRoyalty(_receiver, feeNumerator);
        baseURI = baseURI_;
    }

    function safeMint(
        address _to
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

        return currentId;
    }

    function setBaseURI(string calldata baseURI_) external override onlyAdmin {
        require(
            bytes(baseURI_).length > 0,
            "LandRockerERC721::Base uri is invalid"
        );

        baseURI = baseURI_;
        emit BaseUriSet(baseURI_);
    }

    function setDefaultRoyalty(
        address _receiver,
        uint96 _feeNumerator
    ) external override onlyAdmin {
        _setDefaultRoyalty(_receiver, _feeNumerator);
        emit RoyaltySet(_receiver, _feeNumerator);
    }

    function burn(uint256 tokenId) external override onlyApprovedContract {
        super._burn(tokenId);
        _resetTokenRoyalty(tokenId);
    }

    function exists(uint256 _tokenId) external view override returns (bool) {
        return _exists(_tokenId);
    }

    function uri(
        uint256 tokenId
    ) public view virtual override returns (string memory) {
        return tokenURI(tokenId);
    }

    function supportsInterface(
        bytes4 interfaceId
    ) public view virtual override(ERC2981, ERC721, IERC165) returns (bool) {
        return
            ERC2981.supportsInterface(interfaceId) ||
            ERC721.supportsInterface(interfaceId);
    }

    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 firstTokenId,
        uint256 batchSize
    ) internal virtual override(ERC721) {
        // Implement your logic here
        super._beforeTokenTransfer(from, to, firstTokenId, batchSize);
    }

    /** @return return baseURI */
    function _baseURI() internal view virtual override returns (string memory) {
        return baseURI;
    }

    /** @return return baseURI */
    function name() public view virtual override returns (string memory) {
        return name_;
    }

    function symbol() public view virtual override returns (string memory) {
        return symbol_;
    }
}
