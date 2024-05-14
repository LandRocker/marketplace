// SPDX-License-Identifier: GPL-3.0
pragma solidity 0.8.6;

import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import {UUPSUpgradeable} from "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import {IAccessRestriction} from "./../access/IAccessRestriction.sol";
import {ILandRocker} from "./ILandRocker.sol";

/**
 * @title LandRocker
 * @dev Contract for managing system fees and treasury addresses.
 */
contract LandRocker is ILandRocker, Initializable, UUPSUpgradeable {
    IAccessRestriction public accessRestriction;

    /**
     * @dev The system fee percentage deducted from each transaction.
     */
    uint256 public override systemFee;
    /**
     * @dev The address of the treasury where system fees for general transactions are sent.
     */
    address public override treasury;

    /**
     * @dev The address of the treasury where system fees for ERC721 transactions are sent.
     */
    address public override treasury721;

    /**
     * @dev The address of the treasury where system fees for ERC1155 transactions are sent.
     */
    address public override treasury1155;

    // Mapping to store collections and their validity
    mapping(address => bool) public override landrocker1155Collections;

    // Mapping to store collections and their validity
    mapping(address => bool) public override landrocker721Collections;

    /**
     * @dev Modifier to restrict access to the owner.
     */
    modifier onlyOwner() {
        accessRestriction.ifOwner(msg.sender);
        _;
    }

    /**
     * @dev Modifier to check if an address is valid.
     * @param _address The address to check.
     */
    modifier validAddress(address _address) {
        require(_address != address(0), "LandRocker::Not valid address");
        _;
    }

    /**
     * @dev Modifier to restrict access to administrators.
     */
    modifier onlyAdmin() {
        accessRestriction.ifAdmin(msg.sender);
        _;
    }

    /**
     * @dev Modifier to to check if a collection is valid.
     */
    modifier validCollection1155(address _collection) {
        require(
            landrocker1155Collections[_collection],
            "LandRocker::Collection1155 is not active"
        );
        _;
    }

     /**
     * @dev Modifier to to check if a collection is valid.
     */
    modifier validCollection721(address _collection) {
        require(
            landrocker721Collections[_collection],
            "LandRocker::Collection721 is not active"
        );
        _;
    }

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    /**
     * @dev Initializes the contract.
     * @param _accessRestriction The address of the access restriction contract.
     */
    function initializeLandRocker(
        address _accessRestriction
    ) external override initializer {
        __UUPSUpgradeable_init();
        accessRestriction = IAccessRestriction(_accessRestriction);
        systemFee = 1300;
    }

    /**
     * @dev Sets the system fee.
     * @param _systemFee The new system fee to set.
     */
    function setSystemFee(uint256 _systemFee) external override onlyAdmin {
        // Ensure that the provided `_systemFee` is less than or equal to the current system fee.
        require(_systemFee <= systemFee, "LandRocker::Invalid system fee");
        systemFee = _systemFee;
        emit SystemFeeUpdated(_systemFee);
    }

    /**
     * @dev Sets the treasury address.
     * @param _treasury The new treasury address to set.
     */
    function setTreasuryAddress(
        address _treasury
    ) external override validAddress(_treasury) onlyAdmin {
        treasury = _treasury;
        emit TreasuryAddressUpdated(_treasury);
    }

    /**
     * @dev Sets the treasury address for ERC721 tokens.
     * @param _treasury The new treasury address for ERC721 tokens to set.
     */
    function setTreasuryAddress721(
        address _treasury
    ) external override validAddress(_treasury) onlyAdmin {
        treasury721 = _treasury;
        emit TreasuryAddress721Updated(_treasury);
    }

    /**
     * @dev Sets the treasury address for ERC1155 tokens.
     * @param _treasury The new treasury address for ERC1155 tokens to set.
     */
    function setTreasuryAddress1155(
        address _treasury
    ) external override validAddress(_treasury) onlyAdmin {
        treasury1155 = _treasury;
        emit TreasuryAddress1155Updated(_treasury);
    }

     /**
     * @dev Sets whether a particular ERC1155 collection is considered valid.
     * @param _addr The address of the ERC1155 collection contract.
     * @param _isActive A boolean indicating if the collection is active for sell other usecases.
     */
    function setLandRockerCollection1155(
        address _addr,
        bool _isActive
    ) external override onlyAdmin validAddress(_addr) {
       
        landrocker1155Collections[_addr] = _isActive;
        // Emit an event upon successful validation status update.
        emit Collection1155Added(_addr, _isActive);
    }

    /**
     * @dev Sets whether a particular ERC1155 collection is considered valid.
     * @param _addr The address of the ERC721 collection contract.
     * @param _isActive A boolean indicating if the collection is active for sell or other usecases.
     */
    function setLandRockerCollection721(
        address _addr,
        bool _isActive
    ) external override onlyAdmin validAddress(_addr) {
       
        landrocker721Collections[_addr] = _isActive;
        // Emit an event upon successful validation status update.
        emit Collection721Added(_addr, _isActive);
    }



    /**
     * @dev Authorizes a contract upgrade.
     * @param newImplementation The address of the new contract implementation.
     */
    function _authorizeUpgrade(
        address newImplementation
    ) internal override onlyOwner {}
}
