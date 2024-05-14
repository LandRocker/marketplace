// SPDX-License-Identifier: GPL-3.0
pragma solidity 0.8.6;

import {CountersUpgradeable} from "@openzeppelin/contracts-upgradeable/utils/CountersUpgradeable.sol";
import {IERC1155ReceiverUpgradeable} from "@openzeppelin/contracts-upgradeable/interfaces/IERC1155ReceiverUpgradeable.sol";
import {IERC165Upgradeable} from "@openzeppelin/contracts-upgradeable/interfaces/IERC165Upgradeable.sol";

import {ILRTVesting} from "./../../vesting/ILRTVesting.sol";
import {MarketPlaceLib} from "./../MarketplaceLib.sol";
import {Marketplace} from "./../Marketplace.sol";
import {INonMinted1155Marketplace} from "./INonMinted1155Marketplace.sol";
import {ILandRockerERC1155} from "../../tokens/erc1155/ILandRockerERC1155.sol";
/**
 * @title NonMinted1155Marketplace
 * @dev A contract for managing non-minted ERC1155 asset sell orders.
 * This contract inherits from Marketplace and implements the INonMinted1155Marketplace interface.
 */
contract NonMinted1155Marketplace is
    IERC165Upgradeable,
    IERC1155ReceiverUpgradeable,
    Marketplace,
    INonMinted1155Marketplace
{
    // Use counters library for incrementing sell Ids
    using CountersUpgradeable for CountersUpgradeable.Counter;

    bytes32 public constant CATEGORY = keccak256("MARKETPLACE_1155");

    ILRTVesting public lrtVesting;

    // @dev Mapping to store sell for each nonMinted1155 token sell
    mapping(uint256 => NonMinted1155Sell) public override nonMinted1155Sells;
    // Mapping to store discount for each user
    mapping(address => UserDiscount) public override userDiscounts;

    // Counter for sell Ids
    CountersUpgradeable.Counter private _sellIdCounter;

    // Modifier to validate addresses
    modifier validAddress(address _address) {
        require(
            _address != address(0),
            "NonMinted1155Marketplace::Not valid address"
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
     * @param _lrtVesting Address of the LRTVesting contract.

     */
    function initializeNonMinted1155Marketplace(
        address _accessRestriction,
        address _lrt,
        address _landRocker,
        address _lrtVesting
    ) external override initializer {
        Marketplace.initialize(_accessRestriction, _lrt, _landRocker);
        lrtVesting = ILRTVesting(_lrtVesting);
    }

    /**
     * @dev Creates a new sell order for a non-minted ERC1155 asset.
     * @param _price The price of the asset in LRT tokens.
     * @param _collection The address of the ERC1155 collection.
     * @param _expireDate The expiration date for the sell order.
     * @param _listedAmount The total amount of the asset to be listed for sale.
     * @param _sellUnit The unit of the asset being sold in each transaction.
     * Only administrators can create sell orders.
     */
    function createSell(
        uint256 _price,
        address _collection,
        uint64 _expireDate,
        uint256 _listedAmount,
        uint256 _sellUnit,
        uint256 _tokenId
    ) external override onlyAdmin validExpirationDate(_expireDate) {
        _validateSell(_listedAmount, _sellUnit);

        NonMinted1155Sell storage nonMinted1155Sell = nonMinted1155Sells[
            _sellIdCounter.current()
        ];

        require(
            _landrocker.landrocker1155Collections(_collection),
            "NonMinted1155Marketplace::Collection is not active"
        );

        //Set the listing to started
        nonMinted1155Sell.sellData.status = 0;
        nonMinted1155Sell.sellData.collection = _collection;
        nonMinted1155Sell.sellData.expireDate = _expireDate;
        nonMinted1155Sell.sellData.price = _price;
        nonMinted1155Sell.sellUnit = _sellUnit;
        nonMinted1155Sell.listedAmount = _listedAmount;
        nonMinted1155Sell.tokenId = _tokenId;

        emit SellCreated(
            _sellIdCounter.current(),
            msg.sender,
            _collection,
            _expireDate,
            _price,
            _listedAmount,
            _sellUnit,
            _tokenId
        );

        _sellIdCounter.increment();
    }

    /**
     * @dev Edits an existing sell order for a non-minted ERC1155 asset.
     * @param _sellId The unique identifier of the sell order to be edited.
     * @param _price The updated price of the asset in LRT tokens.
     * @param _expireDate The updated expiration date for the sell order.
     * @param _listedAmount The updated total amount of the asset to be listed for sale.
     * @param _sellUnit The updated unit of the asset being sold in each transaction.
     * Only administrators can edit sell orders.
     */
    function editSell(
        uint256 _sellId,
        uint256 _price,
        uint64 _expireDate,
        uint256 _listedAmount,
        uint256 _sellUnit,
        uint256 _tokenId
    ) external override onlyAdmin validExpirationDate(_expireDate) {
        NonMinted1155Sell storage nonMinted1155Sell = nonMinted1155Sells[
            _sellId
        ];

        //Ensure that the sell is there
        require(
            nonMinted1155Sell.sellData.collection != address(0),
            "NonMinted1155Marketplace::The sell does not exist"
        );

        _validateSell(_listedAmount, _sellUnit);

        //Ensure that the listing is not sold
        require(
            nonMinted1155Sell.sellData.status != 1,
            "NonMinted1155Marketplace::Sold listing NFT cannot be edit"
        );

        require(
            _listedAmount >= nonMinted1155Sell.soldAmount + _sellUnit,
            "NonMinted1155Marketplace::Invalid listed amount"
        );

        // require(
        //     _checkTokenSupply(nonMinted1155Sell.sellData.collection, _tokenId, _listedAmount),
        //     "NonMinted1155Marketplace::NFTPool1155 has not enough balance"
        // );

        require(
            _price >=
                ILandRockerERC1155(nonMinted1155Sell.sellData.collection)
                    .floorPrices(nonMinted1155Sell.tokenId),
            "NonMinted1155Marketplace::Price should be greater than floor price"
        );

        // Update the sell order information
        nonMinted1155Sell.sellData.status = 0;
        nonMinted1155Sell.sellData.expireDate = _expireDate;
        nonMinted1155Sell.sellData.price = _price;
        nonMinted1155Sell.sellUnit = _sellUnit;
        nonMinted1155Sell.listedAmount = _listedAmount;
        nonMinted1155Sell.tokenId = _tokenId;

        // Emit an event to indicate the sell order has been updated
        emit SellUpdated(
            _sellId,
            nonMinted1155Sell.sellData.collection,
            _expireDate,
            _price,
            _listedAmount,
            _sellUnit,
            _tokenId
        );
    }

    /**
     * @dev Cancels a sell order.
     * @param _sellId The unique identifier of the sell order to be canceled.
     * Only administrators can cancel sell orders.
     */
    function cancelSell(uint256 _sellId) external override onlyAdmin {
        NonMinted1155Sell storage nonMinted1155Sell = nonMinted1155Sells[
            _sellId
        ];

        //Ensure that the sell is there
        require(
            nonMinted1155Sell.sellData.collection != address(0),
            "NonMinted1155Marketplace::The sell does not exist"
        );

        //Ensure that the listing is started
        require(
            nonMinted1155Sell.sellData.status == 0,
            "NonMinted1155Marketplace::Cannot cancel active offer"
        );
        //Set the listing to canceled
        nonMinted1155Sell.sellData.status = 2;

        emit SellCanceled(_sellId);
    }

    /**
     * @dev Allows a user to purchase a non-minted ERC1155 asset from the marketplace.
     * @param _sellId The unique identifier of the sell order to be purchased.
     * Only non-admin users can call this function to buy assets.
     */
    function buyItem(uint256 _sellId) external override nonReentrant {
        NonMinted1155Sell storage nonMinted1155Sell = nonMinted1155Sells[
            _sellId
        ];

        //Ensure that the sell is there
        // require(
        //     nonMinted1155Sell.sellData.collection != address(0),
        //     "NonMinted1155Marketplace::The sell does not exist"
        // );

        require(
            _landrocker.landrocker1155Collections(
                nonMinted1155Sell.sellData.collection
            ),
            "NonMinted1155Marketplace::Collection is not active"
        );

        // Ensure that the total sold units do not exceed the listed amount
        require(
            nonMinted1155Sell.sellUnit + nonMinted1155Sell.soldAmount <=
                nonMinted1155Sell.listedAmount,
            "NonMinted1155Marketplace::Exceed sell limit"
        );

        //Ensure that the listing is started
        require(
            nonMinted1155Sell.sellData.status == 0,
            "NonMinted1155Marketplace::Listed NFT has not valid status"
        );

        // require(
        //     _checkTokenSupply(
        //         nonMinted1155Sell.sellData.collection,
        //         nonMinted1155Sell.tokenId,
        //         nonMinted1155Sell.sellUnit
        //     ),
        //     "NonMinted1155Marketplace::NFTPool1155 has not enough balance"
        // );

        // Check if the sell order has expired
        _checkHasExpired(nonMinted1155Sell.sellData.expireDate);

        uint256 price = nonMinted1155Sell.sellData.price;

        // Check discount for the sell order
        uint256 totalPayment = _calculateUserDiscount(msg.sender, price);

        bool hasSufficientBalance = _lrt.balanceOf(msg.sender) >= totalPayment;

        // Transfer the LRT tokens from the buyer to the marketplace
        if (hasSufficientBalance) {
            _processTokenPurchase(
                _sellId,
                msg.sender,
                totalPayment,
                nonMinted1155Sell
            );
        } else {
            _processVestingPurchase(
                _sellId,
                msg.sender,
                totalPayment,
                nonMinted1155Sell
            );
        }

        // Update the sold amount and check if the listing is now sold out
        nonMinted1155Sell.soldAmount += nonMinted1155Sell.sellUnit;

        if (nonMinted1155Sell.soldAmount == nonMinted1155Sell.listedAmount) {
            //Set the listing to sold
            nonMinted1155Sell.sellData.status = 1;
        }

        ILandRockerERC1155(nonMinted1155Sell.sellData.collection).mint(
            msg.sender,
            nonMinted1155Sell.tokenId,
            nonMinted1155Sell.sellUnit,
            CATEGORY
        );
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
            "NonMinted1155Marketplace::Invalid usage limit"
        );

        //Ensure that the discount cap is valid
        require(
            _discountCap > 0,
            "NonMinted1155Marketplace::Invalid discount cap"
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
     * @dev Allows the admin to withdraw LRT tokens from the marketplace contract.
     * @param _amount The amount of LRT tokens to be withdrawn.
     * Only the admin can call this function to withdraw tokens.
     */
    function withdraw(uint256 _amount) external override onlyAdmin {
        _withdraw(_amount);
    }

    /**
     * @dev Handles the receipt of ERC1155 tokens when they are transferred to this contract.
     * @param operator The address which called `safeTransferFrom` function (i.e., the sender).
     * @param from The address which previously owned the token.
     * @param id The Id of the ERC1155 token being transferred.
     * @param value The amount of tokens being transferred.
     * @param data Additional data with no specified format.
     * @return A bytes4 magic value, indicating ERC1155Receiver compatibility.
     *  See {IERC1155-onERC1155Received}.
     */
    function onERC1155Received(
        address operator,
        address from,
        uint256 id,
        uint256 value,
        bytes calldata data
    ) external pure override returns (bytes4) {
        return this.onERC1155Received.selector;
    }

    /**
     * @dev Handles the receipt of a batch of ERC1155 tokens when they are transferred to this contract.
     * @param operator The address which called `safeBatchTransferFrom` function (i.e., the sender).
     * @param from The address which previously owned the tokens.
     * @param ids An array of Ids for the ERC1155 tokens being transferred.
     * @param values An array of amounts corresponding to the tokens being transferred.
     * @param data Additional data with no specified format.
     * @return A bytes4 magic value, indicating ERC1155Receiver compatibility (0xbc197c81).
     *  See {IERC1155-onERC1155BatchReceived}.
     */
    function onERC1155BatchReceived(
        address operator,
        address from,
        uint256[] calldata ids,
        uint256[] calldata values,
        bytes calldata data
    ) external pure override returns (bytes4) {
        return this.onERC1155BatchReceived.selector;
    }

    /**
     * @dev See {IERC165Upgradeable-supportsInterface}.
     */
    function supportsInterface(
        bytes4 interfaceId
    ) public view virtual override returns (bool) {
        return
            interfaceId == type(IERC1155ReceiverUpgradeable).interfaceId ||
            interfaceId == type(IERC165Upgradeable).interfaceId;
    }

    /**
     * @dev This internal function calculates the discounted price
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
                "NonMinted1155Marketplace::Discount usage exceeded"
            );

            require(
                userDiscount.discountCap > 0,
                "NonMinted1155Marketplace::Discount cap too low to apply"
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
     * @dev Handles the purchase of a Non-Minted 1155 asset using LRT balance.
     * @param _sellId ID of the sell order.
     * @param _buyer Address of the buyer.
     * @param _totalPayment Price of the asset after discount.
     * @param _sellOrder Details of the sell order for a Non-Minted 1155 asset.
     */
    function _processTokenPurchase(
        uint256 _sellId,
        address _buyer,
        uint256 _totalPayment,
        NonMinted1155Sell memory _sellOrder
    ) private {
        // Check if the buyer has enough funds
        _checkFund(_totalPayment);

        // Transfer LRT tokens from the buyer to the marketplace
        require(
            _lrt.transferFrom(_buyer, address(this), _totalPayment),
            "NonMinted1155Marketplace::Unsuccessful transfer"
        );

        // Emit an event indicating a successful 1155NFT purchase
        emit AssetBought1155WithBalance(
            _sellId,
            msg.sender,
            _sellOrder.tokenId,
            _sellOrder.sellUnit,
            _sellOrder.sellData.price, //price
            _totalPayment //price - discount
        );

        // Process the purchase and transfer funds to the marketplace treasury
        _processPurchase(
            _sellOrder.tokenId,
            _sellOrder.sellData.collection,
            _totalPayment,
            _landrocker.treasury1155()
        );
    }

    /**
     * @dev Handles the purchase of a Non-Minted 1155 asset using vested LRT balance.
     * @param _sellId ID of the sell order.
     * @param _buyer Address of the buyer.
     * @param _totalPayment Price of the asset after discount.
     * @param sellOrder Details of the sell order for a Non-Minted 1155 asset.
     */
    function _processVestingPurchase(
        uint256 _sellId,
        address _buyer,
        uint256 _totalPayment,
        NonMinted1155Sell memory sellOrder
    ) private {
        // Get the vested and claimed amounts from the vesting contract
        (, uint256 vestedAmount, uint256 claimedAmount) = lrtVesting
            .holdersStat(_buyer);

        // Ensure that the buyer has enough vested balance
        require(
            claimedAmount + _totalPayment <= vestedAmount,
            "NonMinted1155Marketplace::Insufficient vested balance"
        );

        // Emit an event indicating a successful 1155NFT purchase
        emit AssetBought1155WithVesting(
            _sellId,
            _buyer,
            sellOrder.tokenId,
            sellOrder.sellUnit,
            sellOrder.sellData.price,
            _totalPayment
        );

        lrtVesting.setDebt(_buyer, _totalPayment);
    }

    /**
     * @dev Validates the parameters for creating or editing a non-minted ERC1155 asset sell order.
     * @param _listedAmount The total amount of the asset listed for sale.
     * @param _sellUnit The unit of the asset being sold in each transaction.
     */
    function _validateSell(
        uint256 _listedAmount,
        uint256 _sellUnit
    ) private pure {
        // Ensure that there are items to sell (listed amount is greater than zero)
        require(
            _listedAmount > 0,
            "NonMinted1155Marketplace::There are not any item to sell"
        );
        // Ensure that at least one item is being sold (sell unit is greater than zero)
        require(
            _sellUnit > 0,
            "NonMinted1155Marketplace::At least one item to sell"
        );
        // Ensure that the listed amount is greater than or equal to the sell unit
        require(
            _listedAmount >= _sellUnit,
            "NonMinted1155Marketplace::Sell unit is larger than listed amount"
        );
        // Ensure that the listed amount is a multiple of the sell unit (divisible without remainder)
        require(
            _listedAmount % _sellUnit == 0,
            "NonMinted1155Marketplace::Listed amount is not a coefficient of sell unit"
        );
    }
}
