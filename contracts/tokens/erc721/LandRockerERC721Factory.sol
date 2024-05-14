// SPDX-License-Identifier: GPL-3.0
pragma solidity 0.8.6;

import {Counters} from "@openzeppelin/contracts/utils/Counters.sol";
import {Clones} from "@openzeppelin/contracts/proxy/Clones.sol";

import {IAccessRestriction} from "./../../access/IAccessRestriction.sol";
import {ILandRockerERC721} from "./ILandRockerERC721.sol";
import {ILandRockerERC721Factory} from "./ILandRockerERC721Factory.sol";

// import "hardhat/console.sol";

/**
 * @title LandRockerERC721Factory
 * @dev A contract for creating and managing LandRockerERC721 clones.
 * This contract implements the ILandRockerERC721Factory interface.
 */
contract LandRockerERC721Factory is ILandRockerERC721Factory {
    using Counters for Counters.Counter;

    // Stores the addresses of LandRockerERC721 clones created by this factory.
    mapping(uint256 => address) public landRockerERC721Clones;
    // Stores the creators (owners) of LandRockerERC721 clones.
    mapping(address => address) public landRockerERC721Creators;
    // Stores the creators (owners) of LandRockerERC721 clones.
    mapping(bytes32 => bool) public isUsedCollection;
    // The address of the implementation contract used for cloning.
    address public implementionAddress;

    // The access restriction contract.
    IAccessRestriction public immutable accessRestriction;
    // Reference to the ILandRockerERC721 interface.
    ILandRockerERC721 public landrocker721;

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
     * @dev Creates a new LandRockerERC721 clone with the provided parameters.
     * @param _name The name of the collection.
     * @param _symbol The symbol of the collection.
     * @param _receiver The address of the royalty recipient.
     * @param _feeNumerator The numerator of the royalty fee.
     * @param _baseURI The base URI for token metadata.
     */
    function createLandRockerERC721(
        string memory _name,
        string memory _symbol,
        address _receiver,
        uint96 _feeNumerator,
        string memory _baseURI
    ) external override onlyAdmin {
        require(
            isUsedCollection[keccak256(abi.encodePacked(_name))] == false,
            "LandRockerERC721::Duplicate collection name"
        );

        // Clone a new LandRockerERC721 contract from the provided implementation.
        landrocker721 = ILandRockerERC721(Clones.clone(implementionAddress));

        // Initialize the cloned contract with the provided parameters.
        landrocker721.erc721Init(
            _name,
            _symbol,
            address(accessRestriction),
            _receiver,
            _feeNumerator,
            _baseURI
        );

        // Record the creator of this clone.
        landRockerERC721Creators[address(landrocker721)] = msg.sender;
        // Store the address of the cloned contract and mark the collection name as used.
        landRockerERC721Clones[_cloneId.current()] = (address(landrocker721));

        isUsedCollection[keccak256(abi.encodePacked(_name))] = true;
        _cloneId.increment();

        emit LandRockerERC721Created(
            address(landrocker721),
            _name,
            _symbol,
            _baseURI
        );
    }
}
