// SPDX-License-Identifier: GPL-3.0
pragma solidity 0.8.6;

import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import {CountersUpgradeable} from "@openzeppelin/contracts-upgradeable/utils/CountersUpgradeable.sol";

import {ILandRockerERC1155} from "./../../tokens/erc1155/ILandRockerERC1155.sol";
import {MarketplaceUpgraded} from "./MarketplaceUpgraded.sol";
import {IMinted1155MarketplaceUpgraded} from "./IMinted1155MarketplaceUpgraded.sol";

/**
 * @title Minted1155Marketplace
 * @dev A contract for managing minted ERC1155 asset sell orders.
 * This contract inherits from Marketplace and implements the IMinted1155Marketplace interface.
 */
contract Minted1155MarketplaceUpgraded is
    MarketplaceUpgraded,
    IMinted1155MarketplaceUpgraded
{
    // Use counters library for incrementing sell Ids
    using CountersUpgradeable for CountersUpgradeable.Counter;

    ILandRockerERC1155 public landRockerERC1155;

    /**
     * @dev Mapping to store sell for each Minted1155 token sell
     */
    mapping(uint256 => Minted1155Sell) public override minted1155Sells;
    // Storage for approved Minted1155 token collections
    mapping(address => bool) public override landrocker1155Collections;

    // Counter for sell Ids
    CountersUpgradeable.Counter private _sellIdCounter;

    string public override greeting;

    // Modifier to validate addresses
    modifier validAddress(address _address) {
        require(
            _address != address(0),
            "Minted1155Marketplace::Not valid address"
        );
        _;
    }
    // Modifier to validate Minted1155 token collections
    modifier validCollection(address _collection) {
        require(
            landrocker1155Collections[_collection],
            "Minted1155Marketplace::Token contract is invalid"
        );
        _;
    }

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    /**
     * @dev Initializes the contract with necessary addresses.
     * @param _accessRestriction Address of the access restriction contract.
     * @param _lrt Address of the LRT token contract.
     * @param _landRocker Address of the LandRocker contract.
     */

    function initializeMinted1155MarketplaceUpgraded(
        address _accessRestriction,
        address _lrt,
        address _landRocker,
        string memory _greeting
    ) external override reinitializer(2) {
        MarketplaceUpgraded.initialize(_accessRestriction, _lrt, _landRocker);

        greeting = _greeting;
    }

    /**
     * @dev Allows sellers to create new sell orders for Minted1155 tokens.
     *
     * @param _price The price per unit of the token.
     * @param _collection The address of the NFT collection.
     * @param _expireDate The expiration date of the sell order.
     * @param _tokenId The unique identifier of the Minted1155 token.
     * @param _quantity The quantity of tokens to sell.
     */
    function createSell(
        uint256 _price,
        address _collection,
        uint64 _expireDate,
        uint256 _tokenId,
        uint256 _quantity
    )
        external
        override
        validExpirationDate(_expireDate)
        validCollection(_collection)
    {
        _validateSell(_quantity, _collection, _tokenId);

        require(
            _price >= ILandRockerERC1155(_collection).floorPrices(_tokenId),
            "Minted1155Marketplace::Invalid price"
        );

        Minted1155Sell storage minted1155Sell = minted1155Sells[
            _sellIdCounter.current()
        ];

        //Set the listing to started
        minted1155Sell.sellData.status = 0;
        minted1155Sell.sellData.collection = _collection;
        minted1155Sell.sellData.expireDate = _expireDate;
        minted1155Sell.sellData.price = _price;
        minted1155Sell.tokenId = _tokenId;
        minted1155Sell.quantity = _quantity;
        minted1155Sell.seller = msg.sender;

        emit SellCreated(
            _sellIdCounter.current(),
            msg.sender,
            _collection,
            _price,
            _expireDate,
            _tokenId,
            _quantity
        );
        _sellIdCounter.increment();
    }

    /**
     * @dev Allows sellers to edit their existing sell orders for Minted1155 tokens.
     * @param _sellId The unique identifier of the sell order to edit.
     * @param _price The new price per unit of the token.
     * @param _collection The address of the NFT collection.
     * @param _expireDate The new expiration date of the sell order.
     * @param _tokenId The new unique identifier of the Minted1155 token.
     * @param _quantity The new quantity of tokens to sell.
     */
    function editSell(
        uint256 _sellId,
        uint256 _price,
        address _collection,
        uint64 _expireDate,
        uint256 _tokenId,
        uint256 _quantity
    )
        external
        override
        validExpirationDate(_expireDate)
        validCollection(_collection)
    {
        Minted1155Sell storage minted1155Sell = minted1155Sells[_sellId];

        //Ensure that the sell is there
        require(
            minted1155Sell.sellData.collection != address(0),
            "Minted1155Marketplace::The sell does not exist"
        );

        _validateSell(_quantity, _collection, _tokenId);

        require(
            _price >= ILandRockerERC1155(_collection).floorPrices(_tokenId),
            "Minted1155Marketplace::Invalid price"
        );

        //Ensure that the listing is not sold
        require(
            minted1155Sell.sellData.status == 2,
            "Minted1155Marketplace::listing NFT cannot be edit"
        );

        // Ensure the caller is the owner of the sell order
        require(
            msg.sender == minted1155Sell.seller,
            "Minted1155Marketplace::You are not owner"
        );

        //Set the listing to started
        minted1155Sell.sellData.status = 0;
        minted1155Sell.sellData.expireDate = _expireDate;
        minted1155Sell.sellData.price = _price;
        minted1155Sell.tokenId = _tokenId;
        minted1155Sell.quantity = _quantity;

        emit SellUpdated(
            _sellId,
            msg.sender,
            _collection,
            _expireDate,
            _price,
            _tokenId,
            _quantity
        );
    }

    /**
     * @dev Allows sellers to cancel their active sell orders.
     * @param _sellId The unique identifier of the sell order to cancel.
     */
    function cancelSell(uint256 _sellId) external override {
        Minted1155Sell storage minted1155Sell = minted1155Sells[_sellId];

        //Ensure that the sell is there
        require(
            minted1155Sell.sellData.collection != address(0),
            "Minted1155Marketplace::The sell does not exist"
        );

        // Ensure the caller is the owner of the sell order and it's not sold
        require(
            msg.sender == minted1155Sell.seller,
            "Minted1155Marketplace::You are not owner"
        );
        // Ensure that the listing is started
        require(
            minted1155Sell.sellData.status != 1,
            "Minted1155Marketplace::Cannot cancel sold NFT"
        );

        //Set the listing to canceled
        minted1155Sell.sellData.status = 2;

        // Ensure the marketplace's approval for the seller's tokens is revoked
        require(
            (
                !(
                    ILandRockerERC1155(minted1155Sell.sellData.collection)
                        .isApprovedForAll(minted1155Sell.seller, address(this))
                )
            ),
            "Minted1155Marketplace::Marketplace approve are not revoked"
        );

        emit SellCanceled(_sellId);
    }

    /**
     * @dev Allows buyers to purchase Minted1155 tokens from the marketplace.
     * @param _sellId The unique identifier of the sell order to buy.
     */
    function buyItem(uint256 _sellId) external override nonReentrant {
        Minted1155Sell storage minted1155Sell = minted1155Sells[_sellId];

        //Ensure that the sell is there
        require(
            minted1155Sell.sellData.collection != address(0),
            "Minted1155Marketplace::The sell does not exist"
        );

        //Ensure that the listing is started
        require(
            minted1155Sell.sellData.status == 0,
            "Minted1155Marketplace::Sell has invalid status"
        );

        uint256 price = minted1155Sell.sellData.price;
        // Check if the sell order has expired
        _checkHasExpired(minted1155Sell.sellData.expireDate);
        // Check if the buyer has sufficient funds
        _checkFund(price);

        // Ensure the marketplace has approval to transfer the seller's tokens
        require(
            (
                ILandRockerERC1155(minted1155Sell.sellData.collection)
                    .isApprovedForAll(minted1155Sell.seller, address(this))
            ),
            "Minted1155Marketplace::Marketplace has not access"
        );

        // Ensure that the seller has sufficient token balance
        require(
            ILandRockerERC1155(minted1155Sell.sellData.collection).balanceOf(
                minted1155Sell.seller,
                minted1155Sell.tokenId
            ) >= minted1155Sell.quantity,
            "Minted1155Marketplace::Insufficient token balance"
        );

        // Ensure that the buyer has enough LRT tokens to make the purchase
        require(
            _lrt.balanceOf(msg.sender) >= price,
            "Minted1155Marketplace::Insufficient token balance"
        );

        uint256 totalPayment = _deductSystemFee(price);

        //Ensure that the transfer of the LRT tokens from the buyer to the marketplace contract was successful and
        require(
            _lrt.transferFrom(msg.sender, address(this), price),
            "Minted1155Marketplace::Unsuccessful transfer"
        );
        //Set the listing to sold
        minted1155Sell.sellData.status = 1;

        _processPurchase(
            minted1155Sell.tokenId,
            minted1155Sell.sellData.collection,
            totalPayment,
            minted1155Sell.seller
        );

        // Emit an event to indicate the successful purchase
        emit UserAssetBought1155(
            _sellId,
            msg.sender,
            minted1155Sell.seller,
            minted1155Sell.sellData.collection,
            minted1155Sell.tokenId,
            minted1155Sell.quantity,
            totalPayment
        );

        // Transfer the purchased tokens to the buyer
        ILandRockerERC1155(minted1155Sell.sellData.collection).safeTransferFrom(
            minted1155Sell.seller,
            msg.sender,
            minted1155Sell.tokenId,
            minted1155Sell.quantity,
            ""
        );
    }

    /**
     * @dev Allows the contract owner/admin to withdraw funds from the marketplace.
     * @param _amount The amount of funds to withdraw.
     */
    function withdraw(uint256 _amount) external override onlyAdmin {
        _withdraw(_amount);
    }

    /**
     * @dev Set the validation status of a Minted1155 NFT collection.
     * @param _addr The address of the Minted1155 NFT collection contract.
     * @param _isActive A boolean indicating collection status
     */
    function setLandRockerCollection(
        address _addr,
        bool _isActive
    ) external override onlyAdmin validAddress(_addr) {
        // Update the validation status for the specified collection
        landrocker1155Collections[_addr] = _isActive;
        // Emit the CollectionAdded event
        emit CollectionAdded(_addr, _isActive);
    }

    /**
     * @dev Private function to validate a sell order.     
     * @param _quantity The quantity of tokens to sell.
     
     * @param _collection The address of the NFT collection.
     * @param _tokenId The unique identifier of the Minted1155 token.
     */
    function _validateSell(
        uint256 _quantity,
        address _collection,
        uint256 _tokenId
    ) private view {
        //Ensure that the seller is attempting to sell at least one item.
        require(
            _quantity > 0,
            "Minted1155Marketplace::At least one item to sell"
        );
        //Ensure that the seller (msg.sender) has a sufficient balance of Minted1155 tokens.
        require(
            _quantity <=
                ILandRockerERC1155(_collection).balanceOf(msg.sender, _tokenId),
            "Minted1155Marketplace::You do not have enough balance"
        );
        //Ensure that the msg.sender has granted approval for the marketplace contract (address(this)) to manage their Minted1155 tokens.
        require(
            (
                ILandRockerERC1155(_collection).isApprovedForAll(
                    msg.sender,
                    address(this)
                )
            ),
            "Minted1155Marketplace::Marketplace has not access"
        );
    }
}
