// SPDX-License-Identifier: MIT

pragma solidity ^0.8.6;

import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/utils/CountersUpgradeable.sol";
import {IERC721} from "@openzeppelin/contracts/interfaces/IERC721.sol";
import {IERC165} from "@openzeppelin/contracts/interfaces/IERC165.sol";
import {ILandRockerERC721} from "./../../tokens/erc721/ILandRockerERC721.sol";
import {LandRockerERC721Factory} from "./../../tokens/erc721/LandRockerERC721Factory.sol";

import {MarketPlaceLib} from "./../MarketplaceLib.sol";
import {Marketplace} from "./../Marketplace.sol";

import {INonMinted721Marketplace} from "./INonMinted721Marketplace.sol";

import "hardhat/console.sol";

contract NonMinted721Marketplace is Marketplace, INonMinted721Marketplace {
    using CountersUpgradeable for CountersUpgradeable.Counter;

    using MarketPlaceLib for MarketPlaceLib.Sell;
    CountersUpgradeable.Counter private _sellIdCounter;

    ILandRockerERC721 public landRockerERC721;
    LandRockerERC721Factory public landRockerERC721Factory;
    string public greeting;

    mapping(uint256 => MarketPlaceLib.Sell) public override nonMinted721Sells;
    mapping(address => bool) public override landrocker721Collections;

    modifier validAddress(address _address) {
        require(
            _address != address(0),
            "Minted721Marketplace::Not valid address"
        );
        _;
    }

    modifier validCollection(address _collection) {
        require(
            landrocker721Collections[_collection],
            "NonMinted721Marketplace::Token Contract is invalid"
        );
        _;
    }

    function __NonMinted721Marketplace_init(
        address _landRockerERC721,
        address _lrt,
        address _accessRestriction,
        address _landRocker,
        address _lrtVesting
    ) public initializer {
        Marketplace.initialize(
            _accessRestriction,
            _lrt,
            _landRocker,
            _lrtVesting
        );
        landRockerERC721 = ILandRockerERC721(_landRockerERC721);

        // uint256 startGas = gasleft();
        // // ...some code here...
        // landrocker721Collections[
        //     address(landRockerERC721Factory.getLandRockerERC721Clones(0))
        // ] = true;
        // uint256 gasUsed = startGas - gasleft();
        // console.log(gasUsed, "Used gas in NonMinted721Marketplace");

        greeting = "Hello, upgradeable world!";
    }

    function cancelSell(uint256 _sellID) external override onlyAdmin {
        MarketPlaceLib.Sell storage nonMinted721Sell = nonMinted721Sells[
            _sellID
        ];

        require(
            nonMinted721Sell.status == 0,
            "NonMinted721Marketplace::Cannot cancel active offer"
        );

        nonMinted721Sell.status = 2;

        emit SellCanceled(_sellID);
    }

    function createSell(
        uint256 _price,
        address _collection,
        uint64 _expireDate
    )
        external
        override
        onlyAdmin
        validExpirationDate(_expireDate)
        validCollection(_collection)
    {
        MarketPlaceLib.Sell storage nonMinted721Sell = nonMinted721Sells[
            _sellIdCounter.current()
        ];
        nonMinted721Sell.status = 0;
        nonMinted721Sell.collection = _collection;
        nonMinted721Sell.expireDate = _expireDate;
        nonMinted721Sell.price = _price;

        emit SellCreated(
            _sellIdCounter.current(),
            msg.sender,
            _collection,
            _expireDate,
            _price
        );
        _sellIdCounter.increment();
    }

    function editSell(
        uint256 _sellID,
        uint256 _price,
        address _collection,
        uint64 _expireDate
    )
        external
        override
        onlyAdmin
        validCollection(_collection)
        validExpirationDate(_expireDate)
    {
        MarketPlaceLib.Sell storage nonMinted721Sell = nonMinted721Sells[
            _sellID
        ];
        require(
            nonMinted721Sell.status != 1,
            "NonMinted721Marketplace::Sold NFT cannot be edit"
        );

        nonMinted721Sell.expireDate = _expireDate;
        nonMinted721Sell.price = _price;
        emit SellUpdated(_sellID, msg.sender, _collection, _expireDate, _price);
    }

    function buyItem(uint256 _sellID) external override {
        MarketPlaceLib.Sell storage nonMinted721Sell = nonMinted721Sells[
            _sellID
        ];
        uint256 price = nonMinted721Sell.price;

        _checkHasExpired(nonMinted721Sell.expireDate);
        _checkFund(price);

        require(
            nonMinted721Sell.status == 0,
            "NonMinted721Marketplace::Listed NFT has not valid status"
        );

        // Ensure that the marketplace has sufficient tokens for the purchase
        // require(
        //     landRockerERC721.balanceOf(
        //         address(this),
        //         nonMinted721Sell.tokenId
        //     ) >= nonMinted721Sell.sellUnit,
        //     "NonMinted721Marketplace::Insufficient token balance"
        // );

        if (_lrt.balanceOf(msg.sender) >= price) {
            //transfer lrt to marktplace
            bool success = _lrt.transferFrom(msg.sender, address(this), price);
            require(success, "NonMinted721Marketplace::Unsuccessful transfer");
        } else {
            // If the buyer doesn't have enough LRT, set a debt using the vesting contract
            _lrtVesting.setDebt(msg.sender, price);
        }
        // uint256 systemFee = _landrocker.systemFee();

        // uint256 totalPayment = ((10000 - systemFee) * price) / 10000;
        // nonMinted721Sell.status = 1;

        //transfer token to buyer
        uint256 tokenID = ILandRockerERC721(nonMinted721Sell.collection)
            .safeMint(msg.sender);

        // (address royaltyRecipient, uint256 royaltyAmount) = _getRoyaltyInfo(
        //     tokenID,
        //     nonMinted721Sell.collection,
        //     totalPayment
        // );

        // if (royaltyAmount > 0 && royaltyRecipient != address(0)) {
        //     bool isSendCreator = _lrt.transfer(
        //         _landrocker.treasury721(),
        //         totalPayment - royaltyAmount
        //     );
        //     require(isSendCreator, "Marketplace::Unsuccessful transfer");

        //     bool isSendRoyalty = _lrt.transfer(royaltyRecipient, royaltyAmount);
        //     require(isSendRoyalty, "Marketplace::Unsuccessful transfer");
        // } else {
        //     bool isSendCreator = _lrt.transfer(
        //         _landrocker.treasury721(),
        //         totalPayment
        //     );
        //     require(isSendCreator, "Marketplace::Unsuccessful transfer");
        // }

        emit ItemBoughtNonMinted721(
            _sellID,
            msg.sender,
            tokenID,
            nonMinted721Sell.collection
        );
    }

    function withdraw(uint256 _amount) external override onlyAdmin {
        _withdraw(_amount);
    }

    function setLandRockerCollection(
        address _addr
    ) external override validAddress(_addr) {
        landrocker721Collections[_addr] = true;
        emit CollectionAdded(_addr);
    }

    // function supportsInterface(
    //     bytes4 interfaceId
    // ) public view virtual override returns (bool) {
    //     return
    //         interfaceId == type(IERC721).interfaceId ||
    //         interfaceId == type(IERC165).interfaceId;
    // }
}
