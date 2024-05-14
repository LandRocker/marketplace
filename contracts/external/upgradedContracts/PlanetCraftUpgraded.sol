// // SPDX-License-Identifier: GPL-3.0
pragma solidity 0.8.6;

// import {ReentrancyGuardUpgradeable} from "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
// import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
// import {UUPSUpgradeable} from "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
// import {CountersUpgradeable} from "@openzeppelin/contracts-upgradeable/utils/CountersUpgradeable.sol";
// import {IERC1155ReceiverUpgradeable} from "@openzeppelin/contracts-upgradeable/interfaces/IERC1155ReceiverUpgradeable.sol";
// import {IERC165Upgradeable} from "@openzeppelin/contracts-upgradeable/interfaces/IERC165Upgradeable.sol";

// import {IAccessRestriction} from "./../../access/IAccessRestriction.sol";
// import {ILRT} from "./../../tokens/erc20/ILRT.sol";
// import {ILandRocker} from "./../../landrocker/ILandRocker.sol";
// import {ILandRockerERC1155} from "./../../tokens/erc1155/ILandRockerERC1155.sol";
// import {ILandRockerERC721} from "./../../tokens/erc721/ILandRockerERC721.sol";
// import {ILRTVesting} from "./../../vesting/ILRTVesting.sol";
// import {Marketplace} from "./../../marketplace/Marketplace.sol";
// import {IPlanetCraftUpgraded} from "./IPlanetCraftUpgraded.sol";

// import "hardhat/console.sol";

// /**
//  * @title PlanetCraftUpgraded
//  * @dev A contract for managing planet crafts.
//  * This contract inherits from Marketplace and implements the IPlanetCraftUpgraded interface.
//  */
// contract PlanetCraftUpgraded is
//     Initializable,
//     UUPSUpgradeable,
//     ReentrancyGuardUpgradeable,
//     IERC1155ReceiverUpgradeable,
//     IPlanetCraftUpgraded
// {
//     using CountersUpgradeable for CountersUpgradeable.Counter;

//     ILandRockerERC1155 public landRockerERC1155;
//     ILandRockerERC721 public landRockerERC721;

//     IAccessRestriction internal _accessRestriction;
//     ILRT internal _lrt;
//     ILandRocker internal _landrocker;
//     ILRTVesting internal _lrtVesting;

//     /**
//      * @dev Mapping to store craft fee for each planet craft
//      */
//     mapping(uint256 => uint256) public override craftsFee;

//     // Mapping to store collections and their validity
//     mapping(address => bool) public override landrocker1155Collections;
//     // Mapping to store collections and their validity
//     mapping(address => bool) public override landrocker721Collections;

//     // Counter for craft Ids
//     CountersUpgradeable.Counter private _craftIdCounter;

//     // Modifiers

//     /**
//      * @dev Reverts if the caller is not the owner.
//      */
//     modifier onlyOwner() {
//         _accessRestriction.ifOwner(msg.sender);
//         _;
//     }

//     /**
//      * @dev Reverts if the caller is not an admin.
//      */
//     modifier onlyAdmin() {
//         _accessRestriction.ifAdmin(msg.sender);
//         _;
//     }

//     /**
//      * @dev Modifier: Only accessible by authorized scripts
//      */
//     modifier onlyScript() {
//         _accessRestriction.ifScript(msg.sender);
//         _;
//     }

//     /**
//      * @dev Modifier: To check if an address is valid (not null)
//      */
//     modifier validAddress(address _address) {
//         require(
//             _address != address(0),
//             "Minted721Marketplace::Not valid address"
//         );
//         _;
//     }

//     /**
//      * @dev Modifier: Only accessible by authorized scripts
//      */
//     modifier validCraft(uint256 _craftId) {
//         //Ensure that the craft is there
//         require(
//             craftsFee[_craftId] > 0,
//             "PlanetCraft::The craft does not exist"
//         );
//         _;
//     }

//     string public override greeting;

//     /// @custom:oz-upgrades-unsafe-allow constructor
//     constructor() {
//         _disableInitializers();
//     }

//     /**
//      * @dev Initializes the contract with necessary addresses.
//      * @param _accessRestrictionAddress Address of the access restriction contract.
//      * @param _lrtAddress Address of the LRT token contract.
//      * @param _landRockerAddress The address of the LandRocker contract.
//      * @param _lrtVestingAddress Address of the LRTVesting contract.
//      * @param _greeting The greeting message to be displayed on the marketplace.
//      */
//     function initializePlanetCraft(
//         address _accessRestrictionAddress,
//         address _lrtAddress,
//         address _landRockerAddress,
//         address _lrtVestingAddress,
//         string memory _greeting
//     ) external override reinitializer(2) {
//         _accessRestriction = IAccessRestriction(_accessRestrictionAddress);
//         _lrt = ILRT(_lrtAddress);
//         _landrocker = ILandRocker(_landRockerAddress);
//         _lrtVesting = ILRTVesting(_lrtVestingAddress);

//         greeting = _greeting;
//     }

//     /**
//      * @dev sets a fee for a specific  planet craft indicated by craftId.
//      * @param _craftFee The fee of the planet craft.
//      * Only script can set the craft fee.
//      */
//     function setCraftFee(uint256 _craftFee) external override onlyScript {
//         //Ensure that the craft fee is valid
//         require(
//             _craftFee > 0,
//             "PlanetCraft::Insufficient craft fee, equal to zero"
//         );

//         craftsFee[_craftIdCounter.current()] = _craftFee;

//         emit CraftFeeSet(_craftIdCounter.current(), _craftFee);

//         _craftIdCounter.increment();
//     }

//     /**
//      * @dev updates a fee for a specific  planet craft indicated by craftId.
//      * @param _craftId The unique identifier of the craft to be updated.
//      * @param _craftFee The fee of the planet craft.
//      * Only administrators can set the craft fee.
//      */
//     function editCraftFee(
//         uint256 _craftId,
//         uint256 _craftFee
//     ) external override onlyAdmin {
//         //Ensure that the craft is there
//         require(
//             craftsFee[_craftId] > 0,
//             "PlanetCraft::The craft does not exist"
//         );

//         //Ensure that the craft fee is valid
//         require(
//             _craftFee > 0,
//             "PlanetCraft::Insufficient craft fee, equal to zero"
//         );

//         craftsFee[_craftId] = _craftFee;

//         emit CraftFeeUpdated(_craftId, _craftFee);
//     }

//     /**
//      * @dev Allows a user to purchase a planet craft.
//      * @param _craftId The unique identifier of the craft to be purchased.
//      * Only non-admin users can call this function to buy assets.
//      */
//     function preCraft(uint256 _craftId) external override nonReentrant {
//         uint256 craftFee = craftsFee[_craftId];

//         //Ensure that the craft is there
//         require(craftFee > 0, "PlanetCraft::The craft does not exist");

//         bool hasSufficientBalance = _lrt.balanceOf(msg.sender) >= craftFee;

//         // Transfer the LRT tokens from the payer to the marketplace
//         if (hasSufficientBalance) {
//             _processCraftPurchase(_craftId, msg.sender, craftFee);
//         } else {
//             _processVestingPurchase(_craftId, msg.sender, craftFee);
//         }
//     }

//     /**
//      * @dev Allows the admin to withdraw LRT tokens from the marketplace contract.
//      * @param _amount The amount of LRT tokens to be withdrawn.
//      * Only the admin can call this function to withdraw tokens.
//      */
//     function withdraw(uint256 _amount) external override onlyAdmin {
//         _withdraw(_amount);
//     }

//     /**
//      * @dev Allows a script to mint crafted tokens to the specified recipient.
//      * @param _tokenId The ID of the token that was crafted.
//      * @param _craftId The unique identifier of the craft.
//      * @param _recipient The address of the recipient who received the crafted tokens.
//      * @param _amount The amount of tokens that were crafted.
//      * Requirements:
//      * - The recipient address must not be the zero address.
//      * - The amount of tokens to be crafted must be greater than zero.
//      * Only scripts can mint crafted tokens.
//      */
//     function craft1155(
//         uint256 _tokenId,
//         uint256 _craftId,
//         address _recipient,
//         uint256 _amount
//     ) external override onlyScript validCraft(_craftId) {
//         require(
//             _recipient != address(0),
//             "LandRockerERC1155::Not valid address"
//         );

//         require(
//             _amount > 0,
//             "LandRockerERC1155::Insufficient amount, equal to zero"
//         );

//         landRockerERC1155.mint(_tokenId, _recipient, _amount);

//         emit Crafted1155Tokens(
//             address(landRockerERC1155),
//             _tokenId,
//             _craftId,
//             _recipient,
//             _amount
//         );
//     }

//     /**
//      * @dev Allows a script to mint crafted tokens to the specified recipient.
//      * @param _craftId The unique identifier of the craft.
//      * @param _recipient The address of the recipient who received the crafted token.
//      * @param _collection The address of the collection the crafted token belongs to.
//      * Requirements:
//      * - The recipient address must not be the zero address.
//      * - The collection should be active.
//      * Only scripts can mint crafted tokens.
//      */
//     function craft721(
//         uint256 _craftId,
//         address _recipient,
//         address _collection
//     ) external override onlyScript validCraft(_craftId) {
//         require(
//             _recipient != address(0),
//             "LandRockerERC721::Not valid address"
//         );

//         require(
//             landrocker721Collections[_collection],
//             "PlanetCraft::Collection is not active"
//         );

//         uint256 tokenId = ILandRockerERC721(_collection).safeMint(_recipient);

//         emit Crafted721Tokens(_collection, tokenId, _craftId, _recipient);
//     }

//     /**
//      * @dev Sets whether a particular ERC721 collection is considered valid.
//      * @param _addr The address of the ERC721 collection contract.
//      * @param _isActive A boolean indicating if the collection is active for sell.
//      */
//     function setLandRockerCollection(
//         address _addr,
//         bool _isActive
//     ) external override onlyAdmin validAddress(_addr) {
//         landrocker721Collections[_addr] = _isActive;

//         // Emit an event upon successful validation status update.
//         emit CollectionAdded(_addr, _isActive);
//     }

//     /**
//      * @dev Handles the receipt of ERC1155 tokens when they are transferred to this contract.
//      * @param operator The address which called `safeTransferFrom` function (i.e., the sender).
//      * @param from The address which previously owned the token.
//      * @param id The Id of the ERC1155 token being transferred.
//      * @param value The amount of tokens being transferred.
//      * @param data Additional data with no specified format.
//      * @return A bytes4 magic value, indicating ERC1155Receiver compatibility.
//      *  See {IERC1155-onERC1155Received}.
//      */
//     function onERC1155Received(
//         address operator,
//         address from,
//         uint256 id,
//         uint256 value,
//         bytes calldata data
//     ) external pure override returns (bytes4) {
//         return this.onERC1155Received.selector;
//     }

//     /**
//      * @dev Handles the receipt of a batch of ERC1155 tokens when they are transferred to this contract.
//      * @param operator The address which called `safeBatchTransferFrom` function (i.e., the sender).
//      * @param from The address which previously owned the tokens.
//      * @param ids An array of Ids for the ERC1155 tokens being transferred.
//      * @param values An array of amounts corresponding to the tokens being transferred.
//      * @param data Additional data with no specified format.
//      * @return A bytes4 magic value, indicating ERC1155Receiver compatibility (0xbc197c81).
//      *  See {IERC1155-onERC1155BatchReceived}.
//      */
//     function onERC1155BatchReceived(
//         address operator,
//         address from,
//         uint256[] calldata ids,
//         uint256[] calldata values,
//         bytes calldata data
//     ) external pure override returns (bytes4) {
//         return this.onERC1155BatchReceived.selector;
//     }

//     /**
//      * @dev See {IERC165Upgradeable-supportsInterface}.
//      */
//     function supportsInterface(
//         bytes4 interfaceId
//     ) public view virtual override returns (bool) {
//         return
//             interfaceId == type(IERC1155ReceiverUpgradeable).interfaceId ||
//             interfaceId == type(IERC165Upgradeable).interfaceId;
//     }

//     // Internal Functions

//     /**
//      * @dev Withdraws a specified amount of LRT tokens to the treasury.
//      * @param _amount The amount of LRT tokens to withdraw.
//      */
//     function _withdraw(uint256 _amount) internal onlyAdmin {
//         // Ensure that the withdrawal amount is greater than zero.
//         require(_amount > 0, "PlanetCraft::Insufficient amount, equal to zero");

//         // Check if the contract holds enough LRT tokens to perform the withdrawal.
//         require(
//             _lrt.balanceOf(address(this)) >= _amount,
//             "PlanetCraft::No balance to withdraw"
//         );

//         // Get the address of the treasury where the withdrawn LRT tokens will be sent.
//         address treasury = _landrocker.treasury();

//         // Attempt to transfer the specified amount of LRT tokens to the treasury.
//         // Ensure that the transfer was successful; otherwise, revert the transaction.
//         require(
//             _lrt.transfer(treasury, _amount),
//             "PlanetCraft::Unsuccessful transfer"
//         );
//         emit Withdrawn(_amount, treasury);
//     }

//     /**
//      * @dev Authorizes a contract upgrade.
//      * @param newImplementation The address of the new contract implementation.
//      */
//     function _authorizeUpgrade(
//         address newImplementation
//     ) internal override onlyOwner {}

//     /**
//      * @dev Checks if the caller has approved the contract to spend enough LRT tokens.
//      * @param price The price of the item being purchased.
//      */
//     function _checkFund(uint256 price) internal view {
//         // Check if the caller (msg.sender) has approved an allowance of LRT tokens for this contract
//         // that is greater than or equal to the specified purchase price.
//         require(
//             _lrt.allowance(msg.sender, address(this)) >= price,
//             "PlanetCraft::Allowance error"
//         );
//     }

//     /**
//      * @dev Handles the purchase of a planet craft using LRT balance.
//      * @param _craftId ID of the craft.
//      * @param _payer Address of the payer.
//      * @param _craftFee Fee of the craft.
//      */
//     function _processCraftPurchase(
//         uint256 _craftId,
//         address _payer,
//         uint256 _craftFee
//     ) private {
//         // Check if the payer has enough funds
//         _checkFund(_craftFee);

//         // Transfer LRT tokens from the payer to the PlanetCraft contract
//         require(
//             _lrt.transferFrom(_payer, address(this), _craftFee),
//             "PlanetCraft::Unsuccessful transfer"
//         );

//         // Emit an event indicating a successful craft purchase
//         emit PaidCraftFeeWithBalance(_craftId, msg.sender, _craftFee);
//     }

//     /**
//      * @dev Handles the purchase ofa planet craft using vested LRT balance.
//      * @param _craftId ID of the craft.
//      * @param _payer Address of the payer.
//      * @param _craftFee Fee of the craft.
//      */
//     function _processVestingPurchase(
//         uint256 _craftId,
//         address _payer,
//         uint256 _craftFee
//     ) private {
//         // Get the vested and claimed amounts from the vesting contract
//         (, uint256 vestedAmount, uint256 claimedAmount) = _lrtVesting
//             .holdersStat(_payer);

//         // Ensure that the payer has enough vested balance
//         require(
//             claimedAmount + _craftFee <= vestedAmount,
//             "PlanetCraft::Insufficient vested balance"
//         );

//         // Emit an event indicating a successful craft purchase
//         emit PaidCraftFeeWithVesting(_craftId, _payer, _craftFee);

//         _lrtVesting.setDebt(_payer, _craftFee);
//     }
// }
