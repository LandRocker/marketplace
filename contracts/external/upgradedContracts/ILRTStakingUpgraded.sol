// SPDX-License-Identifier: GPL-3.0
pragma solidity 0.8.6;

/**
 * @title LRT Stake Interface
 * @dev This interface defines the methods and events for managing staking on the LRTStaking contract.
 */
interface ILRTStakingUpgraded {
    // Struct to represent a user's staking schedule.
    struct UserStake {
        uint8 duration; // Duration The duration of the staking schedule in months.
        uint16 apr; // The annual percentage rate (APR) for the staking schedule when the user staking schedule started.
        uint64 startDate; // The timestamp when the staking schedule started.
        uint256 stakedAmount; // The amount of tokens staked by the user.
        uint256 claimedAmount; // claimedAmount The amount of tokens claimed by the user from the staking schedule.
        uint256 rewardAmount; // rewardAmount The total reward amount for the staking schedule.
    }

    /**
     * @dev Emitted when a user stakes tokens.
     * @param staker The address of the staker.
     * @param duration The Id of the staked token.
     * @param amount The amount of tokens staked.
     * @param index The index of the staking schedule.
     */
    event LRTStaked(
        address indexed staker,
        uint256 amount,
        uint8 duration,
        uint16 index
    );
    /**
     * @dev Emitted when a user unstakes tokens.
     * @param staker The address of the staker.
     * @param index The index of the staking schedule.
     * @param amount The amount of tokens staked.
     */
    event LRTUnStaked(address indexed staker, uint16 index, uint256 amount);

    /**
     * @dev Emitted when the APR is updated.
     * @param duration The duration of the staking schedule in months.
     * @param apr The annual percentage rate (APR) for the staking schedule.
     */
    event UpdatedAPR(uint8 duration, uint16 apr);

    /**
     * @dev Emitted when the stake capacity is updated.
     * @param stakeCapacity The maximum stake capacity.
     */
    event UpdatedStakeCapacity(uint256 stakeCapacity);

    /**
     * @dev Emitted when the threshold is updated.
     * @param threshold The threshold amount.
     */
    event UpdatedThreshold(uint256 threshold);

    /**
     * @dev Emitted when the duration limit is updated.
     * @param durationLimit The duration limit in seconds.
     */
    event UpdatedDurationLimit(uint64 durationLimit);

    /**
     * @dev Emitted when a user unstakes tokens.
     * @param staker The address of the staker.
     * @param index The index of the staking schedule.
     * @param amount The amount of tokens staked.
     */
    event StakedRewardClaimed(
        address indexed staker,
        uint16 index,
        uint256 amount
    );

    /**
     * @dev Initializes the PlanetStake contract.
     * @param _accessRestriction The address of the AccessRestriction contract.
     * @param _lrt The address of the LRT contract.
     * @param _greeting The greeting message to be displayed on the marketplace.
     */
    function initializeLRTStake(
        address _accessRestriction,
        address _lrt,
        string memory _greeting
    ) external;

    /**
     * @dev Sets the annual percentage rate (APR) for a specific duration.
     * @param duration The duration of the staking schedule in months.
     * @param apr The annual percentage rate (APR) for the staking schedule.
     */
    function setAPR(uint8 duration, uint16 apr) external;

    /**
     * @dev Sets the maximum stake capacity allowed by the contract.
     * @param _stakeCapacity The maximum stake capacity.
     */
    function setStakeCapacity(uint256 _stakeCapacity) external;

    /**
     * @dev Sets the threshold amount required for staking.
     * @param _threshold The threshold amount.
     */
    function setThreshold(uint256 _threshold) external;

    /**
     * @dev Sets the duration limit for staking.
     * @param _durationLimit The duration limit in seconds.
     */
    function setDurationLimit(uint64 _durationLimit) external;

    /**
     * @dev Stakes a specific token.
     * @param amount The Id of the token to stake.
     * @param duration The quantity of tokens staked.
     */
    function stake(uint256 amount, uint8 duration) external;

    /**
     * @dev Unstakes a specific token.
     * @param _index The index of the staking schedule.
     */
    function unstake(uint16 _index) external;

    /**
     * @dev Claims rewards for a specific staking schedule.
     * @param _index The index of the staking schedule.
     */
    function claim(uint16 _index) external;

    /**
     * @dev Retrieves the annual percentage rate (APR) for a specific staking duration.
     * @param _duration The duration for which to retrieve the APR.
     * @return apr The APR for the specified duration.
     */
    function APRs(uint8 _duration) external view returns (uint16 apr);

    /**
     * @dev Returns staking data for a user's stake.
     * @param _user The Id of the staked token.
     * @param _index The Id of the staked token.
     * @return duration The quantity of tokens staked.
     * @return apr The annual percentage rate (APR) for the staking schedule when the user staking schedule started.
     * @return startDate The Id of the staked token.
     * @return stakedAmount The quantity of claimed planet.
     * @return claimedAmount The amount of tokens claimed by the user from the staking schedule.
     * @return rewardAmount The total reward amount for the staking schedule.
     */
    function userStakes(
        address _user,
        uint16 _index
    )
        external
        view
        returns (
            uint8 duration,
            uint16 apr,
            uint64 startDate,
            uint256 stakedAmount,
            uint256 claimedAmount,
            uint256 rewardAmount
        );

    /**
     * @dev Retrieves the number of staking schedules for a user.
     * @param _user The address of the user.
     * @return userStakingCount The number of staking schedules for the user.
     */
    function userStat(
        address _user
    ) external view returns (uint16 userStakingCount);

    function greeting() external view returns (string memory);
}
