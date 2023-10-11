// SPDX-License-Identifier: MIT
pragma solidity 0.8.6;

import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import {IAccessRestriction} from "./../access/IAccessRestriction.sol";
import {ILandRocker} from "./ILandRocker.sol";

/**
 * @title LandRocker
 * @dev Contract for managing system fees and treasury addresses.
 */
contract LandRocker is ILandRocker, Initializable, UUPSUpgradeable {
    IAccessRestriction public accessRestriction;

    uint256 public override systemFee;
    address public override treasury;
    address public override treasury721;
    address public override treasury1155;

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

    string public greeting;

    /**
     * @dev Initializes the contract.
     * @param accessRestriction_ The address of the access restriction contract.
     */
    function __LandRocker_init(address accessRestriction_) public initializer {
        __UUPSUpgradeable_init();
        accessRestriction = IAccessRestriction(accessRestriction_);
        systemFee = 250;
        greeting = "Hello, upgradeable world!";
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
     * @dev Authorizes a contract upgrade.
     * @param newImplementation The address of the new contract implementation.
     */
    function _authorizeUpgrade(
        address newImplementation
    ) internal override onlyOwner {}
}
