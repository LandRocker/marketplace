// SPDX-License-Identifier: GPL-3.0
pragma solidity 0.8.6;

/**
 * @title IVesting interface
 */
interface ILRTPreSale {
    /**
     * @dev Emitted when LRT is purchased with stablecoin
     * @param recipient Address of token recipient
     * @param tokenAmount Amount of tokens purchased
     * @param amount Amount of stablecoins paid
     * @param token Address of stablecoin
     */
    event PurchasedByStableCoin(
        address recipient,
        uint256 tokenAmount,
        uint256 amount,
        address token
    );

    /**
     * @dev Emitted when LRT is purchased with native coin
     * @param recipient Address of token recipient
     * @param tokenAmount Amount of tokens purchased
     * @param amount Amount of native coins paid
     */
    event PurchasedByNativeCoin(
        address recipient,
        uint256 tokenAmount,
        uint256 amount
    );

    /**
     * @dev Emitted when LRT is purchased with ERC20 token
     * @param recipient Address of token recipient
     * @param tokenAmount Amount of tokens purchased
     * @param amount Amount of ERC20 tokens paid
     * @param token Address of ERC20 token
     */
    event PurchasedByERC20Token(
        address recipient,
        uint256 tokenAmount,
        uint256 amount,
        address token
    );

    /**
     * @dev Emitted when LRT is purchased with fiat
     * @param recipient Address of token recipient
     * @param tokenAmount Amount of tokens purchased
     */
    event PurchasedByFiat(address recipient, uint256 tokenAmount);

    /**
     * @dev Emitted when LRT is purchased with coin
     * @param recipient Address of token recipient
     * @param tokenAmount Amount of tokens purchased
     */
    event PurchasedByCoin(address recipient, uint256 tokenAmount);

    /**
     * @dev Emitted when payment is received
     * @param from Address payment received from
     * @param amount Amount received
     */
    event Received(address from, uint256 amount);

    /**
     * @dev Emitted when balance is withdrawn
     * @param _to Address to send funds to
     * @param _amount Amount to withdraw
     * @param _tokenAddress Address of token withdrawn
     */
    event WithdrawedBalance(
        address _to,
        uint256 _amount,
        address _tokenAddress
    );

    /**
     * @dev Emitted when coin balance is withdrawn
     * @param _to Address to send funds to
     * @param _amount Amount to withdraw
     */
    event WithdrawedCoinBalance(address _to, uint256 _amount);

    /**
     * @dev Emitted when sale status change
     * @param status status of sale
     */
    event SaleStatusSet(bool status);

    /**
     * @dev Emitted when payment token is set
     * @param symbol Token symbol
     * @param tokenAddress Token address
     */
    event PaymentTokenSet(bytes16 symbol, address tokenAddress);

    /**
     * @dev Emitted when aggregator address is set
     * @param symbol Token symbol
     * @param priceFeedAddress Token address
     */
    event AggregatorAddressSet(bytes16 symbol, address priceFeedAddress);

    /**
     * @dev Emitted when address is whitelisted
     * @param _address Address that is whitelisted
     */
    event EligibleAddressAdded(address _address);

    /**
     * @dev Emitted when LRT price is set
     * @param price New LRT price
     */
    event PriceSet(uint256 price);

    /**
     * @dev Emitted when plan ID is set
     * @param planId Plan ID
     */
    event PlanIdSet(uint256 planId);

    /**
     * @dev Emitted when LRT limit is set
     * @param lrtLimit New LRT limit
     */
    event LrtLimitSet(uint256 lrtLimit);

    /**
     * @dev Emitted when minimum LRT price is set
     * @param _mintLrt New minimum LRT price
     */
    event MinLrtPriceSet(uint256 _mintLrt);

    /**
     * @dev Emitted when treasury address is set
     * @param treasury Treasury address
     */
    event TreasurySet(address treasury);

    /**
     * @dev Emitted when sale discount is updated
     * @param _percentage Sale discount percentage
     */
    event SaleDiscountUpdated(uint256 _percentage);

    /**
     * @dev Emitted when user balance Limit for total LRT purchased per user based on dollar is updated
     * @param _amount User balance Limit
     */
    event UserBalanceLimitUpdated(uint256 _amount);

    /**
     * @dev Emitted when buy cap is updated
     * @param _buyCap cap count
     */
    event BuyCapUpdated(uint16 _buyCap);

    /**
     * @dev Purchases LRT with native coins
     * @param _lrtAmount Amount of LRT to purchase
     */
    // function buyTokenByNativeCoin(uint256 _lrtAmount) external payable;
    function buyTokenByNativeCoin(
        uint256 _lrtAmount,
        uint80 _roundID
    ) external payable;

    /**
     * @dev Purchases LRT with stablecoin
     * @param _lrtAmount Amount of LRT to purchase
     * @param _token Stablecoin to use
     */
    function buyTokenByStableCoin(uint256 _lrtAmount, bytes16 _token) external;

    /**
     * @dev Purchases LRT with ERC20 token
     * @param _lrtAmount Amount of LRT to purchase
     * @param _token ERC20 token to use
     * @param _roundID roundId
     */
    function buyTokenByERC20Token(
        uint256 _lrtAmount,
        bytes16 _token,
        uint80 _roundID
    ) external;

    /**
     * @dev Purchases LRT with fiat
     * @param _lrtAmount Amount of LRT to purchase
     * @param _beneficiary Address to receive LRT
     */
    function buyTokenByFiat(
        uint256 _lrtAmount,
        address _beneficiary
    ) external payable;

    /**
     * @dev Purchases LRT with coin
     * @param _lrtAmount Amount of LRT to purchase
     * @param _beneficiary Address to receive LRT
     */
    function buyTokenByCoin(uint256 _lrtAmount, address _beneficiary) external;

    /**
     * @dev Adds address to whitelist
     * @param _addressToWhitelist Address to whitelist
     */
    function addToWhiteList(address _addressToWhitelist) external;

    /**
     * @dev Withdraws funds
     * @param _amount Amount to withdraw
     * @param _stableCoin Stablecoin to withdraw
     */
    function withdraw(uint256 _amount, address _stableCoin) external;

    /**
     * @dev Withdraws matic funds to treasury
     * @param _amount Amount to withdraw
     */
    function withdrawCoins(uint256 _amount) external;

    /*
     * @dev Sets payment token
     * @param _symbol Token symbol
     * @param _addr Token address
     */
    function setPaymentTokens(bytes16 _symbol, address _addr) external;

    /**
     * @dev Sets LRT price
     * @param _price New LRT price
     */

    function setLrtPrice(uint256 _price) external;

    /**
     * @dev Sets plan ID
     * @param _planID Plan ID
     */
    function setPlanID(uint256 _planID) external;

    /**
     * @dev Sets LRT limit
     * @param lrtLimit_ New LRT limit
     */
    function setLrtLimit(uint256 lrtLimit_) external;

    /**
     * @dev Sets sale status
     * @param status_ sale status
     */
    function setSaleStatus(bool status_) external;

    /**
     * @dev Sets treasury address
     * @param _treasury Treasury address
     */
    function setTreasuryAddress(address _treasury) external;

    /**
     * @dev Sets minimum LRT purchase per user
     * @param _mintLrt Minimum LRT purchase per user
     */
    function setMinLrtPerUser(uint256 _mintLrt) external;

    /**
     * @dev Sets max buy cap count
     * @param _buyCap buy max cap count
     */
    function setBuyCap(uint16 _buyCap) external;

    /*
     * @dev sets Limit for total LRT purchased per user based on dollar
     * @param _amount buy total LRT purchased per user
     */
    function setUserBalanceLimit(uint256 _amount) external;

    /**
     * @dev Sets aggregator address
     * @param _symbol Token symbol
     * @param _addr aggregtor price feed address
     */
    function setAggregator(bytes16 _symbol, address _addr) external;

    /**
     * @dev Sets sale discount percentage
     * @param _percentage Discount percentage
     */
    function setSaleDiscount(uint256 _percentage) external;

    /**
     * @dev Gets current LRT price
     * @return Current LRT price
     */
    function lrtPrice() external view returns (uint256);

    /**
     * @dev Gets sale discount percentage
     * @return Sale discount percentage
     */
    function discount() external view returns (uint256);

    /*
     * @dev Gets Limit for total LRT purchased per user based on dollar
     * @param _amount buy total LRT purchased per user
     */
    function userBalanceLimit() external view returns (uint256);

    /**
     * @dev Gets current plan ID
     * @return Current plan ID
     */
    function planID() external view returns (uint256);

    /**
     * @dev Gets total LRT sold
     * @return Total LRT sold
     */
    function lrtSold() external view returns (uint256);

    /**
     * @dev Gets LRT limit
     * @return LRT limit
     */
    function lrtLimit() external view returns (uint256);

    /**
     * @dev Gets sale status
     * @return sale status
     */
    function isActive() external view returns (bool);

    /**
     * @dev Gets minimum LRT purchase per user
     * @return Minimum LRT purchase per user
     */
    function minLrtPerUser() external view returns (uint256);

    /**
     * @dev Gets purchase max capacity count
     * @return purchase max capacity count
     */
    function buyCap() external view returns (uint16);

    /**
     * @dev Gets treasury address
     * @return Treasury address
     */
    function treasury() external view returns (address);

    /**
     * @dev Gets payment token address
     * @param token Token symbol
     * @return Address of payment token
     */
    function paymentTokens(bytes16 token) external view returns (address);

    /**
     * @dev Gets price feed address
     * @param token Token symbol
     * @return Address of priceFeed
     */
    function priceFeeds(bytes16 token) external view returns (address);

    /**
     * @dev Checks if address is whitelisted
     * @param addr Address to check
     * @return bool true if address is whitelisted
     */
    function eligibleAddresses(address addr) external view returns (bool);

    /**
     * @dev Gets LRT purchased for address
     * @param addr Address to check
     * @return LRT purchased for address
     */
    function lrtTokenShare(address addr) external view returns (uint256);

    /**
     * @dev Gets LRT purchased for address
     * @param addr Address to check
     * @return LRT purchased for address
     */
    function userDailyPurchaseCount(
        address addr
    ) external view returns (uint16);

    /**
     * @dev Gets LRT purchased for address
     * @param addr Address to check
     * @return LRT purchased for address
     */
    function lastPurchaseDate(address addr) external view returns (uint64);
}
