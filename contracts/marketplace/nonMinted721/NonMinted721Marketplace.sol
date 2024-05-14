// SPDX-License-Identifier: GPL-3.0
pragma solidity 0.8.6;

import {CountersUpgradeable} from "@openzeppelin/contracts-upgradeable/utils/CountersUpgradeable.sol";
import {IERC721ReceiverUpgradeable} from "@openzeppelin/contracts-upgradeable/interfaces/IERC721ReceiverUpgradeable.sol";
import {IERC165Upgradeable} from "@openzeppelin/contracts-upgradeable/interfaces/IERC165Upgradeable.sol";
import {ILRTVesting} from "./../../vesting/ILRTVesting.sol";
import {Marketplace} from "./../Marketplace.sol";
import {ILandRockerERC721} from "./../../tokens/erc721/ILandRockerERC721.sol";
import {INonMinted721Marketplace} from "./INonMinted721Marketplace.sol";

/**
 * @title NonMinted721Marketplace
 * @dev A contract for managing non-minted ERC721 asset sell orders.
 * This contract inherits from Marketplace and implements the INonMinted721Marketplace interface.
 */
contract NonMinted721Marketplace is
    Marketplace,
    IERC721ReceiverUpgradeable,
    IERC165Upgradeable,
    INonMinted721Marketplace
{
    bytes32 public constant CATEGORY = keccak256("MARKETPLACE_721");

    using CountersUpgradeable for CountersUpgradeable.Counter;

    ILRTVesting public lrtVesting;

    // Mapping to store sell orders and collections
    mapping(uint256 => NonMinted721Sell) public override nonMinted721Sells;
    // Mapping to store discount for each user
    mapping(address => UserDiscount) public override userDiscounts;

    CountersUpgradeable.Counter private _sellIdCounter;

    // Modifier to check if an address is valid (not null)
    modifier validAddress(address _address) {
        require(
            _address != address(0),
            "NonMinted721Marketplace::Not valid address"
        );
        _;
    }

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    /**
     * @dev Initializes the NonMinted721Marketplace contract.
     * @param _accessRestriction Address of the access restriction contract.
     * @param _lrt Address of the LRT token contract.
     * @param _landRocker Address of the LandRocker contract.
     * @param _lrtVesting Address of the LRT Vesting contract.
     */
    function initializeNonMinted721Marketplace(
        address _accessRestriction,
        address _lrt,
        address _landRocker,
        address _lrtVesting
    ) external override initializer {
        // Initialize the Marketplace contract with access control addresses
        Marketplace.initialize(_accessRestriction, _lrt, _landRocker);
        lrtVesting = ILRTVesting(_lrtVesting);
    }

    /**
     * @dev Creates a new sell order for non-minted ERC721 assets.
     * @param _price The price at which the asset is to be sold.
     * @param _collection The address of the ERC721 collection.
     * @param _expireDate The expiration date of the sell order.
     */
    function createSell(
        uint256 _price,
        address _collection,
        uint64 _expireDate
    ) external override onlyAdmin validExpirationDate(_expireDate) {
        // Get the current sell order
        NonMinted721Sell storage nonMinted721Sell = nonMinted721Sells[
            _sellIdCounter.current()
        ];

        // require(
        //     _price >= _floorPrice,
        //     "NonMinted721Marketplace::Price should be greater than floor price"
        // );

        require(
            _landrocker.landrocker721Collections(_collection),
            "NonMinted721Marketplace::Collection is not active"
        );

        // Set the status to active
        nonMinted721Sell.sellData.status = 0;
        // Assign collection, expire date, and price and item id to the sell order
        nonMinted721Sell.sellData.collection = _collection;
        nonMinted721Sell.sellData.expireDate = _expireDate;
        nonMinted721Sell.sellData.price = _price;

        // Emit an event for the created sell order
        emit SellCreated(
            _sellIdCounter.current(),
            address(this),
            _collection,
            _expireDate,
            _price
        );
        // Increment the sell order counter
        _sellIdCounter.increment();
    }

    /**
     * @dev Edits an existing sell order for non-minted ERC721 assets.
     * @param _sellId The Id of the sell order to be edited.
     * @param _price The updated price at which the asset is to be sold.
     * @param _collection The address of the ERC721 collection.
     * @param _expireDate The updated expiration date of the sell order.
     */
    function editSell(
        uint256 _sellId,
        uint256 _price,
        address _collection,
        uint64 _expireDate
    ) external override onlyAdmin validExpirationDate(_expireDate) {
        // Get the sell order based on sell Id
        NonMinted721Sell storage nonMinted721Sell = nonMinted721Sells[_sellId];

        //Ensure that the sell is there
        // require(
        //     nonMinted721Sell.sellData.collection != address(0),
        //     "NonMinted721Marketplace::The sell does not exist"
        // );

        require(
            _landrocker.landrocker721Collections(_collection),
            "NonMinted721Marketplace::Collection is not active"
        );

        // Check that the NFT hasn't been sold
        require(
            nonMinted721Sell.sellData.status != 1,
            "NonMinted721Marketplace::Sold NFT cannot be edit"
        );

        // require(
        //     _price >=
        //         ILandRockerERC721(_collection).floorPrices(
        //             nonMinted721Sell.tokenId
        //         ),
        //     "NonMinted721Marketplace::Price should be greater than floor price"
        // );

        // Update the expire date and price, in addition to setting the sale active
        nonMinted721Sell.sellData.status = 0;
        nonMinted721Sell.sellData.collection = _collection;
        nonMinted721Sell.sellData.expireDate = _expireDate;
        nonMinted721Sell.sellData.price = _price;

        // Emit an event indicating the edit
        emit SellUpdated(_sellId, _collection, _expireDate, _price);
    }

    /**
     * @dev Cancels an active sell order for non-minted ERC721 assets.
     * @param _sellId The Id of the sell order to be canceled.
     */
    function cancelSell(uint256 _sellId) external override onlyAdmin {
        // Retrieve the sell order
        NonMinted721Sell storage nonMinted721Sell = nonMinted721Sells[_sellId];

        //Ensure that the sell is there
        require(
            nonMinted721Sell.sellData.collection != address(0),
            "NonMinted721Marketplace::The sell does not exist"
        );

        // Check if the order is not sold or canceled
        require(
            nonMinted721Sell.sellData.status == 0,
            "NonMinted721Marketplace::Cannot cancel active offer"
        );

        // Check if the order is not sold or canceled
        nonMinted721Sell.sellData.status = 2;

        // Emit an event indicating the cancellation
        emit SellCanceled(_sellId);
    }

    /**
     * @dev Allows a user to purchase a non-minted ERC721 asset from a sell order.
     * @param _sellId The Id of the sell order to be purchased.
     */
    function buyItem(uint256 _sellId) external override nonReentrant {
        // Retrieve information about the sell order
        NonMinted721Sell storage nonMinted721Sell = nonMinted721Sells[_sellId];

        // //Ensure that the sell is there
        // require(
        //     nonMinted721Sell.sellData.collection != address(0),
        //     "NonMinted721Marketplace::The sell does not exist"
        // );

        require(
            _landrocker.landrocker721Collections(
                nonMinted721Sell.sellData.collection
            ),
            "NonMinted721Marketplace::Collection is not active"
        );

        // Ensure the sell order is in a valid status (0 indicates an active listing)
        require(
            nonMinted721Sell.sellData.status == 0,
            "NonMinted721Marketplace::Listed NFT has not valid status"
        );

        // Check if the sell order has expired
        _checkHasExpired(nonMinted721Sell.sellData.expireDate);

        uint256 price = nonMinted721Sell.sellData.price;

        // Check discount for the sell order
        uint256 totalPayment = _calculateUserDiscount(msg.sender, price);

        bool hasSufficientBalance = _lrt.balanceOf(msg.sender) >= price;

        // Mark the sell order as purchased (status 1 indicates a sold NFT)
        nonMinted721Sell.sellData.status = 1;

        if (hasSufficientBalance) {
            _proccessTokenPurchase(
                _sellId,
                msg.sender,
                totalPayment,
                nonMinted721Sell
            );
        } else {
            _processVestingPurchase(
                _sellId,
                msg.sender,
                totalPayment,
                nonMinted721Sell
            );
        }
    }

    /**
     * @dev Allows the contract owner to withdraw a specified amount of funds.
     * @param _amount The amount to be withdrawn.
     */
    function withdraw(uint256 _amount) external override onlyAdmin {
        // Call the internal _withdraw function to perform the withdrawal
        _withdraw(_amount);
    }

    /**
     * @notice Sets or updates a discount for a specific user.
     * @dev This function is used to provide special pricing or privileges to selected users within the system.
     * @param _user Address of the user for whom the discount is being set or updated.
     * @param _discountRate Percentage discount to be applied for the user's transactions. Expressed as a value between 0 and 100.
     * @param _expireDate The timestamp indicating the date and time when the discount expires.
     * @param _usageLimit Number of times the discount can be utilized before expiration.
     * @param _discountCap Maximum amount of discount that can be applied for the user's transactions within the specified period.
     */
    function setUserDiscount(
        address _user,
        uint64 _discountRate,
        uint64 _expireDate,
        uint64 _usageLimit,
        uint256 _discountCap
    )
        external
        override
        onlyScript
        validAddress(_user)
        validExpirationDate(_expireDate)
    {
        UserDiscount storage userDiscount = userDiscounts[_user];

        //Ensure that the usageLimit is valid
        require(
            _usageLimit > userDiscount.usedDiscount,
            "NonMinted721Marketplace::Invalid usage limit"
        );

        //Ensure that the discount cap is valid
        require(
            _discountCap > 0,
            "NonMinted721Marketplace::Invalid discount cap"
        );

        userDiscount.discountRate = _discountRate;
        userDiscount.expireDate = _expireDate;
        userDiscount.usageLimit = _usageLimit;
        userDiscount.discountCap = _discountCap;

        emit UserDiscountSet(
            _user,
            _discountRate,
            _expireDate,
            _usageLimit,
            _discountCap
        );
    }

    /**
     * @dev Handles the receipt of ERC721 tokens when they are transferred to this contract.
     * @param operator The address which called `safeTransferFrom` function (i.e., the sender).
     * @param from The address which previously owned the token.
     * @param tokenId The token Id of the ERC721 token being transferred.
     * @param data Additional data with no specified format.
     *  See {IERC721-onERC721Received}.
     */
    function onERC721Received(
        address operator,
        address from,
        uint256 tokenId,
        bytes calldata data
    ) external pure override returns (bytes4) {
        return this.onERC721Received.selector;
    }

    /**
     * @dev See {IERC165Upgradeable-supportsInterface}.
     */
    function supportsInterface(
        bytes4 interfaceId
    ) public view virtual override returns (bool) {
        return
            interfaceId == type(IERC721ReceiverUpgradeable).interfaceId ||
            interfaceId == type(IERC165Upgradeable).interfaceId;
    }

    /**
     * @dev This internal function calculates the discounted price.
     * @param _user Address of the user for whom the discount is being calculated.
     * @param _price The original price before applying the discount.
     */
    function _calculateUserDiscount(
        address _user,
        uint256 _price
    ) private returns (uint256) {
        UserDiscount storage userDiscount = userDiscounts[_user];

        uint256 totalPayment = _price;
        if (userDiscount.discountRate > 0) {
            _checkHasExpired(userDiscount.expireDate);
            require(
                userDiscount.usedDiscount < userDiscount.usageLimit,
                "NonMinted721Marketplace::Discount usage exceeded"
            );

            require(
                userDiscount.discountCap > 0,
                "NonMinted721Marketplace::Discount cap too low to apply"
            );

            uint256 discountAmount = (userDiscount.discountRate * _price) /
                10000;
            if (discountAmount > userDiscount.discountCap) {
                discountAmount = userDiscount.discountCap;
            }

            totalPayment = _price - discountAmount;
            userDiscount.usedDiscount++;
        }

        return totalPayment;
    }

    /**
     * @dev Processes a token purchase using the buyer's LRT balance.
     * @param _sellId ID of the sell order.
     * @param _buyer Address of the buyer.
     * @param _totalPayment Price of the asset after discount.
     * @param _sellOrder Sell order details.
     */
    function _proccessTokenPurchase(
        uint256 _sellId,
        address _buyer,
        uint256 _totalPayment,
        NonMinted721Sell memory _sellOrder
    ) private {
        // Check if the buyer has enough funds
        _checkFund(_totalPayment);

        // Transfer the LRT tokens from the buyer to the marketplace
        require(
            _lrt.transferFrom(_buyer, address(this), _totalPayment),
            "NonMinted721Marketplace::Unsuccessful transfer"
        );

        uint256 tokenId = ILandRockerERC721(_sellOrder.sellData.collection)
            .safeMint(_buyer, CATEGORY);
        _sellOrder.tokenId = tokenId;

        // Process the purchase and transfer funds to the marketplace treasury
        _processPurchase(
            tokenId,
            _sellOrder.sellData.collection,
            _totalPayment,
            _landrocker.treasury721()
        );

        // Emit an event indicating a successful 721NFT purchase
        emit AssetBought721WithBalance(
            _sellId,
            _buyer,
            _sellOrder.sellData.collection,
            _sellOrder.sellData.price,
            _totalPayment,
            tokenId
        );
    }

    /**
     * @dev Processes a token purchase using the buyer's vested LRT balance.
     * @param _sellId ID of the sell order.
     * @param _buyer Address of the buyer.
     * @param _totalPayment Price of the asset after discount.
     * @param _sellOrder Sell order details.
     */
    function _processVestingPurchase(
        uint256 _sellId,
        address _buyer,
        uint256 _totalPayment,
        NonMinted721Sell memory _sellOrder
    ) private {
        uint256 vestedAmount = 0;
        uint claimedAmount = 0;
        // Get the vested and claimed amounts from the vesting contract
        (, vestedAmount, claimedAmount) = lrtVesting.holdersStat(_buyer);

        // Ensure that the buyer has enough vested balance
        require(
            claimedAmount + _totalPayment <= vestedAmount,
            "NonMinted721Marketplace::Insufficient vested balance"
        );

        // If the buyer doesn't have enough LRT, set a debt using the vesting contract
        lrtVesting.setDebt(_buyer, _totalPayment);

        uint256 tokenId = ILandRockerERC721(_sellOrder.sellData.collection)
            .safeMint(_buyer, CATEGORY);
        _sellOrder.tokenId = tokenId;

        // ILandRockerERC721(_sellOrder.sellData.collection).mint(_buyer, _sellOrder.tokenId,CATEGORY);

        // Emit an event indicating a successful 721NFT purchase
        emit AssetBought721WithVesting(
            _sellId,
            _buyer,
            _sellOrder.sellData.collection,
            _sellOrder.sellData.price,
            _totalPayment,
            tokenId
        );
    }
}
