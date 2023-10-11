// SPDX-License-Identifier: GPL-3.0
pragma solidity 0.8.6;

import {StakeLib} from "./../StakeLib.sol";

/**
 * @title Planet Stake Interface
 * @dev This interface defines the methods and events for managing staking on the PlanetStake contract.
 */
interface IPlanetStake {
    //Struct Representing staking data for a specific token.
    struct PlanetStaking {
        StakeLib.Staking stakeData; // Staking data structure from StakeLib
        uint256 tokenId; // ID of the staked token
        uint256 quantity; // Quantity of tokens staked
    }

    /**
     * @dev Emitted when a user stakes tokens.
     * @param staker The address of the staker.
     * @param nftAddress The address of the NFT contract.
     * @param tokenId The ID of the staked token.
     * @param amount The amount of tokens staked.
     * @param stakingDate The date of the staking operation.
     */
    event Staked(
        address staker,
        address nftAddress,
        uint256 tokenId,
        uint256 amount,
        uint64 stakingDate
    );

    /**
     * @dev Emitted when a user claims rewards.
     * @param _staker The address of the staker.
     * @param _tokenAddress The address of the token being claimed.
     * @param _tokenId The ID of the staked token.
     * @param _rewardAmount The amount of rewards claimed.
     * @param lastClaimedDate The date of the last claimed rewards.
     */
    event Claimed(
        address _staker,
        address _tokenAddress,
        uint256 _tokenId,
        uint256 _rewardAmount,
        uint64 lastClaimedDate
    );

    /**
     * @dev Emitted when a token is added to the Planet's white list.
     * @param _tokenId The ID of the added token.
     */
    event PlanetWhiteListAdded(uint256 _tokenId);

    /**
     * @dev Emitted when the mining capacity of a planet is updated.
     * @param tokenId The ID of the planet token.
     * @param amount The updated mining capacity amount.
     */
    event PlanetMiningCapacityUpdated(uint256 tokenId, uint256 amount);

    /**
     * @dev Stakes a specific token.
     * @param _tokenId The ID of the token to stake.
     */
    function stake(uint256 _tokenId) external;

    /**
     * @dev Claims rewards for a staked token.
     * @param _tokenId The ID of the staked token.
     * @param _rewardAmount The amount of rewards to claim.
     * @param _staker The address of the staker.
     * @param _userMiningCount The count of mining performed by the user.
     */
    function claim(
        uint256 _tokenId,
        uint256 _rewardAmount,
        address _staker,
        uint256 _userMiningCount
    ) external;

    /**
     * @dev Sets the mining capacity of a planet.
     * @param _tokenId The ID of the planet token.
     * @param _amount The new mining capacity amount.
     */
    function setPlanetMiningCapacity(
        uint256 _tokenId,
        uint256 _amount
    ) external;

    /**
     * @dev Adds a token to the Planet's white list.
     * @param _tokenId The ID of the token to add.
     */
    function setPlanetWhiteList(uint256 _tokenId) external;

    /**
     * @dev Returns the mining capacity of a planet.
     * @param tokenId The ID of the planet token.
     * @return The mining capacity amount.
     */
    function planetMiningCapacity(
        uint256 tokenId
    ) external view returns (uint256);

    /**
     * @dev Returns staking data for a user's stake.
     * @param _user The user's address.
     * @param _collection The address of the NFT collection.
     * @param _tokenId The ID of the staked token.
     * @return stakeData The staking data.
     * @return tokenId The ID of the staked token.
     * @return quantity The quantity of tokens staked.
     */
    function userStakes(
        address _user,
        address _collection,
        uint256 _tokenId
    )
        external
        view
        returns (
            StakeLib.Staking memory stakeData,
            uint256 tokenId,
            uint256 quantity
        );

    /**
     * @dev Checks if a token is on the Planet's white list.
     * @param tokenId The ID of the token to check.
     * @return true if the token is on the white list, false otherwise.
     */
    function whiteList(uint256 tokenId) external view returns (bool);
}
