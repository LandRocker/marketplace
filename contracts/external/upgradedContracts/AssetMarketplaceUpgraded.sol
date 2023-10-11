// SPDX-License-Identifier: MIT

pragma solidity 0.8.6;

import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import {CountersUpgradeable} from "@openzeppelin/contracts-upgradeable/utils/CountersUpgradeable.sol";

import {Marketplace} from "./../../marketplace/Marketplace.sol";
import {ILRTVesting} from "./../../vesting/ILRTVesting.sol";
import {IAssetMarketplace} from "./../../marketplace/assetMarketplace/IAssetMarketplace.sol";

import {IAccessRestriction} from "./../../access/IAccessRestriction.sol";
import {ILRT} from "./../../tokens/erc20/ILRT.sol";
import {ILandRocker} from "./../../landrocker/ILandRocker.sol";

//import "hardhat/console.sol";

contract AssetMarketplaceUpgraded is IAssetMarketplace, Initializable, UUPSUpgradeable {
    using CountersUpgradeable for CountersUpgradeable.Counter;   
   
    ILRTVesting public lrtVesting;

    bytes32 public constant FULL_FILL_ORDER_SIGN =
        keccak256(
            "fullFillOrder(bytes32 orderIdHash,uint32 status,uint8 assetType,uint64 expireDate,uint256 price,uint256 quantity)"
        );

    /**
     * @dev Mapping to store sell for each off-chain asset sell
     */
    mapping(uint256 => AssetSell) public override assetSells;

    mapping(bytes32 => bool) public override orderFulfilled;

    IAccessRestriction public accessRestriction;
    ILRT public lrt;
    ILandRocker public landRocker;

    CountersUpgradeable.Counter private _sellIdCounter;

    modifier onlyOwner() {
        accessRestriction.ifOwner(msg.sender);
        _;
    }

    modifier onlyAdmin() {
        accessRestriction.ifAdmin(msg.sender);
        _;
    }

    modifier validExpirationDate(uint64 _expireDate) {
        require(
            _expireDate == 0 ||
                (_expireDate > 0 && _expireDate > uint64(block.timestamp)),
            "AssetMarketplace::Expiration date is invalid"
        );
        _;
    }

    modifier validQuantity(uint256 _quantity) {
        require(_quantity > 0, "AssetMarketplace::At least one item to sell");
        _;
    }
    
    string public greeting;

    function __AssetMarketplaceUpgraded_init(
        address accessRestriction_,
        address lrt_,
        address landRocker_,
        address lrtVesting_) public reinitializer(2) {
        __UUPSUpgradeable_init();
        accessRestriction = IAccessRestriction(accessRestriction_);
        lrt = ILRT(lrt_);
        landRocker = ILandRocker(landRocker_);
        lrtVesting = ILRTVesting(lrtVesting_);       
    }      

    function greetingNew() public pure returns (string memory) {
        return "New Upgradeable World!";
    }

function withdraw(uint256 _amount) external override onlyAdmin {
        require(
            _amount > 0,
            "AssetMarketplace::Insufficient amount, equal to zero"
        );

        require(
            lrt.balanceOf(address(this)) >= _amount,
            "AssetMarketplace::No balance to withdraw"
        );

        address treasury = landRocker.treasury();

        bool success = lrt.transfer(treasury, _amount);

        require(success, "AssetMarketplace::Unsuccessful transfer");
        emit Withdrawed(_amount, treasury);
    }

    function createSell(
        uint256 _price,
        uint8 _assetType,
        uint64 _expireDate,
        uint256 _quantity
    )
        external
        override
        onlyAdmin
        validExpirationDate(_expireDate)
        validQuantity(_quantity)
    {
        AssetSell storage assetSell = assetSells[_sellIdCounter.current()];
        //Set the listing to started
        assetSell.status = 0;
        assetSell.expireDate = _expireDate;
        assetSell.price = _price;
        assetSell.assetType = _assetType;
        assetSell.quantity = _quantity;
        emit SellCreated(
            _sellIdCounter.current(),
            _assetType,
            _expireDate,
            _price,
            _quantity
        );
        _sellIdCounter.increment();
    }

    function editSell(
        uint256 _sellId,
        uint256 _price,
        uint8 _assetType,
        uint64 _expireDate,
        uint256 _quantity
    )
        external
        override
        onlyAdmin
        validExpirationDate(_expireDate)
        validQuantity(_quantity)
    {
        AssetSell storage assetSell = assetSells[_sellId];
        require(
            //Ensure that the listing is not sold
            assetSell.status != 1,
            "AssetMarketplace::Sold listing asset cannot be edit"
        );

        //Set the listing to started
        assetSell.status = 0;
        assetSell.expireDate = _expireDate;
        assetSell.price = _price;
        assetSell.assetType = _assetType;
        assetSell.quantity = _quantity;
        emit SellUpdated(_sellId, _assetType, _expireDate, _price, _quantity);
    }

    function cancelSell(uint256 _sellId) external override onlyAdmin {
        AssetSell storage assetSell = assetSells[_sellId];

        require(
            //Ensure that the listing is started
            assetSell.status == 0,
            "AssetMarketplace::Cannot cancel active offer"
        );

        //Set the listing to canceled
        assetSell.status = 2;

        emit SellCanceled(_sellId);
    }

 function buyItem(uint256 _sellId) external override {
        AssetSell storage assetSell = assetSells[_sellId];
        uint256 price = assetSell.price;

        require(
            //Ensure that the listing is started
            assetSell.status == 0,
            "AssetMarketplace::Listed asset has not valid status"
        );

        _checkHasExpired(assetSell.expireDate);

        require(
            lrt.allowance(msg.sender, address(this)) >= price,
            "AssetMarketplace::Allowance error"
        );

        //To buy off-chain asset by the user balance
        if (lrt.balanceOf(msg.sender) >= price) {
            bool success = lrt.transferFrom(
                msg.sender,
                address(this),
                assetSell.price
            );
            require(success, "AssetMarketplace::Unsuccessful transfer");
            //Set the listing to sold
            assetSell.status = 1;
            emit OffChainItemBought(
                _sellId,
                assetSell.assetType,
                msg.sender,
                assetSell.quantity,
                price
            );
        }
        //To buy off-chain asset by setting debt for the user because of insufficient user balance
        else {
            //Set the listing to sold
            assetSell.status = 1;

            emit OffChainItemBought(
                _sellId,
                assetSell.assetType,
                msg.sender,
                assetSell.quantity,
                price
            );
            lrtVesting.setDebt(msg.sender, price);
        }
    }

    function fulfillOrder(
        bytes32 orderIdHash,
        address seller,
        uint32 status,
        uint8 assetType,
        uint64 expireDate,
        uint256 price,
        uint256 quantity,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) external override {
        // Verify signatures
        _verifySigner(
            _buildDomainSeparator(),
            keccak256(
                abi.encode(
                    FULL_FILL_ORDER_SIGN,
                    orderIdHash,
                    status,
                    assetType,
                    expireDate,
                    price,
                    quantity
                )
            ),
            seller,
            v,
            r,
            s
        );

        // Prevent double fulfillment
        require(!orderFulfilled[orderIdHash], "Order already fulfilled");

        require(
            //Ensure that the listing is started
            status == 0,
            "AssetMarketplace::Listed asset has not valid status"
        );

        _checkHasExpired(expireDate);

        require(
            lrt.allowance(msg.sender, address(this)) >= price,
            "AssetMarketplace::Allowance error"
        );

        //To buy off-chain asset by the user balance
        if (lrt.balanceOf(msg.sender) >= price) {
            bool success = lrt.transferFrom(msg.sender, address(this), price);
            require(success, "AssetMarketplace::Unsuccessful transfer");
            // //Set the listing to sold
            // status = 1;
            emit UserOffChainItemBought(
                orderIdHash,
                assetType,
                msg.sender,
                quantity,
                price
            );

            orderFulfilled[orderIdHash] = true;
        }
        //To buy off-chain asset by setting debt for the user because of insufficient user balance
        else {
            // //Set the listing to sold
            // status = 1;

            emit UserOffChainItemBought(
                orderIdHash,
                assetType,
                msg.sender,
                quantity,
                price
            );
            lrtVesting.setDebt(msg.sender, price);
            orderFulfilled[orderIdHash] = true;
        }
    }

    function _checkHasExpired(uint64 _expireDate) internal view {
        require(
            _expireDate == 0 ||
                (_expireDate > 0 && uint64(block.timestamp) <= _expireDate),
            "AssetMarketplace::The sale has expired"
        );
    }

    function _toTypedDataHash(
        bytes32 _domainSeperator,
        bytes32 _structHash
    ) private pure returns (bytes32) {
        return
            keccak256(
                abi.encodePacked("\x19\x01", _domainSeperator, _structHash)
            );
    }

    function _verifySigner(
        bytes32 _domainSeparator,
        bytes32 _hashStruct,
        address _seller,
        uint8 _v,
        bytes32 _r,
        bytes32 _s
    ) private pure {
        bytes32 hash = _toTypedDataHash(_domainSeparator, _hashStruct);

        address signer = ecrecover(hash, _v, _r, _s);

        require(signer == _seller, "AssetMarketplace::Invalid signature");
    }

    /**
     * @dev return domain separator
     */
    function _buildDomainSeparator() private view returns (bytes32) {
        return
            keccak256(
                abi.encode(
                    keccak256(
                        "EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"
                    ),
                    keccak256(bytes("AssetMarketplace")),
                    keccak256(bytes("1")),
                    block.chainid,
                    address(this)
                )
            );
    }   

    function _authorizeUpgrade(
        address newImplementation
    ) internal override onlyOwner {}
}
