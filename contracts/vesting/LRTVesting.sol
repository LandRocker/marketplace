// SPDX-License-Identifier: MIT
pragma solidity 0.8.6;

import {Counters} from "@openzeppelin/contracts/utils/Counters.sol";
import {Math} from "@openzeppelin/contracts/utils/math/Math.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import {ILRTDistributor} from "./../tokens/erc20/lrtDistributor/ILRTDistributor.sol";
import {IAccessRestriction} from "../access/IAccessRestriction.sol";
import {ILRTVesting} from "./ILRTVesting.sol";
import {ILRT} from "./../tokens/erc20/ILRT.sol";

import "hardhat/console.sol";

/**
 * @title LRTVesting
 * @dev Manages vesting plans and LRT distributions
 */
contract LRTVesting is ReentrancyGuard, ILRTVesting {
    // Use counters library for incrementing plan IDs
    using Counters for Counters.Counter;

    // Total vesting amount across all schedules
    uint256 public override totalVestingAmount;

    // Vesting plan details by plan ID
    mapping(uint256 => VestingPlan) public override vestingPlans;

    // User vesting schedules by user and plan ID
    mapping(address => mapping(uint256 => UserVesting[]))
        public
        override userVestings;

    // Vesting stats by user
    mapping(address => HolderStat) public override holdersStat;

    // Revocation status by user and plan ID
    mapping(address => mapping(uint256 => bool)) public hasRevoked;

    // LRT distributor reference
    ILRTDistributor public lrtDistributor;

    // Access control reference
    IAccessRestriction public accessRestriction;

    // Counter for vesting plan IDs
    Counters.Counter private _planId;

    /**
     * @dev Reverts if address is invalid
     */
    modifier validAddress(address _addr) {
        require(_addr != address(0), "LRTVesting::Not valid address");
        _;
    }

    /**
     * @dev Reverts if caller is not admin
     */
    modifier onlyAdmin() {
        accessRestriction.ifAdmin(msg.sender);
        _;
    }

    /**
     * @dev Reverts if caller unauthorized
     */
    modifier onlyAdminOrApprovedContract() {
        accessRestriction.ifAdminOrApprovedContract(msg.sender);
        _;
    }

    /**
     * @dev Reverts if vesting revoked
     */
    modifier onlyNotRevoked(address _beneficiary, uint256 _planID) {
        require(
            !hasRevoked[_beneficiary][_planID],
            "LRTVesting::Your vesting are revoked"
        );
        _;
    }

    /**
     * @dev Reverts if plan not revocable
     */
    modifier onlyRevocablePlan(uint256 _planID) {
        require(
            vestingPlans[_planID].revocable,
            "LRTVesting:Vesting is not revocable"
        );
        _;
    }

    /**
     * @dev LRTVesting Constructor
     */
    constructor(address _lrtDistributor, address _accessRestrictionAddress) {
        lrtDistributor = ILRTDistributor(_lrtDistributor);
        accessRestriction = IAccessRestriction(_accessRestrictionAddress);
    }

    /*
     * @dev Creates a new vesting plan
     * @param _startDate Start timestamp
     * @param _cliff Cliff duration
     * @param _duration Total duration
     * @param _revocable If revocable
     * @param _initialReleasePercentage Initial release percentage
     * @param poolName Liquidity pool name
     */
    function createVestingPlan(
        uint64 _startDate,
        uint64 _cliff,
        uint64 _duration,
        bool _revocable,
        uint16 _initialReleasePercentage,
        bytes32 _poolName
    ) external override onlyAdmin {
        // Validate cliff and duration
        require(_cliff <= _duration, "LRTVesting::Cliff priod is invalid");
        require(_duration > 0, "LRTVesting::Duration is not seted");

        // Create vesting plan
        VestingPlan memory plan = VestingPlan(
            _startDate,
            _cliff,
            _duration,
            _revocable,
            _initialReleasePercentage,
            _poolName
        );

        // Store plan by next plan ID
        vestingPlans[_planId.current()] = plan;

        // Emit event
        emit VestingPlanCreated(
            _planId.current(),
            _startDate,
            _cliff,
            _duration,
            _revocable,
            _initialReleasePercentage,
            _poolName
        );

        // Increment plan ID counter
        _planId.increment();
    }

    /**
     * @dev Creates new vesting schedule
     * @param _beneficiary Beneficiary address
     * @param _startDate Start timestamp
     * @param _amount Total vesting amount
     * @param _planID Plan ID
     * @return Success status
     */

    function createVesting(
        address _beneficiary,
        uint64 _startDate,
        uint256 _amount,
        uint256 _planID
    )
        external
        override
        onlyAdminOrApprovedContract
        validAddress(_beneficiary)
        returns (bool)
    {
        // Validate plan and amount
        require(_planID <= _planId.current(), "LRTVesting::Plan is not exist");
        require(_amount > 0, "LRTVesting::Amount is too low");

        // Get plan details
        VestingPlan memory vestingPlan = vestingPlans[_planID];

        // Validate start date
        require(
            _startDate >= vestingPlan.startDate,
            "LRTVesting::StartDate is not valid"
        );

        // Create user vesting schedule
        UserVesting memory userVesting = UserVesting(
            _amount, // Total vesting amount
            0, // Initial claimed amount
            _startDate, // End date
            _startDate + vestingPlan.cliff, // Unlock date
            _startDate + vestingPlan.duration, // End date
            _beneficiary // the beneficiary address
        );

        // Add new vesting schedule
        userVestings[_beneficiary][_planID].push(userVesting);

        // Update total vesting amount
        totalVestingAmount += _amount;

        // Update beneficiary stats
        HolderStat storage holderStat = holdersStat[_beneficiary];
        holderStat.vestingAmount += _amount;
        holderStat.vestingCount += 1;

        // Emit event
        emit VestingCreated(
            _planID,
            _beneficiary,
            _startDate,
            _startDate + vestingPlan.cliff,
            _startDate + vestingPlan.duration,
            _amount
        );

        return true;
    }

    /**
     * @dev Revokes vesting schedule
     * @param _beneficiary Beneficiary address
     * @param _planID Plan ID
     */
    function revoke(
        address _beneficiary,
        uint256 _planID
    )
        external
        override
        onlyAdmin
        onlyRevocablePlan(_planID)
        validAddress(_beneficiary)
        onlyNotRevoked(_beneficiary, _planID)
    {
        // Get currently claimable amount
        uint256 claimableAmount = _getClaimableToken(_beneficiary, _planID);

        // Release claimable amount
        _release(_planID, _beneficiary, claimableAmount);

        // Mark as revoked
        hasRevoked[_beneficiary][_planID] = true;

        // Emit event
        emit Revoked(_planID, claimableAmount, _beneficiary);
    }

    /**
     * @dev Claims vested tokens
     * @param _planID Plan ID
     */
    function claim(
        uint256 _planID
    ) external override nonReentrant onlyNotRevoked(msg.sender, _planID) {
        // Get claimable amount
        uint256 claimableAmount = _getClaimableToken(msg.sender, _planID);

        // Release tokens
        _release(_planID, msg.sender, claimableAmount);

        // Emit event
        emit Claimed(_planID, claimableAmount, msg.sender);
    }

    /**
     * @dev Creates vesting debt
     * @param _beneficiary Beneficiary address
     * @param _debtAmount Debt amount
     */
    function setDebt(
        address _beneficiary,
        uint256 _debtAmount
    ) external override onlyAdminOrApprovedContract validAddress(_beneficiary) {
        // Get beneficiary stats
        HolderStat storage holderStat = holdersStat[_beneficiary];

        // Validate debt amount
        require(
            holderStat.vestingAmount >=
                (_debtAmount + holderStat.claimedAmount),
            "LRTVesting::Debt limit Exceeded"
        );

        // Loop through vesting schedules
        uint256 remainingDebt = _debtAmount;

        for (uint16 i = 0; i < _planId.current() && remainingDebt > 0; i++) {
            UserVesting[] storage vestingList = userVestings[_beneficiary][i];

            for (
                uint16 j = 0;
                j < vestingList.length && remainingDebt > 0;
                j++
            ) {
                UserVesting storage currentVesting = vestingList[j];

                // Get available vesting amount
                uint256 availableAmount = currentVesting.totalAmount -
                    currentVesting.claimedAmount;

                // Calculate debt to claim from this vesting
                uint256 debtToClaim = Math.min(remainingDebt, availableAmount);

                // Update claimed amount
                currentVesting.claimedAmount += debtToClaim;

                // Update remaining debt
                remainingDebt -= debtToClaim;
            }
        }

        // Update total claimed
        holderStat.claimedAmount += _debtAmount;

        // Update total vesting amount
        totalVestingAmount -= _debtAmount;

        // Emit event
        emit DebtCreated(_debtAmount, _beneficiary);
    }

    /*
     * @dev Releases vested tokens to beneficiary
     * @param _beneficiary Beneficiary address
     * @param _planID Plan ID
     * @param __releaseAmount release amount
     */
    function _release(
        uint256 _planID,
        address _beneficiary,
        uint256 _releaseAmount
    ) private {
        // Validate amount
        require(_releaseAmount > 0, "LRTVesting::Not enough vested tokens");

        // Get vesting plan
        VestingPlan memory vestingPlan = vestingPlans[_planID];

        // Update beneficiary stats
        HolderStat storage holderStat = holdersStat[_beneficiary];
        holderStat.claimedAmount += _releaseAmount;

        // Update total vesting amount
        totalVestingAmount -= _releaseAmount;

        // Distribute tokens
        bool success = lrtDistributor.distribute(
            vestingPlan.poolName,
            _releaseAmount,
            _beneficiary
        );

        // Require success
        require(success, "LRTVesting::Fail transfer");
    }

    /**
     * @dev Calculates currently claimable tokens
     * @param _beneficiary Beneficiary address
     * @param _planID Plan ID
     */
    function _getClaimableToken(
        address _beneficiary,
        uint256 _planID
    ) private returns (uint256) {
        // Get vesting schedules
        UserVesting[] storage vestingList = userVestings[_beneficiary][_planID];

        // Get plan details
        VestingPlan memory vestingPlan = vestingPlans[_planID];

        // Validate vesting exists
        require(vestingList.length != 0, "LRTVesting::No vesting");

        // Get current time
        uint64 currentTime = uint64(block.timestamp);

        // Initialize claimable amount
        uint256 claimableAmount = 0;

        // Loop through vesting schedules
        for (uint256 i = 0; i < vestingList.length; i++) {
            // Get reference to current vesting schedule
            UserVesting storage currentVesting = vestingList[i];

            // Ensure correct beneficiary
            require(
                currentVesting.beneficiary == _beneficiary,
                "LRTVesting::Only beneficiary can claim"
            );

            // Initialize release amount
            uint256 releaseAmount = 0;

            // Check if fully vested
            if (currentTime >= currentVesting.endDate) {
                releaseAmount = currentVesting.totalAmount;
            } else if (currentTime > currentVesting.unlockDate) {
                // Calculate partial vesting amount
                uint64 elapsedTime = currentTime - currentVesting.unlockDate;
                console.log(elapsedTime, "elapsedTime");
                uint64 unlockDuration = currentVesting.endDate -
                    currentVesting.unlockDate;
                console.log(unlockDuration, "unlockDuration");
                uint256 initialRelease = (currentVesting.totalAmount *
                    vestingPlan.initialReleasePercentage) / 10000;
                uint256 remainingAfterInitial = currentVesting.totalAmount -
                    initialRelease;
                uint256 subsequentRelease = (remainingAfterInitial *
                    elapsedTime) / unlockDuration;

                releaseAmount = initialRelease + subsequentRelease;
            } else if (currentTime >= currentVesting.startDate) {
                // Within cliff period

                uint256 initialRelease = (currentVesting.totalAmount *
                    vestingPlan.initialReleasePercentage) / 10000;
                releaseAmount = initialRelease;
            }

            // Calculate available amount
            uint256 availableAmount = releaseAmount -
                currentVesting.claimedAmount;

            // Add to claimable amount
            claimableAmount += availableAmount;

            // Update claimed
            currentVesting.claimedAmount += availableAmount;
        }

        return claimableAmount;
    }
}
