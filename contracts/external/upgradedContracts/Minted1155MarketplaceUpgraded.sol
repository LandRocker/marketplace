// SPDX-License-Identifier: MIT

pragma solidity 0.8.6;

//import {ReentrancyGuard} from "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/utils/CountersUpgradeable.sol";

import {IAccessRestriction} from "./../../access/IAccessRestriction.sol";
import {ILandRockerERC1155} from "./../../tokens/erc1155/ILandRockerERC1155.sol";
import {ILRTVesting} from "./../../vesting/ILRTVesting.sol";
import {ILRT} from "./../../tokens/erc20/ILRT.sol";
import {ILandRocker} from "./../../landrocker/ILandRocker.sol";
import {Marketplace} from "./../../marketplace/Marketplace.sol";
import {IMinted1155Marketplace} from "./../../marketplace/minted1155/IMinted1155Marketplace.sol";

//import "hardhat/console.sol";

//ReentrancyGuard,
contract Minted1155MarketplaceUpgraded is Marketplace, IMinted1155Marketplace {
    using CountersUpgradeable for CountersUpgradeable.Counter;

    ILandRockerERC1155 public landRockerERC1155;

    /**
     * @dev Mapping to store sell for each Minted1155 token sell
     */
    mapping(uint256 => Minted1155Sell) public override minted1155Sells;
    CountersUpgradeable.Counter private _sellIdCounter;
    
string public greeting;
IAccessRestriction public accessRestriction;
     ILRTVesting public lrtVesting;
    ILRT public lrt;
    ILandRocker public landRocker;    
    function __Minted1155MarketplaceUpgraded_init(
        address _landRockerERC1155,
        address _accessRestriction,
        address _lrt,
        address _landRocker,
        address _lrtVesting
    ) public reinitializer(2) {
        __UUPSUpgradeable_init();
        accessRestriction = IAccessRestriction(_accessRestriction);
        lrt = ILRT(_lrt);
        landRocker = ILandRocker(_landRocker);
        lrtVesting = ILRTVesting(_lrtVesting);

        // Marketplace.initialize(
        //     _accessRestriction,
        //     _lrt,
        //     _landRocker,
        //     _lrtVesting
        // );
        landRockerERC1155 = ILandRockerERC1155(_landRockerERC1155);
    }

function greetingNew() public pure returns (string memory) {
        return "New Upgradeable World!";
    }
    function cancelSell(uint256 _sellId) external override {
        Minted1155Sell storage minted1155Sell = minted1155Sells[_sellId];
        require(
            msg.sender == minted1155Sell.seller,
            "Minted1155Marketplace::You are not owner"
        );
        require(
            //Ensure that the listing is started
            minted1155Sell.sellData.status == 0,
            "Minted1155Marketplace::Cannot cancel sold NFT"
        );

        //Set the listing to canceled
        minted1155Sell.sellData.status = 2;

        require(
            (
                !(
                    landRockerERC1155.isApprovedForAll(
                        minted1155Sell.seller,
                        address(this)
                    )
                )
            ),
            "Minted1155Marketplace::Marketplace approve are not revoked"
        );

        emit SellCanceled(_sellId);
    }

    function createSell(
        uint256 _price,
        uint64 _expireDate,
        uint256 _tokenId,
        uint256 _quantity
    ) external override validExpirationDate(_expireDate) {
        _validateSell(_quantity, _tokenId);

        Minted1155Sell storage minted1155Sell = minted1155Sells[
            _sellIdCounter.current()
        ];
        //Set the listing to started
        minted1155Sell.sellData.status = 0;
        minted1155Sell.sellData.collection = address(landRockerERC1155);
        minted1155Sell.sellData.expireDate = _expireDate;
        minted1155Sell.sellData.price = _price;
        minted1155Sell.tokenId = _tokenId;
        minted1155Sell.quantity = _quantity;
        minted1155Sell.seller = msg.sender;

        emit SellCreated(
            _sellIdCounter.current(),
            msg.sender,
            address(landRockerERC1155),
            _price,
            _expireDate,
            _tokenId,
            _quantity
        );
        _sellIdCounter.increment();
    }

    function editSell(
        uint256 _sellId,
        uint256 _price,
        uint64 _expireDate,
        uint256 _tokenId,
        uint256 _quantity
    ) external override validExpirationDate(_expireDate) {
        Minted1155Sell storage minted1155Sell = minted1155Sells[_sellId];

        _validateSell(_quantity, _tokenId);

        require(
            //Ensure that the listing is not sold
            minted1155Sell.sellData.status != 1,
            "Minted1155Marketplace::Sold listing nft cannot be edit"
        );

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
            _expireDate,
            _price,
            _tokenId,
            _quantity
        );
    }

    function buyItem(uint256 _sellId) external override {
        Minted1155Sell storage minted1155Sell = minted1155Sells[_sellId];

        require(
            //Ensure that the listing is started
            minted1155Sell.sellData.status == 0,
            "Minted1155Marketplace::Sell has invalid status"
        );

        uint256 price = minted1155Sell.sellData.price;
        _checkHasExpired(minted1155Sell.sellData.expireDate);
        _checkFund(price);

        require(
            (
                landRockerERC1155.isApprovedForAll(
                    minted1155Sell.seller,
                    address(this)
                )
            ),
            "Minted1155Marketplace::Marketplace has not access"
        );

        if (_lrt.balanceOf(msg.sender) >= minted1155Sell.sellData.price) {
            bool success = _lrt.transferFrom(msg.sender, address(this), price);
            require(
                success,
                "Minted1155Marketplace::Unsuccessful transfer"
            );
            //Set the listing to sold
            minted1155Sell.sellData.status = 1;

            bool isSendCreator = _lrt.transfer(
                minted1155Sell.seller,
                minted1155Sell.sellData.price
            );
            require(
                isSendCreator,
                "Minted1155Marketplace::Unsuccessful transfer"
            );

        } else {
            _lrtVesting.setDebt(msg.sender, minted1155Sell.sellData.price);
            //Set the listing to sold
            minted1155Sell.sellData.status = 1;
        }

        require(
            landRockerERC1155.balanceOf(
                minted1155Sell.seller,
                minted1155Sell.tokenId
            ) >= minted1155Sell.quantity,
            "Minted1155Marketplace::Insufficient token balance"
        );

        landRockerERC1155.safeTransferFrom(
            minted1155Sell.seller,
            msg.sender,
            minted1155Sell.tokenId,
            minted1155Sell.quantity,
            ""
        );

        emit ItemBoughtMinted1155(
            _sellId,
            msg.sender,
            minted1155Sell.seller,
            minted1155Sell.sellData.collection,
            minted1155Sell.tokenId,
            minted1155Sell.quantity
        );
    }

    function withdraw(uint256 _amount) external override onlyAdmin {
        _withdraw(_amount);
    }

    function _validateSell(uint256 _quantity, uint256 _tokenId) private view {
        require(
            _quantity > 0,
            "Minted1155Marketplace::At least one item to sell"
        );
        require(
            _quantity <= landRockerERC1155.balanceOf(msg.sender, _tokenId),
            "Minted1155Marketplace::You do not have enough balance"
        );

        require(
            (landRockerERC1155.isApprovedForAll(msg.sender, address(this))),
            "Minted1155Marketplace::Marketplace has not access"
        );
    }
}
