// SPDX-License-Identifier: MIT

pragma solidity ^0.8.6;

/** @title INFT_MarketplaceV2 interface*/
import {IMarketplace} from "./../IMarketplace.sol";
import {MarketPlaceLib} from "./../MarketplaceLib.sol";

interface IMinted721Marketplace is IMarketplace {
    struct Minted721Sell {
        MarketPlaceLib.Sell sellData;
        uint256 tokenId;
        address seller;
    }

    event SellCreated(
        uint256 _sellId,
        address creator,
        address collection,
        uint64 expireDate,
        uint256 price,
        uint256 tokenId
    );
    event SellUpdated(
        uint256 _sellId,
        address creator,
        address collection,
        uint64 expireDate,
        uint256 price,
        uint256 tokenId
    );
    event ItemBoughtMinted721(
        uint256 _sellId,
        address buyer,
        address seller,
        address collection,
        uint256 tokenID
    );
    event CollectionAdded(address collection);

    function createSell(
        uint256 _price,
        address _collection,
        uint64 _expireDate,
        uint256 _tokenId
    ) external;

    function editSell(
        uint256 _sellID,
        uint256 _price,
        address _collection,
        uint64 _expireDate,
        uint256 _tokenId
    ) external;

    function setLandRockerCollection(address _addr) external;

    function landrocker721Collections(
        address collection
    ) external view returns (bool);

    function minted721Sells(
        uint256 _listID
    )
        external
        view
        returns (
            MarketPlaceLib.Sell memory sellData,
            uint256 tokenId,
            address seller
        );
}
