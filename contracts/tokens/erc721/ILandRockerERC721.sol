// SPDX-License-Identifier: MIT
pragma solidity 0.8.6;

import {IERC721} from "@openzeppelin/contracts/token/ERC721/IERC721.sol";

interface ILandRockerERC721 is IERC721 {
    event BaseUriSet(string uri);
    event RoyaltySet(address receiver, uint96 feeNumerator);

    function safeMint(address _to) external returns (uint256);

    function burn(uint256 tokenId) external;

    function setBaseURI(string calldata baseURI_) external;

    function setDefaultRoyalty(address receiver, uint96 feeNumerator) external;

    function erc721Init(
        string memory _name,
        string memory _symbol,
        address _accessRestriction,
        address _receiver,
        uint96 feeNumerator,
        string memory baseURI_
    ) external;

    function exists(uint256 _tokenId) external view returns (bool);

    function uri(uint256 tokenId) external view returns (string memory);

    function baseURI() external view returns (string memory);

    function name_() external view returns (string memory);

    function symbol_() external view returns (string memory);
}
