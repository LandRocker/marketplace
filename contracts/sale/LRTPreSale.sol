// SPDX-License-Identifier: GPL-3.0
pragma solidity 0.8.6;

import {ReentrancyGuard} from "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import {IAccessRestriction} from "../access/IAccessRestriction.sol";
import {ILRTVesting} from "./../vesting/ILRTVesting.sol";
import {ILRTPreSale} from "./ILRTPreSale.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {AggregatorV3Interface} from "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";

/**
 * @title LRTPreSale contract
 * @dev LRT presale implementation
 */

contract LRTPreSale is ReentrancyGuard, ILRTPreSale {
    // Constants

    /**
     * @dev Minimum time required between purchases
     *
     * Set to 1 day to limit each address to 1 purchase per day.
     */
    uint32 public constant TIME_BETWEEN_PURCHASES = 1 days;
    // State Variables

    /**
     * @dev Current LRT token price
     */
    uint256 public override lrtPrice;

    /**
     * @dev Vesting plan ID for purchased LRT
     */
    uint256 public override planID;

    /**
     * @dev Total LRT tokens sold through presale
     */
    uint256 public override lrtSold;

    /**
     * @dev Maximum LRT tokens allocated to presale
     */
    uint256 public override lrtLimit;

    /**
     * @dev Minimum LRT tokens user can purchase
     */
    uint256 public override minLrtPerUser;

    /**
     * @dev Sale discount percentage for whitelisted addresses
     */
    uint256 public override discount;

    /**
     * @dev Limit for total LRT purchased per user based on dollar
     */
    uint256 public override userBalanceLimit;

    /**
     * @dev Address to withdraw presale funds
     */
    address public override treasury;

    /**
     * @dev sale status
     */
    bool public override isActive;

    /**
     * @dev buy cap for buy orders
     */
    uint16 public override buyCap;

    // Mappings

    /**
     * @dev Maps token symbol to token address
     */
    mapping(bytes16 => address) public override paymentTokens;

    /**
     * @dev Maps token symbol to chainLink price feed address
     */
    mapping(bytes16 => address) public override priceFeeds;
    /**
     * @dev Whitelisted addresses that get discount
     */
    mapping(address => bool) public override eligibleAddresses;

    /**
     * @dev Tracks LRT purchased by user
     */
    mapping(address => uint256) public override lrtTokenShare;
    /**
     * @dev Tracks number of purchases per day for each user
     */
    mapping(address => uint16) public override userDailyPurchaseCount;

    /**
     * @dev Tracks last purchase timestamp for each user
     */
    mapping(address => uint64) public override lastPurchaseDate;

    // External Contracts

    /**
     * @dev LRT vesting contract
     */
    ILRTVesting public lrtVesting;

    /**
     * @dev Access restriction contract
     */
    IAccessRestriction public accessRestriction;

    // Events
    // Inherited from ILRTPreSale interface

    // Modifiers

    /**
     * @dev Reverts if contract is paused
     */
    modifier notPaused() {
        accessRestriction.ifNotPaused();
        _;
    }

    /**
     * @dev Reverts if caller is not admin
     */
    modifier onlyAdmin() {
        accessRestriction.ifAdmin(msg.sender);
        _;
    }
    /**
     * @dev Reverts if caller is not script
     */
    modifier onlyScript() {
        accessRestriction.ifScript(msg.sender);
        _;
    }
    /**
     * @dev Reverts if caller is not wert
     */
    modifier onlyWert() {
        accessRestriction.ifWert(msg.sender);
        _;
    }

    /**
     * @dev Reverts if address is invalid
     * @param _addr The address to validate
     */
    modifier validAddress(address _addr) {
        require(_addr != address(0), "PreSale::Not valid address");
        _;
    }

    /**
     * @dev Reverts if token is not a valid payment token
     * @param _token The token symbol to validate
     */
    modifier onlyValidToken(bytes16 _token) {
        require(
            paymentTokens[_token] != address(0),
            "PreSale::payment token is not valid"
        );
        _;
    }

    /**
     * @dev Reverts if amount is 0
     * @param _amount The amount to validate
     */
    modifier onlyValidAmount(uint256 _amount) {
        require(_amount > 0, "PreSale::Insufficient amount:equal to zero");
        _;
    }

    constructor(address _lrtVestingAddress, address _accessRestrictionAddress) {
        accessRestriction = IAccessRestriction(_accessRestrictionAddress);
        lrtVesting = ILRTVesting(_lrtVestingAddress);
    }

    receive() external payable {
        emit Received(msg.sender, msg.value);
    }

    /**
     * @dev Purchases LRT with native coins
     * @param _lrtAmount Number of LRT tokens to purchase
     */
    function buyTokenByNativeCoin(
        uint256 _lrtAmount,
        uint80 _roundID
    ) external payable override nonReentrant {
        // Calculate payment amount
        uint256 totalCost = _calculateTotalPayment(_lrtAmount, msg.sender);

        // get matic price
        uint256 price = _getTokenPrice(bytes16("MATIC"), _roundID);
        require(
            msg.value >= (totalCost / price) * 1e8,
            "PreSale::insufficient balance"
        );

        // Emit event
        emit PurchasedByNativeCoin(msg.sender, _lrtAmount, msg.value);

        // Process purchase
        _processPurchase(_lrtAmount, msg.sender);
    }

    /**
     * @dev Purchases LRT with ERC20 token
     * @param _lrtAmount Number of LRT tokens to purchase
     * @param _token ERC20 token to use for payment
    * @param _roundID roundId

     */
    function buyTokenByERC20Token(
        uint256 _lrtAmount,
        bytes16 _token,
        uint80 _roundID
    ) external override nonReentrant onlyValidToken(_token) {
        // Calculate payment
        uint256 totalCost = _calculateTotalPayment(_lrtAmount, msg.sender);

        // Get estimated swap amount
        uint256 price = _getTokenPrice(_token, _roundID);

        //calculate approvedAmount
        uint256 approvedAmount = 0;
        if (_token == bytes16("WBTC")) {
            approvedAmount = totalCost / (price * 1e2);
        } else {
            approvedAmount = (totalCost / price) * 1e8;
        }

        // Get token address
        address tokenAddress = paymentTokens[_token];

        // Validate allowance
        require(
            IERC20(tokenAddress).allowance(msg.sender, address(this)) >=
                approvedAmount,
            "PreSale::allowance error"
        );

        // Transfer tokens
        bool success = IERC20(tokenAddress).transferFrom(
            msg.sender,
            address(this),
            approvedAmount
        );

        // Validate transfer
        require(success, "PreSale::fail transfer to contract");

        // Emit event
        emit PurchasedByERC20Token(
            msg.sender,
            _lrtAmount,
            approvedAmount,
            tokenAddress
        );

        // Process purchase
        _processPurchase(_lrtAmount, msg.sender);
    }

    /**
     * @dev Purchases LRT with stablecoin
     * @param _lrtAmount Number of LRT tokens to purchase
     * @param _token Stablecoin to use
     */
    function buyTokenByStableCoin(
        uint256 _lrtAmount,
        bytes16 _token
    ) external override nonReentrant onlyValidToken(_token) {
        // Calculate payment
        uint256 totalCost = _calculateTotalPayment(_lrtAmount, msg.sender);

        // Get token address
        address tokenAddress = paymentTokens[_token];

        // Adjust stablecoin amount for decimals
        if (_token == bytes16("USDC") || _token == bytes16("USDT")) {
            totalCost /= 1e12;
        }

        // Validate allowance
        require(
            IERC20(tokenAddress).allowance(msg.sender, address(this)) >=
                totalCost,
            "PreSale::allowance error"
        );

        // Transfer tokens
        bool success = IERC20(tokenAddress).transferFrom(
            msg.sender,
            address(this),
            totalCost
        );

        // Validate transfer
        require(success, "PreSale::fail transfer to contract");

        // Emit event
        emit PurchasedByStableCoin(
            msg.sender,
            _lrtAmount,
            totalCost,
            tokenAddress
        );

        // Process purchase
        _processPurchase(_lrtAmount, msg.sender);
    }

    /**
     * @dev Purchases LRT with fiat payment
     * @param _lrtAmount Number of LRT tokens to purchase
     * @param _beneficiary Address to receive purchased LRT
     */
    function buyTokenByFiat(
        uint256 _lrtAmount,
        address _beneficiary
    )
        external
        payable
        override
        nonReentrant
        validAddress(_beneficiary)
        onlyWert
        notPaused
    {
        // Calculate payment
        _calculateTotalPayment(_lrtAmount, _beneficiary);

        // Emit event
        emit PurchasedByFiat(_beneficiary, _lrtAmount);

        // Process purchase
        _processPurchase(_lrtAmount, _beneficiary);
    }

    /**
     * @dev Purchases LRT with coin
     * @param _lrtAmount Number of LRT tokens to purchase
     * @param _beneficiary Address to receive purchased LRT
     */
    function buyTokenByCoin(
        uint256 _lrtAmount,
        address _beneficiary
    ) external override nonReentrant validAddress(_beneficiary) onlyScript {
        // Calculate payment
        _calculateTotalPayment(_lrtAmount, _beneficiary);

        // Emit event
        emit PurchasedByCoin(_beneficiary, _lrtAmount);

        // Process purchase
        _processPurchase(_lrtAmount, _beneficiary);
    }

    /**
     * @dev Withdraws funds to treasury
     * @param _amount Amount to withdraw
     * @param _tokenAddress Token to withdraw
     */
    function withdraw(
        uint256 _amount,
        address _tokenAddress
    )
        external
        override
        validAddress(_tokenAddress)
        onlyAdmin
        onlyValidAmount(_amount)
    {
        // Validate balance
        require(
            IERC20(_tokenAddress).balanceOf(address(this)) >= _amount,
            "PreSale::insufficient balance"
        );

        // Withdraw tokens
        bool success = IERC20(_tokenAddress).transfer(treasury, _amount);

        // Validate transfer
        require(success, "PreSale::withdraw stablecoin failure");

        // Emit event
        emit WithdrawedBalance(treasury, _amount, _tokenAddress);
    }

    /**
     * @dev Withdraws matic funds to treasury
     * @param _amount Amount to withdraw
     */
    function withdrawCoins(
        uint256 _amount
    ) external override onlyAdmin onlyValidAmount(_amount) nonReentrant {
        require(
            _amount <= address(this).balance,
            "PreSale::insufficient balance"
        );
        payable(treasury).transfer(_amount);
        emit WithdrawedCoinBalance(treasury, _amount);
    }

    /**
     * @dev Sets payment token address
     * @param _symbol Token symbol
     * @param _addr Token address
     */
    function setPaymentTokens(
        bytes16 _symbol,
        address _addr
    ) external override validAddress(_addr) onlyAdmin {
        paymentTokens[_symbol] = _addr;

        emit PaymentTokenSet(_symbol, _addr);
    }

    /**
     * @dev Adds address to whitelist
     * @param _addr Address to whitelist
     */
    function addToWhiteList(
        address _addr
    ) external override onlyAdmin validAddress(_addr) {
        eligibleAddresses[_addr] = true;

        emit EligibleAddressAdded(_addr);
    }

    /**
     * @dev Sets LRT token price
     * @param _price New LRT price
     */
    function setLrtPrice(uint256 _price) external override onlyAdmin {
        lrtPrice = _price;

        emit PriceSet(_price);
    }

    function setUserBalanceLimit(uint256 _amount) external override onlyAdmin {
        userBalanceLimit = _amount;

        emit UserBalanceLimitUpdated(_amount);
    }

    /**
     * @dev Sets vesting plan ID
     * @param _planID Plan ID
     */
    function setPlanID(uint256 _planID) external override onlyAdmin {
        planID = _planID;

        emit PlanIdSet(_planID);
    }

    /**
     * @dev Sets max LRT tokens for sale
     * @param lrtLimit_ New limit
     */
    function setLrtLimit(uint256 lrtLimit_) external override onlyAdmin {
        lrtLimit = lrtLimit_;

        emit LrtLimitSet(lrtLimit_);
    }

    /**
     * @dev Sets sale status
     * @param status_ sale status
     */
    function setSaleStatus(bool status_) external override onlyAdmin {
        isActive = status_;
        emit SaleStatusSet(status_);
    }

    /**
     * @dev Sets treasury address
     * @param _treasury Treasury address
     */
    function setTreasuryAddress(
        address _treasury
    ) external override onlyAdmin validAddress(_treasury) {
        treasury = _treasury;

        emit TreasurySet(_treasury);
    }

    /**
     * @dev Sets minimum LRT purchase per user
     * @param _mintLrt Minimum LRT purchase
     */
    function setMinLrtPerUser(uint256 _mintLrt) external override onlyAdmin {
        minLrtPerUser = _mintLrt;
        emit MinLrtPriceSet(_mintLrt);
    }

    /**
     * @dev Sets sale discount percentage
     * @param _percentage Discount percentage
     */
    function setSaleDiscount(uint256 _percentage) external override onlyAdmin {
        discount = _percentage;

        emit SaleDiscountUpdated(_percentage);
    }

    /**
     * @dev Sets max buy cap count
     * @param _buyCap buy max cap count
     */
    function setBuyCap(uint16 _buyCap) external override onlyAdmin {
        buyCap = _buyCap;
        emit BuyCapUpdated(_buyCap);
    }

    /**
     * @dev Sets aggregator address
     * @param _symbol Token symbol
     * @param _addr aggregtor price feed address
     */
    function setAggregator(
        bytes16 _symbol,
        address _addr
    ) external override validAddress(_addr) onlyAdmin {
        priceFeeds[_symbol] = _addr;

        emit AggregatorAddressSet(_symbol, _addr);
    }

    /**
     * @dev Processes LRT purchase
     * @param _lrtAmount Amount of LRT purchased
     * @param _buyer Address of purchaser
     */
    function _processPurchase(uint256 _lrtAmount, address _buyer) private {
        // Apply purchase limit if enabled
        if (buyCap > 0) {
            // Ensure purchase is allowed
            require(
                _canMakePurchase(_buyer),
                "LRTPreSale::You've reached the daily buying limit"
            );

            // Update last purchase timestamp
            lastPurchaseDate[_buyer] = uint64(block.timestamp);

            // Increment daily purchases
            userDailyPurchaseCount[_buyer]++;
        }

        // Update total LRT sold
        lrtSold += _lrtAmount;

        // Update LRT purchased by user
        lrtTokenShare[_buyer] += _lrtAmount;

        // Create vesting schedule
        bool success = lrtVesting.createVesting(
            _buyer,
            uint64(block.timestamp),
            _lrtAmount,
            planID
        );

        // Revert if failure
        require(success, "PreSale::fail create vesting");
    }

    /**
     * @dev Checks if purchase is allowed for buyer
     * @param _buyer Address of purchaser
     * @return bool True if purchase is allowed
     */
    function _canMakePurchase(address _buyer) private returns (bool) {
        uint256 lastPurchase = lastPurchaseDate[_buyer];
        uint256 dailyPurchaseCount = userDailyPurchaseCount[_buyer];

        // If daily limit reached and time window hasn't passed
        if (
            dailyPurchaseCount >= buyCap &&
            block.timestamp < lastPurchase + TIME_BETWEEN_PURCHASES
        ) {
            return false;
        }

        // If time window has passed, reset limit
        if (block.timestamp >= lastPurchase + TIME_BETWEEN_PURCHASES) {
            userDailyPurchaseCount[_buyer] = 0;
        }

        // Purchase allowed
        return true;
    }

    /**
     * @dev Calculates total payment for LRT purchase
     * @param _lrtAmount Amount of LRT to purchase
     * @param _buyer Address purchasing LRT
     * @return Total payment amount required
     */
    function _calculateTotalPayment(
        uint256 _lrtAmount,
        address _buyer
    ) private view returns (uint256) {
        //check sale status

        require(isActive, "LRTPreSale::sale is not active");

        // Validate purchase amount
        _validateAmount(_lrtAmount);

        // Calculate payment
        uint256 totalCost = (_lrtAmount * lrtPrice) / 1e18;

        // Apply discount if buyer is whitelisted
        if (eligibleAddresses[_buyer]) {
            totalCost = ((10000 - discount) * totalCost) / 10000;
        }

        // Validate user lrt balance limit
        if (userBalanceLimit > 0) {
            _validateUserBalanceLimit(totalCost, _buyer);
        }

        return totalCost;
    }

    /**
     * @dev Validates purchase amount
     * @param _lrtAmount Amount of LRT to purchase
     */
    function _validateAmount(uint256 _lrtAmount) private view {
        // LRT limit not exceeded
        require(
            lrtSold + _lrtAmount <= lrtLimit,
            "PreSale::LRT limit Exceeded"
        );

        // Purchase amount exceeds minimum
        require(
            _lrtAmount >= minLrtPerUser,
            "PreSale::Insufficient amount:Below minLrtPerUser"
        );
    }

    /**
     * @dev Validates user purchase limit
     * @param _lrtvalue Amount of current purchase
     * @param userAddress Address of purchaser
     */
    function _validateUserBalanceLimit(
        uint256 _lrtvalue,
        address userAddress
    ) private view {
        // Get user's existing purchase value
        uint256 oldLrtValue = (lrtTokenShare[userAddress] * lrtPrice) / 1e18;

        // Check total value doesn't exceed limit
        require(
            oldLrtValue + _lrtvalue <= userBalanceLimit,
            "PreSale::You've reached the max lrt amount"
        );
    }

    /**
     * @dev Gets token price for chainlink
     * @param _token Token symbol
     * @param _roundID round id
     * @return token price
     */
    function _getTokenPrice(
        bytes16 _token,
        uint80 _roundID
    ) private view validAddress(priceFeeds[_token]) returns (uint256) {
        AggregatorV3Interface priceFeed = AggregatorV3Interface(
            priceFeeds[_token]
        );

        (uint80 roundID, , , , ) = priceFeed.latestRoundData();
        require(roundID - _roundID <= 600, "LRTPreSale::Price Too Old");

        (, int price, , , ) = priceFeed.getRoundData(_roundID);

        return uint256(price);
    }
}
