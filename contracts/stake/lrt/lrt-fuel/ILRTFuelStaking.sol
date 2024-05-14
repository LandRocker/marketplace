// SPDX-License-Identifier: GPL-3.0
pragma solidity 0.8.6;

/**
 * @title Fuel Stake Interface
 * @dev This interface defines the methods and events for managing staking on the FuelStake contract.
 */
interface ILRTFuelStaking {
    //Struct Representing staking data for a specific token.
    struct UserStake {
        uint64 startTime;
        uint8 duration;
        uint256 stakedAmount;
        uint256 fuelReward;
    }

    /**
     * @dev Emitted when a user stakes tokens.
     * @param staker The address of the staker.
     * @param duration The Id of the staked token.
     * @param amount The amount of tokens staked.
     * @param fuelReward The amount of tokens staked
     */

    event LRTFuelStaked(
        address indexed staker,
        uint256 amount,
        uint8 duration,
        uint256 fuelReward
    );
    /**
     * @dev Emitted when a user unstakes tokens.
     * @param staker The address of the staker.
     * @param amount The amount of tokens staked.
     */
    event LRTFuelUnStaked(address indexed staker, uint256 amount);

    /**
     * @dev Initializes the PlanetStake contract.
     * @param _accessRestriction The address of the AccessRestriction contract.
     * @param _lrt The address of the LRT contract.
     */
    function initializeFuelStake(
        address _accessRestriction,
        address _lrt
    ) external;

    /**
     * @dev Stakes a specific token.
     * @param amount The Id of the token to stake.
     * @param duration The quantity of tokens staked.
     */
    function stake(uint256 amount, uint8 duration) external;

    function unstake() external;

    function setAPY(uint256 _apy) external;
    function setFuelPrice(uint256 _fuelPrice) external;
    function setAmountThresholds(uint256[] calldata thresholds) external;
    function setDiscountRates(
        uint8 duration,
        uint256[] calldata rates
    ) external;

    /**
     * @dev Returns staking data for a user's stake.
     
     * @param _user The Id of the staked token.     
     * @param _index The Id of the staked token. 
     * @return startTime The Id of the staked token.
     * @return duration The quantity of tokens staked.
     * @return stakedAmount The quantity of claimed planet.
     * @return fuelReward
     */
    function userStakes(
        address _user,
        uint256 _index
    )
        external
        view
        returns (
            uint64 startTime,
            uint8 duration,
            uint256 stakedAmount,
            uint256 fuelReward
        );
}
