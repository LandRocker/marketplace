// SPDX-License-Identifier: GPL-3.0

pragma solidity 0.8.6;
import {IERC721} from "@openzeppelin/contracts/interfaces/IERC721.sol";
import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import {UUPSUpgradeable} from "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import {CountersUpgradeable} from "@openzeppelin/contracts-upgradeable/utils/CountersUpgradeable.sol";

import {IAccessRestriction} from "./../../access/IAccessRestriction.sol";
import {ILandRockerERC721} from "./../../tokens/erc721/ILandRockerERC721.sol";
import {ILRTVesting} from "./../../vesting/ILRTVesting.sol";
import {ILRT} from "./../../tokens/erc20/ILRT.sol";
import {ILandRocker} from "./../../landrocker/ILandRocker.sol";
import {Marketplace} from "./../../marketplace/Marketplace.sol";
import {IMinted721MarketplaceUpgraded} from "./IMinted721MarketplaceUpgraded.sol";

// import "hardhat/console.sol";

contract Minted721MarketplaceUpgraded is
    Marketplace,
    IMinted721MarketplaceUpgraded
{
    using CountersUpgradeable for CountersUpgradeable.Counter;

    ILandRockerERC721 public landRockerERC721;

    // Storage for Minted721 sell listings
    mapping(uint256 => Minted721Sell) public override minted721Sells;
    // Storage for approved Minted721 token collections
    mapping(address => bool) public override landrocker721Collections;

    CountersUpgradeable.Counter private _sellIdCounter;

    string public override greeting;

    // Modifier to validate addresses
    modifier validAddress(address _address) {
        require(
            _address != address(0),
            "Minted721Marketplace::Not valid address"
        );
        _;
    }
    // Modifier to validate Minted721 token collections
    modifier validCollection(address _collection) {
        require(
            landrocker721Collections[_collection],
            "Minted721Marketplace::Token contract is invalid"
        );
        _;
    }

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    /**
     * @dev Initialize the contract with essential addresses and parameters.
     * @param _accessRestriction The address of the access restriction contract.
     * @param _lrt The address of the LRT token contract.
     * @param _landRocker The address of the LandRocker contract.
     */
    function initilizeMinted721Marketplace(
        address _accessRestriction,
        address _lrt,
        address _landRocker,
        string memory _greeting
    ) external override reinitializer(2) {
        // Initialize the parent contract
        Marketplace.initialize(_accessRestriction, _lrt, _landRocker);

        greeting = _greeting;
    }

    /**
     * @dev Create a new sell listing for a Minted721 NFT.
     * @param _price The price of the NFT.
     * @param _collection The address of the NFT collection.
     * @param _expireDate The expiration date of the sell listing.
     * @param _tokenId The Id of the Minted721 NFT.
     */
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
        // Ensure that the caller is the owner of the NFT
        require(
            msg.sender == IERC721(_collection).ownerOf(_tokenId),
            "Minted721Marketplace::You are not owner"
        );

        // Ensure that the Marketplace has access to the NFT
        require(
            address(this) == IERC721(_collection).getApproved(_tokenId),
            "Minted721Marketplace::Marketplace has not access"
        );

        // Create a new Minted721 sell listing
        Minted721Sell storage minted721Sell = minted721Sells[
            _sellIdCounter.current()
        ];
        minted721Sell.sellData.status = 0;
        minted721Sell.sellData.collection = _collection;
        minted721Sell.sellData.expireDate = _expireDate;
        minted721Sell.sellData.price = _price;
        minted721Sell.tokenId = _tokenId;
        minted721Sell.seller = msg.sender;

        // Emit the SellCreated event
        emit SellCreated(
            _sellIdCounter.current(),
            msg.sender,
            _collection,
            _expireDate,
            _price,
            _tokenId
        );

        // Increment the sell listing counter
        _sellIdCounter.increment();
    }

    /**
     * @dev Edit a Minted721 sell listing, updating its price, expiration date, or token Id.
     * @param _sellId The Id of the sell listing to edit.
     * @param _price The updated price of the NFT.
     * @param _collection The address of the NFT collection.
     * @param _expireDate The updated expiration date of the sell listing.
     * @param _tokenId The updated Id of the Minted721 NFT.
     */
    function editSell(
        uint256 _sellId,
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
        // Retrieve the Minted721 sell listing to be edited
        Minted721Sell storage minted721Sell = minted721Sells[_sellId];
        require(
            minted721Sell.sellData.status == 2,
            "Minted721Marketplace::listing NFT cannot be edit"
        );

        // Ensure that a sold NFT cannot be edited
        require(
            msg.sender == IERC721(_collection).ownerOf(_tokenId),
            "Minted721Marketplace::You are not owner"
        );
        // Ensure that the caller is the owner of the NFT
        require(
            address(this) == IERC721(_collection).getApproved(_tokenId),
            "Minted721Marketplace::Marketplace has not access"
        );

        // Update the sell listing with the new price, expiration date, and token Id
        minted721Sell.sellData.expireDate = _expireDate;
        minted721Sell.sellData.price = _price;
        minted721Sell.tokenId = _tokenId;

        // Emit the SellUpdated event
        emit SellUpdated(
            _sellId,
            msg.sender,
            _collection,
            _expireDate,
            _price,
            _tokenId
        );
    }

    /**
     * @dev Cancel a Minted721 sell listing.
     * @param _sellId The Id of the sell listing to cancel.
     */
    function cancelSell(uint256 _sellId) external override {
        Minted721Sell storage minted721Sell = minted721Sells[_sellId];

        /**
         * @dev Cancel a Minted721 sell listing.
         * @param _sellId The Id of the sell listing to cancel.
         */
        require(
            msg.sender == minted721Sell.seller,
            "Minted721Marketplace::You are not owner"
        );

        // Ensure that a sold NFT cannot be canceled
        require(
            minted721Sell.sellData.status != 1,
            "Minted721Marketplace::Cannot cancel sold NFT"
        );

        // Mark the sell listing as canceled
        minted721Sell.sellData.status = 2;

        // Ensure that the Marketplace approval is revoked
        require(
            address(0) ==
                IERC721(minted721Sell.sellData.collection).getApproved(
                    minted721Sell.tokenId
                ),
            "Minted721Marketplace::Marketplace approve are not revoked"
        );

        // Emit the SellCanceled event
        emit SellCanceled(_sellId);
    }

    /**
     * @dev Buy a Minted721 NFT from the Marketplace.
     * @param _sellId The Id of the sell listing to purchase.
     */
    function buyItem(uint256 _sellId) external override {
        Minted721Sell storage minted721Sell = minted721Sells[_sellId];

        // Ensure that the listing is in a valid state (not sold)
        require(
            minted721Sell.sellData.status == 0,
            "Minted721Marketplace::Listed NFT has not valid status"
        );

        uint256 price = minted721Sell.sellData.price;
        // Ensure that the listing is in a valid state (not sold)
        _checkHasExpired(minted721Sell.sellData.expireDate);
        // Check if the buyer has sufficient funds
        _checkFund(price);

        // Ensure that the Marketplace has access to the NFT
        require(
            address(this) ==
                IERC721(minted721Sell.sellData.collection).getApproved(
                    minted721Sell.tokenId
                ),
            "Minted721Marketplace::Marketplace has not access"
        );

        // Ensure that the buyer has enough LRT tokens to make the purchase
        require(
            _lrt.balanceOf(msg.sender) >= price,
            "Minted721Marketplace::Insufficient token balance"
        );

        // Retrieve the system fee percentage from LandRocker contract
        uint256 systemFee = _landrocker.systemFee();
        // Calculate the total payment after system fee deduction
        uint256 totalPayment = ((10000 - systemFee) * price) / 10000;

        // Retrieve royalty information for the item
        (address royaltyRecipient, uint256 royaltyAmount) = _getRoyaltyInfo(
            minted721Sell.tokenId,
            minted721Sell.sellData.collection,
            totalPayment
        );

        // Transfer the payment from the buyer to the Marketplace
        require(
            _lrt.transferFrom(msg.sender, address(this), price),
            "Minted721Marketplace::Unsuccessful transfer"
        );

        // Mark the listing as sold
        minted721Sell.sellData.status = 1;

        // Check if there's a royalty fee and a valid recipient
        if (royaltyAmount > 0 && royaltyRecipient != address(0)) {
            // Transfer funds to the seller
            require(
                _lrt.transfer(
                    minted721Sell.seller,
                    totalPayment - royaltyAmount
                ),
                "Minted721Marketplace::Unsuccessful transfer"
            );

            // Transfer funds to the royalty recipient
            require(
                _lrt.transfer(royaltyRecipient, royaltyAmount),
                "Minted721Marketplace::Unsuccessful transfer"
            );
        } else {
            // Transfer payment to the seller
            require(
                _lrt.transfer(minted721Sell.seller, totalPayment),
                "Minted721Marketplace::Unsuccessful transfer"
            );
        }

        // Emit the UserAssetBought721 event
        emit UserAssetBought721(
            _sellId,
            msg.sender,
            minted721Sell.seller,
            minted721Sell.sellData.collection,
            minted721Sell.tokenId,
            totalPayment
        );

        // Transfer the NFT from the seller to the buyer
        IERC721(minted721Sell.sellData.collection).safeTransferFrom(
            minted721Sell.seller,
            msg.sender,
            minted721Sell.tokenId
        );
    }

    /**
     * @dev Withdraw LRT tokens from the Marketplace contract.
     * @param _amount The amount of LRT tokens to withdraw.
     */
    function withdraw(uint256 _amount) external override onlyAdmin {
        // Call the internal _withdraw function to process the withdrawal
        _withdraw(_amount);
    }

    /**
     * @dev Sets whether a particular ERC721 collection is considered valid.
     * @param _addr The address of the ERC721 collection contract.
     * @param _isActive A boolean indicating if the collection is active for sell.
     */
    function setLandRockerCollection(
        address _addr,
        bool _isActive
    ) external override onlyAdmin validAddress(_addr) {
        landrocker721Collections[_addr] = _isActive;
        // Emit an event upon successful validation status update.
        emit CollectionAdded(_addr, _isActive);
    }
}
