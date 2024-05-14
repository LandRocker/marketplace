// SPDX-License-Identifier: GPL-3.0
pragma solidity 0.8.6;

import {Counters} from "@openzeppelin/contracts/utils/Counters.sol";
import {Clones} from "@openzeppelin/contracts/proxy/Clones.sol";

import {IAccessRestriction} from "./../../access/IAccessRestriction.sol";

import {ILRT} from "./../erc20/ILRT.sol";
import {ILandRocker} from "./../../landrocker/ILandRocker.sol";
import {ILRTVesting} from "./../../vesting/ILRTVesting.sol";
import {ILandRockerERC1155} from "./ILandRockerERC1155.sol";
import {ILandRockerERC1155Factory} from "./ILandRockerERC1155Factory.sol";


/**
 * @title LandRockerERC1155Factory
 * @dev A contract for creating and managing LandRockerERC1155 clones.
 * This contract implements the ILandRockerERC1155Factory interface.
 */
contract LandRockerERC1155Factory is ILandRockerERC1155Factory {
    using Counters for Counters.Counter;

    // Stores the addresses of LandRockerERC1155 clones created by this factory.
    mapping(uint256 => address) public landRockerERC1155Clones;
    // Stores the creators (owners) of LandRockerERC1155 clones.
    mapping(address => address) public landRockerERC1155Creators;
    // Stores the creators (owners) of LandRockerERC1155 clones.
    mapping(bytes32 => bool) public isUsedCollection;
    // The address of the implementation contract used for cloning.
    address public implementionAddress;

    // The access restriction contract.
    IAccessRestriction public immutable accessRestriction;
    ILandRockerERC1155 public landrocker1155;

    Counters.Counter private _cloneId;

    /**
     * @dev Modifier to ensure only an admin can call the function.
     */
    modifier onlyAdmin() {
        accessRestriction.ifAdmin(msg.sender);
        _;
    }

    /**
     * @dev Constructor to initialize the factory with the address of the access restriction contract.
     * @param _accessRestriction The address of the access restriction contract.
     */
    constructor(address _accessRestriction) {
        accessRestriction = IAccessRestriction(_accessRestriction);
    }

    /**
     * @dev Sets the address of the implementation contract used for cloning.
     * @param _implementionAddress The address of the implementation contract.
     */
    function setImplementationAddress(
        address _implementionAddress
    ) external override onlyAdmin {
        implementionAddress = _implementionAddress;
    }

    /**
     * @dev Creates a new LandRockerERC1155 clone with the provided parameters.
     * @param _name The name of the collection.
     * @param _symbol The symbol of the collection.
     * @param _receiver The address of the royalty recipient.
     * @param _feeNumerator The numerator of the royalty fee.
     * @param _baseURI The base URI for token metadata.
     */
    function createLandRockerERC1155(
        string memory _name,
        string memory _symbol,
        address _receiver,
        uint96 _feeNumerator,
        string memory _baseURI
    ) external override onlyAdmin {
        require(
            isUsedCollection[keccak256(abi.encodePacked(_name))] == false,
            "LandRockerERC1155::Duplicate collection name"
        );

        // Clone a new LandRockerERC1155 contract from the provided implementation.
        landrocker1155 = ILandRockerERC1155(Clones.clone(implementionAddress));

        // Initialize the cloned contract with the provided parameters.
        landrocker1155.erc1155Init(
            _name,
            _symbol,
            _receiver,
            _feeNumerator,
            _baseURI,
            address(accessRestriction)
        );

        // Record the creator of this clone.
        landRockerERC1155Creators[address(landrocker1155)] = msg.sender;
        // Store the address of the cloned contract and mark the collection name as used.
        landRockerERC1155Clones[_cloneId.current()] = (address(landrocker1155));

        isUsedCollection[keccak256(abi.encodePacked(_name))] = true;
        _cloneId.increment();

        emit LandRockerERC1155Created(
            address(landrocker1155),
            _name,
            _symbol,
            _baseURI
        );
    }
}
