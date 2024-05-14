// SPDX-License-Identifier: GPL-3.0
pragma solidity 0.8.6;

/**
 * @title IGame
 * @dev Interface for a game or mining contract
 */
interface IGame {
    /**
     * @dev Struct representing a miner
     */
    struct Miner {
        uint256 tokenId; // The ID of the NFT1155 planet
        uint256 minedBlocks; // Number of blocks mined by the miner
        uint256 unMinedBlocks; // Number of blocks remaining to be mined by the miner
        bool isWinner; // Indicates whether the miner is a winner
        bool miningPermission; // Indicates whether the miner has permission to mine
    }

    /**
     * @dev Struct representing a planet
     */
    struct Planet {
        uint256 tokenId; // The ID of the NFT1155 planet
        uint256 totalBlocks; // Total number of blocks in the planet
        uint256 userBlockLimit; // Maximum number of blocks a user can mine on the planet
        uint256 planetCapacity; // Maximum mining capacity of the planet
        uint256 rewardCountLimit; // Maximum reward count of the planet
        uint256 userMiningCount; // Current mining activity count by users on the planet
        uint256 rewardCount; // Current reward count of the planet
        uint256 rewardAmount; // Amount of reward for mining on the planet
        address rewardType; // Address of the reward type
        address staker; // Address of the staker for the planet
    }

    /**
     * @dev Event for when the contract receives funds
     * @param from The address from which the funds were received
     * @param amount The amount of funds received
     */
    event Received(address from, uint256 amount);

    /**
     * @dev Event for when a miner wins
     * @param miner The address of the miner who won
     * @param planetId The ID of the planet where the win occurred
     * @param tokenId The ID of the NFT1155 planet
     * @param mission The mission ID of the win
     * @param winIndex The index of the win
     * @param rewardAmount The amount of the reward
     */
    event MinerWon(
        address miner,
        uint256 planetId,
        uint256 tokenId,
        uint256 mission,
        uint256 winIndex,
        uint256 rewardAmount
    );

    /**
     * @dev Event for when a miner loses
     * @param miner The address of the miner who lost
     * @param planetId The ID of the planet where the loss occurred
     * @param tokenId The ID of the NFT1155 planet
     * @param mission The mission ID of the loss
     */
    event MinerLose(
        address miner,
        uint256 planetId,
        uint256 tokenId,
        uint256 mission
    );

    /**
     * @dev Event for when a mining mission finished
     * @param miner The address of the miner who won
     * @param planetId The ID of the planet where the win occurred
     * @param tokenId The ID of the NFT1155 planet
     * @param mission The mission ID of the win
     * @param minedBlocks The number of blocks mined
     * @param usedFuel The amount of fuel used for mining
     * @param timeSpent The time spent on mining
     * @param nullifier The nullifier for the mining activity
     */
    event MiningFinished(
        address miner,
        uint256 planetId,
        uint256 tokenId,
        uint256 mission,
        uint256 minedBlocks,
        uint256 usedFuel,
        uint256 timeSpent,
        bytes32 nullifier
    );

    /**
     * @dev Event for when the mining permission set for a miner on a specific planet
     * @param miner The address of the miner
     * @param planetId The ID of the planet
     * @param mission The mission ID
     * @param minerUnminedBlocks number of blocks remaining to be mined by the miner
     * @param miningPermission Boolean indicating whether the miner permitted to mine
     */
    event MiningPermissionUpdated(
        address miner,
        uint256 planetId,
        uint256 mission,
        uint256 minerUnminedBlocks,
        bool miningPermission
    );

    /**
     * @dev Event for when the planet capacity reached for a miner on a specific planet and mining permission set to false
     * @param miner The address of the miner
     * @param planetId The ID of the planet
     * @param mission The mission ID
     * @param miningPermission Boolean indicating whether the miner permitted to mine
     */
    event PlanetCapacityReached(
        address miner,
        uint256 planetId,
        uint256 mission,
        bool miningPermission
    );

    /**
     * @dev Event for when the planet reward count limit reached for a miner on a specific planet and mining permission set to false
     * @param miner The address of the miner
     * @param planetId The ID of the planet
     * @param mission The mission ID
     * @param miningPermission Boolean indicating whether the miner permitted to mine
     */
    event PlanetRewardCountLimitReached(
        address miner,
        uint256 planetId,
        uint256 mission,
        bool miningPermission
    );

    /**
     * @dev Event for when the miner mining limit reached for a miner on a specific planet and mining permission set to false
     * @param miner The address of the miner
     * @param planetId The ID of the planet
     * @param mission The mission ID
     * @param miningPermission Boolean indicating whether the miner permitted to mine
     */
    event MinerMiningLimitReached(
        address miner,
        uint256 planetId,
        uint256 mission,
        bool miningPermission
    );

    /**
     * @dev Event for when a planet added to the game
     * @param planetId The ID of the planet
     * @param tokenId The ID of the NFT1155 planet
     * @param totalBlocks The total number of blocks in the planet
     * @param userBlockLimit The maximum number of blocks a user can mine on the planet
     * @param planetCapacity The maximum mining capacity of the planet
     * @param rewardCountLimit The maximum reward count of the planet
     * @param rewardAmount The amount of reward for mining on the planet
     * @param rewardType The address of the reward type
     * @param staker The address of the staker for the planet
     */
    event PlanetAddedToGame(
        uint256 planetId,
        uint256 tokenId,
        uint256 totalBlocks,
        uint256 userBlockLimit,
        uint256 planetCapacity,
        uint256 rewardCountLimit,
        uint256 rewardAmount,
        address rewardType,
        address staker
    );

    /**
     * @dev Function to initialize the game
     * @param _accessRestriction The address of the access restriction
     * @param _planetStake The address of the planet stake
     */
    function initializeGame(
        address _accessRestriction,
        address _planetStake
    ) external;

    /**
     * @dev Function to set mining permission
     * @param _miner The address of the miner
     * @param _planetId The ID of the planet
     * @param _mission The mission ID
     * @param _miningPermission Boolean indicating whether the miner permitted to mine
     */
    function setMiningPermission(
        address _miner,
        uint256 _planetId,
        uint256 _mission,
        bool _miningPermission
    ) external;

    /**
     * @dev Function to add a planet to the game
     * @param _tokenId The ID of the NFT1155 planet
     * @param _totalBlocks The total number of blocks in the planet
     * @param _userBlockLimit The maximum number of blocks a user can mine on the planet
     * @param _planetCapacity The maximum mining capacity of the planet
     * @param _rewardCountLimit The maximum reward count of the planet
     * @param _rewardAmount The amount of reward for mining on the planet
     * @param _rewardType The address of the reward type
     * @param _staker The address of the staker for the planet
     */
    function addPlanet(
        uint256 _tokenId,
        uint256 _totalBlocks,
        uint256 _userBlockLimit,
        uint256 _planetCapacity,
        uint256 _rewardCountLimit,
        uint256 _rewardAmount,
        address _rewardType,
        address _staker
    ) external;

    /**
     * @dev Function for a miner to mine on a planet
     * @param _planetId The ID of the planet
     * @param _minedBlocks The number of blocks mined
     * @param _usedFuel The amount of fuel used for mining
     * @param _timeSpent The time spent on mining
     * @param _mission The mission ID
     * @param _miner The address of the miner
     * @param _nullifier The nullifier for the mining activity
     */
    function mine(
        uint256 _planetId,
        uint256 _minedBlocks,
        uint256 _usedFuel,
        uint256 _timeSpent,
        uint256 _mission,
        address _miner,
        bytes32 _nullifier
    ) external;

    /**
     * @dev Getter for information about a miner
     * @param _miner The address of the miner
     * @param _planetId The ID of the planet
     * @param _mission The mission ID
     * @return tokenId The ID of the NFT1155 planet
     * @return minedBlocks The number of blocks mined by the miner
     * @return unMinedBlocks The number of blocks remaining to be mined by the miner
     * @return isWinner Boolean indicating whether the miner is a winner
     * @return miningPermission Boolean indicating whether the miner has permission to mine
     */
    function miners(
        address _miner,
        uint256 _planetId,
        uint256 _mission
    )
        external
        view
        returns (
            uint256 tokenId,
            uint256 minedBlocks,
            uint256 unMinedBlocks,
            bool isWinner,
            bool miningPermission
        );

    /**
     * @dev Getter for information about a planet
     * @param _planetId The ID of the planet
     * @return tokenId The ID of the NFT1155 planet
     * @return totalBlocks Total number of blocks in the planet
     * @return userBlockLimit Maximum number of blocks a user can mine on the planet
     * @return planetCapacity Maximum mining capacity of the planet
     * @return rewardCountLimit The maximum reward count of the planet
     * @return userMiningCount Current mining activity count by users on the planet
     * @return rewardCount Current reward count of the planet
     * @return rewardAmount Amount of reward for mining on the planet
     * @return rewardType Address of the reward type
     * @return staker Address of the staker for the planet
     */
    function planets(
        uint256 _planetId
    )
        external
        view
        returns (
            uint256 tokenId,
            uint256 totalBlocks,
            uint256 userBlockLimit,
            uint256 planetCapacity,
            uint256 rewardCountLimit,
            uint256 userMiningCount,
            uint256 rewardCount,
            uint256 rewardAmount,
            address rewardType,
            address staker
        );
}
