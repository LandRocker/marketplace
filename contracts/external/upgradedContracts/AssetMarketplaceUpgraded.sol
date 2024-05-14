// SPDX-License-Identifier: GPL-3.0

pragma solidity 0.8.6;

import {ReentrancyGuardUpgradeable} from "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import {UUPSUpgradeable} from "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import {CountersUpgradeable} from "@openzeppelin/contracts-upgradeable/utils/CountersUpgradeable.sol";
import {Marketplace} from "./../../marketplace/Marketplace.sol";
import {IAccessRestriction} from "./../../access/IAccessRestriction.sol";
import {ILRT} from "./../../tokens/erc20/ILRT.sol";
import {ILRTVesting} from "./../../vesting/ILRTVesting.sol";
import {ILandRocker} from "./../../landrocker/ILandRocker.sol";
import {IAssetMarketplaceUpgraded} from "./IAssetMarketplaceUpgraded.sol";

//import "hardhat/console.sol";

contract AssetMarketplaceUpgraded is
    Initializable,
    UUPSUpgradeable,
    ReentrancyGuardUpgradeable,
    IAssetMarketplaceUpgraded
{
    // Use counters library for incrementing sell Ids
    using CountersUpgradeable for CountersUpgradeable.Counter;

    IAccessRestriction public accessRestriction;
    ILRT public lrt;
    ILRTVesting public lrtVesting;
    ILandRocker public landRocker;

    bytes32 public constant FULL_FILL_ORDER_SIGN =
        keccak256(
            "fullFillOrder(bytes32 orderIdHash,uint32 status,bytes16 assetName,uint64 expireDate,uint256 price,uint256 quantity)"
        );

    /**
     * @dev Mapping to store sell for each off-chain asset sell
     */
    mapping(uint256 => AssetSell) public override assetSells;
    /**
     * @dev Mapping to store orders fulfilled
     */
    mapping(bytes32 => bool) public override orderFulfilled;

    // Counter for sell Ids
    CountersUpgradeable.Counter private _sellIdCounter;

    string public override greeting;

    // Modifiers

    /**
     * @dev Reverts if the caller is not the owner.
     */
    modifier onlyOwner() {
        accessRestriction.ifOwner(msg.sender);
        _;
    }

    /**
     * @dev Reverts if the caller is not an admin.
     */
    modifier onlyAdmin() {
        accessRestriction.ifAdmin(msg.sender);
        _;
    }

    /**
     * @dev Reverts if the given expiration date is invalid.
     * @param _expireDate The expiration date to check.
     */
    modifier validExpirationDate(uint64 _expireDate) {
        require(
            _expireDate == 0 ||
                (_expireDate > 0 && _expireDate > uint64(block.timestamp)),
            "AssetMarketplace::Expiration date is invalid"
        );
        _;
    }

    /**
     * @dev Reverts if the given quantity is greater than zero.
     * @param _quantity The quantity that needs to check.
     */
    modifier validQuantity(uint256 _quantity) {
        require(_quantity > 0, "AssetMarketplace::At least one item to sell");
        _;
    }

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    /**
     * @dev Initializes the contract.
     * @param _accessRestriction The address of the access restriction contract.
     * @param _lrt The address of the LRT token contract.
     * @param _landRocker The address of the LandRocker contract.
     * @param _lrtVesting The address of the LRT Vesting contract.
     */
    function initializeAssetMarketplace(
        address _accessRestriction,
        address _lrt,
        address _landRocker,
        address _lrtVesting,
        string memory _greeting
    ) external override reinitializer(2) {
        __UUPSUpgradeable_init();
        accessRestriction = IAccessRestriction(_accessRestriction);
        lrt = ILRT(_lrt);
        landRocker = ILandRocker(_landRocker);
        lrtVesting = ILRTVesting(_lrtVesting);
        greeting = _greeting;
    }

    /**
     * @dev Allows an admin to create a sell listing for an off-chain asset.
     * @param _price The price at which the asset is listed for sale.
     * @param _assetName Name of asset being sold
     * @param _expireDate The expiration date of the sell listing (timestamp).
     * @param _sellUnit The quantity of the asset available for sale.
     */
    function createSell(
        uint256 _price,
        bytes16 _assetName,
        uint64 _expireDate,
        uint256 _sellUnit,
        uint256 _listedAmount
    )
        external
        override
        onlyAdmin
        validExpirationDate(_expireDate)
        validQuantity(_sellUnit)
    {
        _validateSell(_listedAmount, _sellUnit);

        AssetSell storage assetSell = assetSells[_sellIdCounter.current()];

        //Set the listing to started
        assetSell.status = 0;
        assetSell.expireDate = _expireDate;
        assetSell.price = _price;
        assetSell.assetName = _assetName;
        assetSell.sellUnit = _sellUnit;
        assetSell.listedAmount = _listedAmount;

        emit SellCreated(
            _sellIdCounter.current(),
            _assetName,
            _expireDate,
            _price,
            _sellUnit,
            _listedAmount
        );

        _sellIdCounter.increment();
    }

    /**
     * @dev Allows an admin to edit an existing sell listing for an off-chain asset.
     * @param _sellId The Id of the sell listing to edit.
     * @param _price The new price at which the asset is listed for sale.
     * @param _assetName new Name of asset being sold
     * @param _expireDate The new expiration date of the sell listing (timestamp).
     * @param _sellUnit The new quantity of the asset available for sale.
     */
    function editSell(
        uint256 _sellId,
        uint256 _price,
        bytes16 _assetName,
        uint64 _expireDate,
        uint256 _sellUnit,
        uint256 _listedAmount
    )
        external
        override
        onlyAdmin
        validExpirationDate(_expireDate)
        validQuantity(_sellUnit)
    {
        AssetSell storage assetSell = assetSells[_sellId];

        //Ensure that the listing exists
        require(
            assetSell.sellUnit > 0,
            "AssetMarketplace::The sell does not exist"
        );

        //Ensure that the listing is not sold
        require(
            assetSell.status != 1,
            "AssetMarketplace::Sold listing asset cannot be edit"
        );

        _validateSell(_listedAmount, _sellUnit);

        //Set the listing to started
        assetSell.status = 0;
        assetSell.expireDate = _expireDate;
        assetSell.price = _price;
        assetSell.assetName = _assetName;
        assetSell.sellUnit = _sellUnit;
        assetSell.listedAmount = _listedAmount;

        emit SellUpdated(
            _sellId,
            _assetName,
            _expireDate,
            _price,
            _sellUnit,
            _listedAmount
        );
    }

    /**
     * @dev Allows an admin to cancel a sell listing for an off-chain asset.
     * @param _sellId The Id of the sell listing to cancel.
     */
    function cancelSell(uint256 _sellId) external override onlyAdmin {
        AssetSell storage assetSell = assetSells[_sellId];

        //Ensure that the listing exists
        require(
            assetSell.sellUnit > 0,
            "AssetMarketplace::The sell does not exist"
        );

        //Ensure that the listing is started
        require(
            assetSell.status == 0,
            "AssetMarketplace::Cannot cancel active offer"
        );

        //Set the listing to canceled
        assetSell.status = 2;

        emit SellCanceled(_sellId);
    }

    /**
     * @dev Allows a user to purchase an off-chain asset from a sell listing.
     * @param _sellId The Id of the sell listing to purchase from.
     */
    function buyItem(uint256 _sellId) external override nonReentrant {
        AssetSell storage assetSell = assetSells[_sellId];

        //Ensure that the listing exists
        require(
            assetSell.sellUnit > 0,
            "AssetMarketplace::The sell does not exist"
        );

        require(
            //Ensure that the listing is started
            assetSell.status == 0,
            "AssetMarketplace::Listed asset has not valid status"
        );

        // Check if the sell listing has not expired
        _checkHasExpired(assetSell.expireDate);

        // Ensure that the total sold units do not exceed the listed amount
        require(
            assetSell.sellUnit + assetSell.soldAmount <= assetSell.listedAmount,
            "AssetMarketplace::Exceed sell limit"
        );

        uint256 price = assetSell.price;
        uint256 userBalance = lrt.balanceOf(msg.sender);

        // Determine if the user will pay with balance or vest
        bool payWithBalance = userBalance >= price;

        // Check for sufficient balance or allowance in case of payment with balance
        if (payWithBalance) {
            require(
                lrt.allowance(msg.sender, address(this)) >= price,
                "AssetMarketplace::Allowance error"
            );
        } else {
            (, uint256 vestedAmount, uint256 claimedAmount) = lrtVesting
                .holdersStat(msg.sender);
            require(
                claimedAmount + price <= vestedAmount,
                "AssetMarketplace::Insufficient vested balance"
            );
        }

        // Update the sold amount
        assetSell.soldAmount += assetSell.sellUnit;

        // Transfer LRT tokens or set a debt
        if (payWithBalance) {
            emit AssetBoughtWithBalance(
                _sellId,
                assetSell.assetName,
                msg.sender,
                assetSell.sellUnit,
                price
            );
            require(
                lrt.transferFrom(msg.sender, address(this), price),
                "AssetMarketplace::Unsuccessful transfer"
            );
        } else {
            emit AssetBoughtWithVest(
                _sellId,
                assetSell.assetName,
                msg.sender,
                assetSell.sellUnit,
                price
            );
            lrtVesting.setDebt(msg.sender, price);
        }

        // Update status if sold out
        if (assetSell.soldAmount == assetSell.listedAmount) {
            assetSell.status = 1;
        }
    }

    /**
     * @dev Allows a user to fulfill an off-chain order using a valid signature.
     * @param _orderIdHash The hash of the order Id being fulfilled.
     * @param _seller The address of the seller.
     * @param _status The status of the order.
     * @param _assetName The type of asset in the order.
     * @param _expireDate The expiration date of the order (timestamp).
     * @param _price The price of the order.
     * @param _sellUnit The quantity of assets in the order.
     * @param _v The recovery id of the signature.
     * @param _r The R component of the signature.
     * @param _s The S component of the signature.
     */
    function fulfillOrder(
        bytes32 _orderIdHash,
        address _seller,
        uint32 _status,
        bytes16 _assetName,
        uint64 _expireDate,
        uint256 _price,
        uint256 _sellUnit,
        uint8 _v,
        bytes32 _r,
        bytes32 _s
    ) external override nonReentrant {
        // Verify that the provided signature matches the order details
        _verifySigner(
            _buildDomainSeparator(),
            keccak256(
                abi.encode(
                    FULL_FILL_ORDER_SIGN,
                    _orderIdHash,
                    _status,
                    _assetName,
                    _expireDate,
                    _price,
                    _sellUnit
                )
            ),
            _seller,
            _v,
            _r,
            _s
        );

        // Prevent double fulfillment by checking if the order has already been fulfilled
        require(
            !orderFulfilled[_orderIdHash],
            "AssetMarketplace::Order already fulfilled"
        );

        //Prevent fuel selling
        require(
            _assetName != bytes16("fuel"),
            "AssetMarketplace::Fuel cannot be sold"
        );

        //Ensure that the listing is started
        require(
            _status == 0,
            "AssetMarketplace::Listed asset has not valid status"
        );

        // Check if the order's expiration date has passed
        _checkHasExpired(_expireDate);

        // Check if the user has allowed the contract to spend at least `price` amount of LRT
        require(
            lrt.allowance(msg.sender, address(this)) >= _price,
            "AssetMarketplace::Allowance error"
        );

        // Ensure that the buyer has enough LRT tokens to make the purchase
        require(
            lrt.balanceOf(msg.sender) >= _price,
            "AssetMarketplace::Insufficient token balance"
        );

        // Mark the order as fulfilled to prevent double fulfillment
        orderFulfilled[_orderIdHash] = true;

        // Transfer the `price` amount of LRT tokens from the user to the contract
        require(
            lrt.transferFrom(msg.sender, address(this), _price),
            "AssetMarketplace::Unsuccessful transfer to marketplace"
        );

        // Retrieve the system fee percentage from LandRocker contract
        uint256 systemFee = landRocker.systemFee();
        // Calculate the total payment after system fee deduction
        uint256 totalPayment = ((10000 - systemFee) * _price) / 10000;

        require(
            lrt.transfer(_seller, totalPayment),
            "AssetMarketplace::Unsuccessful transfer to seller"
        );

        emit FulFilledOrder(
            _orderIdHash,
            _assetName,
            _seller,
            msg.sender,
            _sellUnit,
            _price
        );
    }

    /**
     * @dev Allows the admin to withdraw LRT tokens from the contract.
     * @param _amount The amount of LRT tokens to withdraw.
     */
    function withdraw(uint256 _amount) external override onlyAdmin {
        // Ensure that the withdrawal amount is greater than zero
        require(
            _amount > 0,
            "AssetMarketplace::Insufficient amount, equal to zero"
        );

        // Check if the contract has a sufficient balance of tokens to fulfill the withdrawal
        require(
            lrt.balanceOf(address(this)) >= _amount,
            "AssetMarketplace::No balance to withdraw"
        );

        // Get the treasury address where the tokens will be sent
        address treasury = landRocker.treasury();

        require(
            lrt.transfer(treasury, _amount),
            "AssetMarketplace::Unsuccessful transfer"
        );
        emit Withdrawn(_amount, treasury);
    }

    /**
     * @dev Authorizes a contract upgrade.
     * @param newImplementation The address of the new contract implementation.
     */
    function _authorizeUpgrade(
        address newImplementation
    ) internal override onlyOwner {}

    /**
     * @dev Checks if the given expiration date has passed.
     * @param _expireDate The expiration date to check.
     */
    function _checkHasExpired(uint64 _expireDate) private view {
        // Check if the `_expireDate` is either 0 (no expiration) or greater than the current block timestamp.
        require(
            _expireDate == 0 ||
                (_expireDate > 0 && uint64(block.timestamp) <= _expireDate),
            "AssetMarketplace::The sale has expired"
        );
    }

    /**
     * @dev Builds the EIP712 domain separator.
     * @return The domain separator hash.
     */
    function _buildDomainSeparator() private view returns (bytes32) {
        return
            keccak256(
                abi.encode(
                    keccak256(
                        "EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"
                    ),
                    keccak256(bytes("AssetMarketplace")), // Hash name
                    keccak256(bytes("1")), // Hash version
                    block.chainid,
                    address(this) // Verifying Contract
                )
            );
    }

    /**
     * @dev Computes the typed data hash for signature verification.
     * @param _domainSeperator The domain separator hash.
     * @param _structHash The hash of the struct being signed.
     * @return The typed data hash.
     */
    function _toTypedDataHash(
        bytes32 _domainSeperator,
        bytes32 _structHash
    ) private pure returns (bytes32) {
        return
            keccak256(
                abi.encodePacked("\x19\x01", _domainSeperator, _structHash)
            );
    }

    /**
     * @dev Verifies the signer of a message against a given signature.
     * @param _domainSeparator The domain separator hash.
     * @param _hashStruct The hash of the struct being signed.
     * @param _seller The expected signer's address.
     * @param _v The recovery id of the signature.
     * @param _r The R component of the signature.
     * @param _s The S component of the signature.
     */
    function _verifySigner(
        bytes32 _domainSeparator,
        bytes32 _hashStruct,
        address _seller,
        uint8 _v,
        bytes32 _r,
        bytes32 _s
    ) private pure {
        //Calculate the hash of the message data
        bytes32 hash = _toTypedDataHash(_domainSeparator, _hashStruct);

        //Recover the address of the signer from the provided ECDSA signature
        address signer = ecrecover(hash, _v, _r, _s);

        //Ensure that the recovered signer's address matches the expected _seller address
        require(signer == _seller, "AssetMarketplace::Invalid signature");
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
            "AssetMarketplace::There are not any item to sell"
        );
        // Ensure that at least one item is being sold (sell unit is greater than zero)
        require(_sellUnit > 0, "AssetMarketplace::At least one item to sell");
        // Ensure that the listed amount is greater than or equal to the sell unit
        require(
            _listedAmount >= _sellUnit,
            "AssetMarketplace::Sell unit is larger than listed amount"
        );
        // Ensure that the listed amount is a multiple of the sell unit (divisible without remainder)
        require(
            _listedAmount % _sellUnit == 0,
            "AssetMarketplace::Listed amount is not a coefficient of sell unit"
        );
    }
}
