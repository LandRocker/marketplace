// SPDX-License-Identifier: GPL-3.0
pragma solidity 0.8.6;

import {Counters} from "@openzeppelin/contracts/utils/Counters.sol";
import {Math} from "@openzeppelin/contracts/utils/math/Math.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import {ILRTDistributor} from "./../tokens/erc20/lrtDistributor/ILRTDistributor.sol";
import {IAccessRestriction} from "../access/IAccessRestriction.sol";
// import {ILRTVestingTeam} from "./IKRTVestingTeam.sol";
import {ILRT} from "./../tokens/erc20/ILRT.sol";
import {ILRTVestingTeam} from "./ILRTVestingTeam.sol";

contract LRTVestingTeam is ILRTVestingTeam, ReentrancyGuard {
    using Counters for Counters.Counter;

    uint64 public constant INITIAL_LOCK_DURATION = 14 days;
    uint64 public constant SECONDARY_LOCK_DURATION = 180 days;
    uint16 public constant INITIAL_RELEASE_PERCENTAGE = 6600;
    uint16 public constant SECONDARY_RELEASE_PERCENTAGE = 3400;

    // LRT distributor reference
    ILRTDistributor public immutable lrtDistributor;
    // Access control reference
    IAccessRestriction public immutable accessRestriction;

    uint64 public listingDate;
    uint64 public duration;

    mapping(address => Vesting) public override userVestings;
    mapping(address => bool) public hasRevoked;

    /**
     * @dev Reverts if caller is not admin
     */
    modifier onlyAdmin() {
        accessRestriction.ifAdmin(msg.sender);
        _;
    }

    modifier onlyNotRevoked(address _addr) {
        require(
            hasRevoked[_addr] == false,
            "LRTVestingTeam::Your vesting is revoked"
        );
        _;
    }

    constructor(
        address _lrtDistributor,
        address _accessRestrictionAddress,
        uint64 _listingDate,
        uint64 _duration
    ) {
        lrtDistributor = ILRTDistributor(_lrtDistributor);
        accessRestriction = IAccessRestriction(_accessRestrictionAddress);
        listingDate = _listingDate;
        duration = _duration;
    }

    function setListingDate(uint64 _listingDate) external override onlyAdmin {
        require(_listingDate > 0, "LRTVestingTeam::Listing date not set");
        listingDate = _listingDate;
    }

    function setDuration(uint64 _duration) external override onlyAdmin {
        require(_duration > 0, "LRTVestingTeam::Duration not set");
        duration = _duration;
    }

    function createVesting(
        address _beneficiary,
        uint256 _amount
    ) external override onlyAdmin {
        require(_amount > 0, "LRTVestingTeam::Amount should be greater than 0");
        require(listingDate > 0, "LRTVestingTeam::Listing date not set");
        require(duration > 0, "LRTVestingTeam::Duration not set");
        require(
            userVestings[_beneficiary].vestedAmount == 0,
            "LRTVestingTeam::Vesting already created"
        );

        Vesting storage userVesting = userVestings[_beneficiary];
        userVesting.vestedAmount = _amount;
        userVesting.beneficiary = _beneficiary;
        userVesting.startDate = listingDate;
        userVesting.endDate = listingDate + duration;
        userVesting.initialUnlockDate = listingDate + INITIAL_LOCK_DURATION;
        userVesting.secondaryUnlockDate = listingDate + SECONDARY_LOCK_DURATION;
        userVesting.claimedAmount = 0;

        emit VestingCreated(
            _beneficiary,
            listingDate,
            userVesting.initialUnlockDate,
            userVesting.secondaryUnlockDate,
            listingDate + duration,
            _amount
        );
    }

    function claim() external override nonReentrant onlyNotRevoked(msg.sender) {
        uint256 claimable = _getClaimable(msg.sender);
        require(claimable > 0, "LRTVestingTeam::Not claimable yet");

        bool success = lrtDistributor.distribute(
            bytes32("Team"),
            claimable,
            msg.sender
        );

        // Require success
        require(success, "LRTVestingTeam::Fail transfer");
        
        emit Claimed(msg.sender, claimable);
    }

    function revoke(
        address _beneficiary
    ) external override nonReentrant onlyAdmin onlyNotRevoked(_beneficiary) {
        uint256 claimable = _getClaimable(_beneficiary);
        require(claimable > 0, "LRTVestingTeam::Not claimable yet");

        hasRevoked[_beneficiary] = true;
        bool success = lrtDistributor.distribute(
            bytes32("Team"),
            claimable,
            _beneficiary
        );

        // Require success
        require(success, "LRTVestingTeam::Fail transfer");

        emit Revoked(_beneficiary, claimable);
    }

    function _getClaimable(
        address _beneficiary
    ) private returns (uint256) {
        Vesting storage vesting = userVestings[_beneficiary];

        require(
            vesting.vestedAmount - vesting.claimedAmount > 0,
            "LRTVestingTeam::Not claimable yet"
        );
        uint64 currentDate = uint64(block.timestamp);
        uint256 claimable = 0;
        uint256 vestedAmount = vesting.vestedAmount;
        uint256 claimedAmount = vesting.claimedAmount;

        if (currentDate >= vesting.secondaryUnlockDate) {
            claimable = vestedAmount;
        } else if (
            currentDate < vesting.secondaryUnlockDate &&
            currentDate >= vesting.initialUnlockDate
        ) {
            claimable = (vestedAmount * INITIAL_RELEASE_PERCENTAGE) / 10000;
        } else {
            claimable = 0;
        }

        claimable = claimable > claimedAmount ? claimable - claimedAmount : 0;

        vesting.claimedAmount += claimable;
        return claimable;
    }
}
