// SPDX-License-Identifier: MIT

pragma solidity ^0.8.6;
import {IERC721} from "@openzeppelin/contracts/interfaces/IERC721.sol";

import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/utils/CountersUpgradeable.sol";

import {ILandRockerERC721} from "./../../tokens/erc721/ILandRockerERC721.sol";
import {IAccessRestriction} from "./../../access/IAccessRestriction.sol";
import {Marketplace} from "./../Marketplace.sol";
import {IMinted721Marketplace} from "./IMinted721Marketplace.sol";

// import "hardhat/console.sol";

contract Minted721Marketplace is Marketplace, IMinted721Marketplace {
    using CountersUpgradeable for CountersUpgradeable.Counter;

    CountersUpgradeable.Counter private _sellIdCounter;
    ILandRockerERC721 public landRockerERC721;

    mapping(uint256 => Minted721Sell) public override minted721Sells;
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
            "Minted721Marketplace::Token Contract is invalid"
        );
        _;
    }

    string public greeting;

    function __Minted721Marketplace_init(
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

        greeting = "Hello, upgradeable world!";
    }

    function cancelSell(uint256 _sellID) external override {
        Minted721Sell storage minted721Sell = minted721Sells[_sellID];
        require(
            msg.sender == minted721Sell.seller,
            "Minted721Marketplace::You are not owner"
        );
        require(
            minted721Sell.sellData.status == 0,
            "Minted721Marketplace::Cannot cancel active offer"
        );

        minted721Sell.sellData.status = 2;

        require(
            address(0) ==
                IERC721(minted721Sell.seller).getApproved(
                    minted721Sell.tokenId
                ),
            "Minted721Marketplace::Marketplace approve are not revoked"
        );

        emit SellCanceled(_sellID);
    }

    function createSell(
        uint256 _price,
        address _collection,
        uint64 _expireDate,
        uint256 _tokenId
    )
        external
        override
        validCollection(_collection)
        validExpirationDate(_expireDate)
    {
        require(
            msg.sender == IERC721(_collection).ownerOf(_tokenId),
            "Minted721Marketplace::You are not owner"
        );
        require(
            address(this) == IERC721(_collection).getApproved(_tokenId),
            "Minted721Marketplace::Marketplace has not access"
        );

        Minted721Sell storage minted721Sell = minted721Sells[
            _sellIdCounter.current()
        ];
        minted721Sell.sellData.status = 0;
        minted721Sell.sellData.collection = _collection;
        minted721Sell.sellData.expireDate = _expireDate;
        minted721Sell.sellData.price = _price;
        minted721Sell.tokenId = _tokenId;
        minted721Sell.seller = msg.sender;

        emit SellCreated(
            _sellIdCounter.current(),
            msg.sender,
            _collection,
            _expireDate,
            _price,
            _tokenId
        );

        _sellIdCounter.increment();
    }

    function editSell(
        uint256 _sellID,
        uint256 _price,
        address _collection,
        uint64 _expireDate,
        uint256 _tokenId
    )
        external
        override
        validCollection(_collection)
        validExpirationDate(_expireDate)
    {
        Minted721Sell storage minted721Sell = minted721Sells[_sellID];
        require(
            minted721Sell.sellData.status != 1,
            "Minted721Marketplace::Sold NFT cannot be edit"
        );

        require(
            msg.sender == IERC721(_collection).ownerOf(_tokenId),
            "Minted721Marketplace::You are not owner"
        );
        require(
            address(this) == IERC721(_collection).getApproved(_tokenId),
            "Minted721Marketplace::Marketplace has not access"
        );

        minted721Sell.sellData.expireDate = _expireDate;
        minted721Sell.sellData.price = _price;
        minted721Sell.tokenId = _tokenId;

        emit SellUpdated(
            _sellID,
            msg.sender,
            _collection,
            _expireDate,
            _price,
            _tokenId
        );
    }

    function buyItem(uint256 _sellID) external override {
        Minted721Sell storage minted721Sell = minted721Sells[_sellID];

        //Ensure that the listing is started
        require(
            minted721Sell.sellData.status == 0,
            "Minted721Marketplace::Sell has invalid status"
        );

        uint256 price = minted721Sell.sellData.price;

        _checkHasExpired(minted721Sell.sellData.expireDate);
        _checkFund(price);

        require(
            address(this) ==
                IERC721(minted721Sell.sellData.collection).getApproved(
                    minted721Sell.tokenId
                ),
            "Minted721Marketplace::Marketplace has not access"
        );

        // Ensure the seller has sufficient token balance
        // require(
        //     landRockerERC721.balanceOf(
        //         minted721Sell.seller,
        //         minted721Sell.tokenId
        //     ) >= minted721Sell.quantity,
        //     "Minted721Marketplace::Insufficient token balance"
        // );

        if (_lrt.balanceOf(msg.sender) >= price) {
            bool success = _lrt.transferFrom(msg.sender, address(this), price);
            require(success, "Minted721Marketplace::Unsuccessful transfer");

            minted721Sell.sellData.status = 1;

            bool isSendCreator = _lrt.transfer(
                minted721Sell.seller,
                minted721Sell.sellData.price
            );
            require(
                isSendCreator,
                "Minted721Marketplace::Unsuccessful transfer"
            );
        } else {
            // If the buyer doesn't have enough LRT, set a debt using the vesting contract
            _lrtVesting.setDebt(msg.sender, minted721Sell.sellData.price);
            //Set the listing to sold
            minted721Sell.sellData.status = 1;
        }

        IERC721(minted721Sell.sellData.collection).safeTransferFrom(
            minted721Sell.seller,
            msg.sender,
            minted721Sell.tokenId
        );
        // (address royaltyRecipient, uint256 royaltyAmount) = _getRoyaltyInfo(
        //     minted721Sell.tokenId,
        //     minted721Sell.sellData.collection,
        //     totalPayment
        // );

        // if (royaltyAmount > 0 && royaltyRecipient != address(0)) {
        //     bool isSendCreator = _lrt.transfer(
        //         minted721Sell.seller,
        //         totalPayment - royaltyAmount
        //     );
        //     require(
        //         isSendCreator,
        //         "Minted721Marketplace::Unsuccessful transfer"
        //     );

        //     bool isSendRoyalty = _lrt.transfer(royaltyRecipient, royaltyAmount);
        //     require(
        //         isSendRoyalty,
        //         "Minted721Marketplace::Unsuccessful transfer"
        //     );
        // } else {
        //     bool isSendCreator = _lrt.transfer(
        //         minted721Sell.seller,
        //         totalPayment
        //     );
        //     require(
        //         isSendCreator,
        //         "Minted721Marketplace::Unsuccessful transfer"
        //     );
        // }

        emit ItemBoughtMinted721(
            _sellID,
            msg.sender,
            minted721Sell.seller,
            minted721Sell.sellData.collection,
            minted721Sell.tokenId
        );
    }

    function withdraw(uint256 _amount) external override onlyAdmin {
        _withdraw(_amount);
    }

    function setLandRockerCollection(
        address _addr
    ) external override onlyAdmin validAddress(_addr) {
        landrocker721Collections[_addr] = true;
        emit CollectionAdded(_addr);
    }
}
