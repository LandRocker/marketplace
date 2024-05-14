// SPDX-License-Identifier: GPL-3.0
pragma solidity 0.8.6;

import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import {UUPSUpgradeable} from "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import {CountersUpgradeable} from "@openzeppelin/contracts-upgradeable/utils/CountersUpgradeable.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {IAccessRestriction} from "./../access/IAccessRestriction.sol";
import {IPlanetStake} from "./../stake/planet/IPlanetStake.sol";
import {IGame} from "./IGame.sol";

// import "hardhat/console.sol";

contract Game is Initializable, UUPSUpgradeable, IGame {
    // Use counters library for incrementing sell Ids
    using CountersUpgradeable for CountersUpgradeable.Counter;

    IAccessRestriction public accessRestriction;
    IPlanetStake public planetStake;

    /**
     * @dev Mapping to store miner data for each planetId related to a specific mission
     * minerAddress => planetId => mission => Miner data
     */
    mapping(address => mapping(uint256 => mapping(uint256 => Miner)))
        public
        override miners;

    /**
     * @dev Mapping to planet properties for each planet
     */
    mapping(uint256 => Planet) public override planets;

    // Counter for planet Ids
    CountersUpgradeable.Counter private _planetIdCounter;

    /**
     * @dev Modifier to restrict access to the owner.
     */
    modifier onlyOwner() {
        accessRestriction.ifOwner(msg.sender);
        _;
    }

    /**
     * @dev Modifier to check if an address is valid.
     * @param _address The address to check.
     */
    modifier validAddress(address _address) {
        require(_address != address(0), "Game::Not valid address");
        _;
    }

    /**
     * @dev Modifier: Only accessible by authorized scripts
     */
    modifier onlyScript() {
        accessRestriction.ifScript(msg.sender);
        _;
    }

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    /**
     * @dev Receive function to accept incoming token
     */
    receive() external payable {
        emit Received(msg.sender, msg.value);
    }

    /**
     * @dev Function to initialize the game
     * @param _accessRestriction The address of the access restriction
     * @param _planetStake The address of the planet stake
     */
    function initializeGame(
        address _accessRestriction,
        address _planetStake
    ) external override initializer {
        __UUPSUpgradeable_init();
        accessRestriction = IAccessRestriction(_accessRestriction);
        planetStake = IPlanetStake(_planetStake);
    }

    /**
     * @dev Function to set the mining permission
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
    ) external override validAddress(_miner) onlyScript {
        Planet memory planet = planets[_planetId];
        require(planet.totalBlocks > 0, "Game::Planet is not exist");

        require(
            planet.userMiningCount < planet.planetCapacity,
            "Game::The planet has burnt"
        );

        require(
            planet.rewardCount < planet.rewardCountLimit,
            "Game::The planet has burnt"
        );

        Miner storage miner = miners[_miner][_planetId][_mission];
        require(
            miner.minedBlocks < planet.userBlockLimit,
            "Game::Miner has reached to maximum limit"
        );

        miner.miningPermission = _miningPermission;
        miner.unMinedBlocks = planet.totalBlocks;

        emit MiningPermissionUpdated(
            _miner,
            _planetId,
            _mission,
            miner.unMinedBlocks,
            _miningPermission
        );
    }

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
    )
        external
        override
        onlyScript
        validAddress(_rewardType)
        validAddress(_staker)
    {
        require(
            _totalBlocks > 0 &&
                _userBlockLimit > 0 &&
                _planetCapacity > 0 &&
                _rewardCountLimit > 0,
            "Game::Invalid planet data"
        );

        require(
            _totalBlocks >= _userBlockLimit,
            "Game::Total blocks should be more than user blocks limit"
        );
        _checkStakedPlanetBalance(_staker, _tokenId);

        Planet memory planet = Planet(
            _tokenId,
            _totalBlocks,
            _userBlockLimit,
            _planetCapacity,
            _rewardCountLimit,
            0,
            0,
            _rewardAmount,
            _rewardType,
            _staker
        );

        planets[_planetIdCounter.current()] = planet;

        emit PlanetAddedToGame(
            _planetIdCounter.current(),
            _tokenId,
            _totalBlocks,
            _userBlockLimit,
            _planetCapacity,
            _rewardCountLimit,
            _rewardAmount,
            _rewardType,
            _staker
        );

        _planetIdCounter.increment();
    }

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
    ) external override onlyScript {
        Planet storage planet = planets[_planetId];
        Miner storage miner = miners[_miner][_planetId][_mission];

        require(planet.totalBlocks > 0, "Game::Planet is not exist");

        require(
            IERC20(planet.rewardType).balanceOf(address(this)) >
                planet.rewardAmount,
            "Game::Insufficient contract balance"
        );

        _checkStakedPlanetBalance(planet.staker, planet.tokenId);

        require(
            _minedBlocks + miner.minedBlocks <= planet.userBlockLimit,
            "Game::Miner has reached to maximum limit"
        );
        require(miner.miningPermission, "Game::Miner has not allow to mine");
        require(!miner.isWinner, "Game::Miner already won once");

        require(
            planet.userMiningCount + 1 <= planet.planetCapacity,
            "Game::The planet has burnt"
        );

        require(
            planet.rewardCount + 1 <= planet.rewardCountLimit,
            "Game::The planet has burnt"
        );

        uint256 winIndex = _generatorRandomIndex(
            _planetId,
            planet.tokenId,
            _minedBlocks,
            miner.unMinedBlocks,
            _usedFuel,
            _timeSpent,
            _mission,
            _miner,
            _nullifier
        );

        if (winIndex < _minedBlocks) {
            planet.rewardCount += 1;
            miner.isWinner = true;
            miner.miningPermission = false;
            emit MinerWon(
                _miner,
                _planetId,
                planet.tokenId,
                _mission,
                winIndex,
                planet.rewardAmount
            );
            require(
                IERC20(planet.rewardType).transfer(_miner, planet.rewardAmount),
                "Game::Unsuccessful transfer"
            );
        } else {
            emit MinerLose(_miner, _planetId, planet.tokenId, _mission);
        }

        miner.unMinedBlocks -= _minedBlocks;
        miner.minedBlocks += _minedBlocks;
        planet.userMiningCount += 1;

        if (planet.userMiningCount == planet.planetCapacity) {
            miner.miningPermission = false;
            emit PlanetCapacityReached(_miner, _planetId, _mission, false);

            planetStake.makeRewardsClaimable(planet.staker, planet.tokenId);
        }
        if (miner.minedBlocks == planet.userBlockLimit) {
            miner.miningPermission = false;
            emit MinerMiningLimitReached(_miner, _planetId, _mission, false);
        }

        emit MiningFinished(
            _miner,
            _planetId,
            planet.tokenId,
            _mission,
            _minedBlocks,
            _usedFuel,
            _timeSpent,
            _nullifier
        );
    }

    /**
     * @dev Authorizes a contract upgrade.
     * @param newImplementation The address of the new contract implementation.
     */
    function _authorizeUpgrade(
        address newImplementation
    ) internal override onlyOwner {}

    /**
     * @dev Function to generate a randome index for a specific miner in the current mission to reveal the winner
     * @param _planetId The ID of the planet
     * @param _tokenId The ID of the NFT1155 planet
     * @param _minedBlocks The number of blocks mined
     * @param _unMinedBlocks The number of blocks not mined yet
     * @param _usedFuel The amount of fuel used for mining
     * @param _timeSpent The time spent on mining
     * @param _mission The mission ID
     * @param _miner The address of the miner
     * @param _nullifier The nullifier for the mining activity
     */
    function _generatorRandomIndex(
        uint256 _planetId,
        uint256 _tokenId,
        uint256 _minedBlocks,
        uint256 _unMinedBlocks,
        uint256 _usedFuel,
        uint256 _timeSpent,
        uint256 _mission,
        address _miner,
        bytes32 _nullifier
    ) private view returns (uint256 winIndex) {
        uint256 randomIndex = uint256(
            keccak256(
                abi.encodePacked(
                    block.difficulty,
                    block.number,
                    _planetId,
                    _tokenId,
                    _minedBlocks,
                    _usedFuel,
                    _timeSpent,
                    _mission,
                    _miner,
                    _nullifier
                )
            )
        );

        winIndex = randomIndex % _unMinedBlocks;
        return winIndex;
    }

    function _checkStakedPlanetBalance(
        address _staker,
        uint256 _tokenId
    ) private view {
        (, uint256 _quantity, , uint256 _claimable, ) = planetStake.userStakes(
            _staker,
            _tokenId
        );

        require(
            (_quantity - _claimable) > 0,
            "Game::Insufficient staked planet balance"
        );
    }
}
