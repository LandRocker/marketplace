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
import {IERC1155Receiver} from "@openzeppelin/contracts/token/ERC1155/IERC1155Receiver.sol";
import {IERC165} from "@openzeppelin/contracts/interfaces/IERC165.sol";
//import {ILandRockerERC1155} from "./../../tokens/erc1155/ILandRockerERC1155.sol";
import {Marketplace} from "./../../marketplace/Marketplace.sol";
import {INonMinted1155Marketplace} from "./../../marketplace/nonMinted1155/INonMinted1155Marketplace.sol";

//import "hardhat/console.sol";

// ReentrancyGuard,
contract NonMinted1155MarketplaceUpgraded is
    IERC1155Receiver,
    Marketplace,
    INonMinted1155Marketplace
{   
    using CountersUpgradeable for CountersUpgradeable.Counter;

    ILandRockerERC1155 public landRockerERC1155;

    /**
     * @dev Mapping to store sell for each nonMinted1155 token sell
     */
    mapping(uint256 => NonMinted1155Sell) public override nonMinted1155Sells;
 CountersUpgradeable.Counter private _sellIdCounter;
string public greeting;
IAccessRestriction public accessRestriction;
     ILRTVesting public lrtVesting;
    ILRT public lrt;
    ILandRocker public landRocker;    
    
    function __NonMinted1155MarketplaceUpgraded_init(
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
        landRockerERC1155 = ILandRockerERC1155(_landRockerERC1155);
    }

    function greetingNew() public pure returns (string memory) {
        return "New Upgradeable World!";
    }

    function cancelSell(uint256 _sellId) external override onlyAdmin {
        NonMinted1155Sell storage nonMinted1155Sell = nonMinted1155Sells[
            _sellId
        ];

        require(
            //Ensure that the listing is started
            nonMinted1155Sell.sellData.status == 0,
            "NonMinted1155Marketplace::Cannot cancel active offer"
        );
        //Set the listing to canceled
        nonMinted1155Sell.sellData.status = 2;

        emit SellCanceled(_sellId);
    }

    function createSell(
        uint256 _price,
        uint64 _expireDate,
        uint256 _listedAmount,
        uint256 _sellUnit
    ) external override onlyAdmin validExpirationDate(_expireDate) {
        _validateSell(_listedAmount, _sellUnit);

        NonMinted1155Sell storage nonMinted1155Sell = nonMinted1155Sells[
            _sellIdCounter.current()
        ];

        uint256 tokenId = landRockerERC1155.safeMint(
            address(this),
            _listedAmount
        );

        //Set the listing to started
        nonMinted1155Sell.sellData.status = 0;

        nonMinted1155Sell.sellData.collection = address(landRockerERC1155);
        nonMinted1155Sell.sellData.expireDate = _expireDate;
        nonMinted1155Sell.sellData.price = _price;
        nonMinted1155Sell.sellUnit = _sellUnit;
        nonMinted1155Sell.listedAmount = _listedAmount;
        nonMinted1155Sell.tokenId = tokenId;
        emit SellCreated(
            _sellIdCounter.current(),
            msg.sender,
            address(landRockerERC1155),
            _expireDate,
            _price,
            _listedAmount,
            _sellUnit,
            tokenId
        );
        _sellIdCounter.increment();
    }

    function editSell(
        uint256 _sellId,
        uint256 _price,
        uint64 _expireDate,
        uint256 _listedAmount,
        uint256 _sellUnit
    ) external override onlyAdmin validExpirationDate(_expireDate) {
        NonMinted1155Sell storage nonMinted1155Sell = nonMinted1155Sells[
            _sellId
        ];
        require(
            //Ensure that the listing is not sold
            nonMinted1155Sell.sellData.status != 1,
            "NonMinted1155Marketplace::Sold listing NFT cannot be edit"
        );

        _validateSell(_listedAmount, _sellUnit);

        require(
            _listedAmount >= nonMinted1155Sell.listedAmount,
            "NonMinted1155Marketplace::Listed amount is less than already listed amount"
        );

        if (_listedAmount > nonMinted1155Sell.listedAmount) {
            uint256 mintAmount = _listedAmount - nonMinted1155Sell.listedAmount;
            landRockerERC1155.mint(
                nonMinted1155Sell.tokenId,
                address(this),
                mintAmount
            );
        }

        nonMinted1155Sell.sellData.expireDate = _expireDate;
        nonMinted1155Sell.sellData.price = _price;
        nonMinted1155Sell.sellUnit = _sellUnit;
        nonMinted1155Sell.listedAmount = _listedAmount;

        emit SellUpdated(
            _sellId,
            msg.sender,
            address(landRockerERC1155),
            _expireDate,
            _price,
            _listedAmount,
            _sellUnit
        );
    }

    function buyItem(uint256 _sellId) external override {
        NonMinted1155Sell storage nonMinted1155Sell = nonMinted1155Sells[
            _sellId
        ];       

        require(
            nonMinted1155Sell.sellUnit + nonMinted1155Sell.soldAmount <=
                nonMinted1155Sell.listedAmount,
            "NonMinted1155Marketplace::Exceed sell limit"
        );

        require(
            //Ensure that the listing is started
            nonMinted1155Sell.sellData.status == 0,
            "NonMinted1155Marketplace::Listed NFT has not valid status"
        );

        require(
            landRockerERC1155.balanceOf(
                address(this),
                nonMinted1155Sell.tokenId
            ) >= nonMinted1155Sell.sellUnit,
            "NonMinted1155Marketplace::Insufficient token balance"
        );

        uint256 price = nonMinted1155Sell.sellData.price;

        _checkHasExpired(nonMinted1155Sell.sellData.expireDate);
        _checkFund(price);

        if (_lrt.balanceOf(msg.sender) >= nonMinted1155Sell.sellData.price) {
            bool success = _lrt.transferFrom(msg.sender, address(this), price);
            require(
                success,
                "NonMinted1155Marketplace::Unsuccessful transfer"
            );
        } else {
            _lrtVesting.setDebt(msg.sender, nonMinted1155Sell.sellData.price);
        }

        nonMinted1155Sell.soldAmount += nonMinted1155Sell.sellUnit;
        if (nonMinted1155Sell.soldAmount == nonMinted1155Sell.listedAmount) {
            //Set the listing to sold
            nonMinted1155Sell.sellData.status = 1;
        }      

        landRockerERC1155.safeTransferFrom(
            address(this),
            msg.sender,
            nonMinted1155Sell.tokenId,
            nonMinted1155Sell.sellUnit,
            ""
        );

        emit ItemBoughtNonMinted1155(
            _sellId,
            msg.sender,
            nonMinted1155Sell.tokenId,
            nonMinted1155Sell.sellUnit
        );
    }

    function withdraw(uint256 _amount) external override onlyAdmin {
        _withdraw(_amount);
    }

    function _validateSell(
        uint256 _listedAmount,
        uint256 _sellUnit
    ) private pure {
        require(
            _listedAmount > 0,
            "NonMinted1155Marketplace::There are'nt any item to sell"
        );
        require(
            _sellUnit > 0,
            "NonMinted1155Marketplace::At least one item to sell"
        );
        require(
            _listedAmount >= _sellUnit,
            "NonMinted1155Marketplace::Sell unit is larger than listed amount"
        );
        require(
            _listedAmount % _sellUnit == 0,
            "NonMinted1155Marketplace::Listed amount is not a coefficient of sell unit"
        );
    }

    function onERC1155Received(
        address operator,
        address from,
        uint256 id,
        uint256 value,
        bytes calldata data
    ) external override returns (bytes4) {
        return this.onERC1155Received.selector;
    }

    function onERC1155BatchReceived(
        address operator,
        address from,
        uint256[] calldata ids,
        uint256[] calldata values,
        bytes calldata data
    ) external override returns (bytes4) {
        return this.onERC1155BatchReceived.selector;
    }

    function supportsInterface(
        bytes4 interfaceId
    ) public view virtual override returns (bool) {
        return
            interfaceId == type(IERC1155Receiver).interfaceId ||
            interfaceId == type(IERC165).interfaceId;
    }  
}
