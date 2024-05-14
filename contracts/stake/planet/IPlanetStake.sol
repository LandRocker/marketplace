// SPDX-License-Identifier: GPL-3.0
pragma solidity 0.8.6;

/**
 * @title Planet Stake Interface
 * @dev This interface defines the methods and events for managing staking on the PlanetStake contract.
 */
interface IPlanetStake {
    //Struct Representing staking data for a specific token.
    struct UserStake {
        uint256 tokenId; // Id of the staked token
        uint256 quantity; // Quantity of tokens staked
        uint256 claimedPlanets; // Quantity of claimed planet
        uint256 claimable; // Amount that can be claimed
        address staker; // Address of the staker
    }

    //Struct Representing planet data for a specific token.
    struct Planet {
        uint256 rewardAmount; // Amount of reward for mining on the planet
        bool isWhiteListed; // Indicates whether the planet is in the whitelist
    }

    /**
     * @dev Emitted when a user stakes tokens.
     * @param staker The address of the staker.
     * @param tokenId The Id of the staked token.
     * @param quantity The amount of tokens staked.
     */
    event Staked(address staker, uint256 tokenId, uint256 quantity);

    /**
     * @dev Emitted when a user claims rewards.
     * @param staker The address of the staker.
     * @param tokenId The Id of the staked token.
     * @param rewardAmount The amount of rewards claimed.
     */
    event Claimed(address staker, uint256 tokenId, uint256 rewardAmount);

    /**
     * @dev Emitted when a user claims rewards.
     * @param staker The address of the staker.
     * @param tokenId The Id of the staked token.
     */
    event ClaimableRewardsUpdated(address staker, uint256 tokenId);

    /**
     * @dev Emitted when a token is added to the Planet's white list.
     * @param tokenId The Id of the added token.
     * @param rewardAmount The amount of rewards claimed.

     */
    event PlanetWhiteListAdded(uint256 tokenId, uint256 rewardAmount);

    /**
     * @dev Initializes the PlanetStake contract.
     * @param _landRockerERC1155 Address of the LandRockerERC1155 contract.
     * @param _accessRestriction The address of the AccessRestriction contract.
     * @param _lrt The address of the LRT contract.
     */
    function initializePlanetStake(
        address _landRockerERC1155,
        address _accessRestriction,
        address _lrt
    ) external;

    /**
     * @dev Stakes a specific token.
     * @param _tokenId The Id of the token to stake.
     * @param _quantity The quantity of tokens staked.
     */
    function stake(uint256 _tokenId, uint256 _quantity) external;

    /**
     * @dev Claims rewards for a staked token.
     * @param _tokenId The Id of the staked token.
     */
    function claim(uint256 _tokenId) external;

    /**
     * @dev Makes the rewards claimable for a specific staker and token.
     * @param _staker The address of the staker.
     * @param _tokenId The ID of the token for which rewards are being made claimable.
     */
    function makeRewardsClaimable(address _staker, uint256 _tokenId) external;

    /**
     * @dev Adds a token to the Planet's white list.
     * @param _tokenId The Id of the token to add.
     * @param _rewardAmount The amount of rewards could be claimed.
     */
    function addPlanet(uint256 _tokenId, uint256 _rewardAmount) external;

    /**
     * @dev Returns staking data for a user's stake.
     
     * @param _user The Id of the staked token.     
     * @param _tokenId The Id of the staked token. 
     * @return tokenId The Id of the staked token.
     * @return quantity The quantity of tokens staked.
     * @return claimedPlanets The quantity of claimed planet.
     * @return claimable
     * @return staker The user's address.
     */
    function userStakes(
        address _user,
        uint256 _tokenId
    )
        external
        view
        returns (
            uint256 tokenId,
            uint256 quantity,
            uint256 claimedPlanets,
            uint256 claimable,
            address staker
        );

    /**
     * @dev Retrieves information about a planet.
     * @param _tokenId The ID of the planet token.
     * @return rewardAmount The amount of rewards associated with the planet.
     * @return isActive A boolean indicating whether the planet is active or not.
     */
    function planets(
        uint256 _tokenId
    ) external view returns (uint256 rewardAmount, bool isActive);
}
