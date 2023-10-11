// SPDX-License-Identifier: MIT

pragma solidity ^0.8.6;

/** @title INFT_MarketplaceV2 interface*/
import {IMarketplace} from "./../IMarketplace.sol";

interface INonMinted721Marketplace is IMarketplace {
    event SellCreated(
        uint256 _sellId,
        address creator,
        address tokenContract,
        uint64 expireDate,
        uint256 price
    );
    event SellUpdated(
        uint256 _sellId,
        address creator,
        address tokenContract,
        uint64 expireDate,
        uint256 price
    );
    event ItemBoughtNonMinted721(
        uint256 _sellId,
        address buyer,
        uint256 tokenID,
        address collection
    );
    event CollectionAdded(address collection);

    function createSell(
        uint256 _price,
        address _tokenContract,
        uint64 _expireDate
    ) external;

    function editSell(
        uint256 _sellID,
        uint256 _price,
        address _tokenContract,
        uint64 _expireDate
    ) external;

    function setLandRockerCollection(address _addr) external;

    function landrocker721Collections(
        address collection
    ) external view returns (bool);

    function nonMinted721Sells(
        uint256 _listID
    )
        external
        view
        returns (
            uint32 status,
            uint64 expireDate,
            address tokenContract,
            uint256 price
        );
}
