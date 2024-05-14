// SPDX-License-Identifier: GPL-3.0

pragma solidity 0.8.6;

import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import {UUPSUpgradeable} from "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";

import {IAccessRestriction} from "./../../access/IAccessRestriction.sol";
import {ILandRockerUpgraded} from "./ILandRockerUpgraded.sol";

contract LandRockerUpgraded is Initializable, UUPSUpgradeable,ILandRockerUpgraded {
    IAccessRestriction public accessRestriction;

    uint256 public override systemFee;
    address public override treasury;
    address public override treasury721;
    address public override treasury1155;
    string public override greeting;

    //two address for treasury

    modifier onlyOwner() {
        accessRestriction.ifOwner(msg.sender);
        _;
    }

    modifier validAddress(address _address) {
        require(_address != address(0), "LandRocker::Not valid address");
        _;
    }

    modifier onlyAdmin() {
        accessRestriction.ifAdmin(msg.sender);
        _;
    }

       /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }



    function initializeLandRocker(
        address accessRestriction_,string memory _greeting) external override reinitializer(2) {
        __UUPSUpgradeable_init();
        accessRestriction = IAccessRestriction(accessRestriction_);
        systemFee = 1300;
        greeting = _greeting;
    }

 
    function setSystemFee(uint256 _systemFee) external override onlyAdmin {
        require(_systemFee <= systemFee, "LandRocker::Invalid system fee");
        systemFee = _systemFee;
        emit SystemFeeUpdated(_systemFee);
    }

    function setTreasuryAddress(
        address _treasury
    ) external override validAddress(_treasury) onlyAdmin {
        treasury = _treasury;
        emit TreasuryAddressUpdated(_treasury);
    }

    function setTreasuryAddress721(
        address _treasury
    ) external override validAddress(_treasury) onlyAdmin {
        treasury721 = _treasury;
        emit TreasuryAddress721Updated(_treasury);
    }

    function setTreasuryAddress1155(
        address _treasury
    ) external override validAddress(_treasury) onlyAdmin {
        treasury1155 = _treasury;
        emit TreasuryAddress1155Updated(_treasury);
    }

    function _authorizeUpgrade(
        address newImplementation
    ) internal override onlyOwner {}

}
