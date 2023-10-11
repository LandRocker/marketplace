// SPDX-License-Identifier: MIT

pragma solidity ^0.8.6;

import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import {IAccessRestriction} from "./../../access/IAccessRestriction.sol";
import {ILandRocker} from "./../../landrocker/ILandRocker.sol";

contract LandRockerUpgraded is ILandRocker, Initializable, UUPSUpgradeable {
    IAccessRestriction public accessRestriction;

    uint256 public override systemFee;
    address public override treasury;
    address public override treasury721;
    address public override treasury1155;
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

    // constructor(address accessRestriction_) {
    //     _disableInitializers();
    //     accessRestriction = IAccessRestriction(accessRestriction_);
    //     systemFee = 250;
    // }

string public greeting;

    function __LandRockerUpgraded_init(
        address accessRestriction_) public reinitializer(2) {
        __UUPSUpgradeable_init();
        accessRestriction = IAccessRestriction(accessRestriction_);
        systemFee = 250;
    }

 function greetingNew() public pure returns (string memory) {
        return "New Upgradeable World!";
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
