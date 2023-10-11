// SPDX-License-Identifier: MIT
pragma solidity 0.8.6;

import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import {IERC1155Receiver} from "@openzeppelin/contracts/token/ERC1155/IERC1155Receiver.sol";
import {IERC1155} from "@openzeppelin/contracts/interfaces/IERC1155.sol";
import {IERC165} from "@openzeppelin/contracts/interfaces/IERC165.sol";

import {LandRockerERC1155} from "./../tokens/erc1155/LandRockerERC1155.sol";
import {ILRT} from "./../tokens/erc20/ILRT.sol";
import {ILRTDistributor} from "./../tokens/erc20/lrtDistributor/ILRTDistributor.sol";
import {IAccessRestriction} from "../access/IAccessRestriction.sol";

/**
 * @title Stake Contract
 * @dev A base contract for stake-related functionality. Provides access control and upgradeability features.
 */
abstract contract Stake is Initializable, UUPSUpgradeable {
    IAccessRestriction internal _accessRestriction;
    ILRTDistributor internal _lrtDistributor;

    /**
     * @dev Modifier to restrict function access to the owner.
     */
    modifier onlyOwner() {
        _accessRestriction.ifOwner(msg.sender);
        _;
    }

    /**
     * @dev Modifier to restrict function access to admin users.
     */
    modifier onlyAdmin() {
        _accessRestriction.ifAdmin(msg.sender);
        _;
    }

    /**
     * @dev Modifier to restrict function access to script users.
     */
    modifier onlyScript() {
        _accessRestriction.ifScript(msg.sender);
        _;
    }

    /**
     * @dev Initializes the contract with access control and LRT distribution contracts.
     * @param accessRestriction_ Address of the access control contract.
     * @param lrtDistributor_ Address of the LRT distribution contract.
     */
    function initialize(
        address accessRestriction_,
        address lrtDistributor_
    ) public virtual initializer {
        __UUPSUpgradeable_init();
        _accessRestriction = IAccessRestriction(accessRestriction_);
        _lrtDistributor = ILRTDistributor(lrtDistributor_);
    }

    /**
     * @dev Authorizes a contract upgrade.
     * @param newImplementation The address of the new contract implementation.
     */
    function _authorizeUpgrade(
        address newImplementation
    ) internal override onlyOwner {}
}
