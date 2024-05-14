// SPDX-License-Identifier: GPL-3.0
pragma solidity 0.8.6;
import {ReentrancyGuardUpgradeable} from "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import {UUPSUpgradeable} from "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import {IAccessRestriction} from "../../../access/IAccessRestriction.sol";
import {ILRT} from "./../../../tokens/erc20/ILRT.sol";
import {ILandRockerERC1155} from "./../../../tokens/erc1155/ILandRockerERC1155.sol";
import {ILRTNFTStaking} from "./ILRTNFTStaking.sol";

// import "hardhat/console.sol";

/**
 * @title LRTNFTStaking Contract
 * @dev A contract to manages staking and rewards for LRTNFTStaking.
 */
contract LRTNFTStaking is
    Initializable,
    UUPSUpgradeable,
    ReentrancyGuardUpgradeable,
    ILRTNFTStaking
{
    // CATEGORY is a unique identifier for a specific category that represents the "NFTStaking" category label
    bytes32 public constant CATEGORY = keccak256("NFTStaking");
    // Defines the duration of the staking in terms of time
    uint64 public constant PERIOD = uint64(30 days);

    IAccessRestriction public accessRestriction;
    ILandRockerERC1155 public landRockerERC1155;
    ILRT public lrt;

    // Represents the stake capacity of the contract for all the users altogether.
    uint256 public stakeCapacity;
    // Represents the threshold value.
    uint256 public threshold;
    // Represents the total value locked (TVL) in the contract.
    uint256 public tvl;
    // Represents the duration limit.
    uint64 public durationLimit;

    // The address of the reward collection.
    address public rewardCollecion;

    // The count of rewards in the pool.
    uint256 public rewardCount;

    // Maps APRs (Annual Percentage Rates) to their respective indexes.
    mapping(uint8 => uint16) public override APRs;

    // Maps user addresses to their respective stakes.
    mapping(address => mapping(uint16 => UserStake)) public override userStakes;

    // Staking stats by user
    mapping(address => uint16) public override userStat;

    //Mapping from token ID to its corresponding RewardToken data.
    mapping(uint256 => RewardToken) public override rewardTokens;

    /**
     * @dev Reverts if the caller is not the owner.
     */
    modifier onlyOwner() {
        accessRestriction.ifOwner(msg.sender);
        _;
    }

    /**
     * @dev Modifier to restrict function access to admin users.
     */
    modifier onlyAdmin() {
        accessRestriction.ifAdmin(msg.sender);
        _;
    }
    /**
     * @dev Reverts if caller unauthorized
     */
    modifier onlyApprovedContract() {
        accessRestriction.ifApprovedContract(msg.sender);
        _;
    }

    /* @dev Reverts if duration is invalid
     */
    modifier onlyValidDuration(uint8 _duration) {
        require(
            _duration == 1 ||
                _duration == 3 ||
                _duration == 6 ||
                _duration == 9 ||
                _duration == 12,
            "LRTNFTStaking::Invalid duration"
        );
        _;
    }

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    /**
     * @dev Initializes the PlanetStake contract.
     * @param _accessRestriction The address of the access restriction contract.
     * @param _lrt The address of the LRT contract.
     */
    function initializeFuelStake(
        address _accessRestriction,
        address _lrt
    ) external override initializer {
        accessRestriction = IAccessRestriction(_accessRestriction);
        lrt = ILRT(_lrt);
    }

    /**
     * @dev Sets the APR (Annual Percentage Rate) for a specific duration.
     * @param _duration The duration for which the APR is being set.
     * @param _apr The APR value to be set.
     * Requirements:
     * - The duration must be valid.
     * - Only the admin can call this function.
     */
    function setAPRs(
        uint8 _duration,
        uint16 _apr
    ) external override onlyValidDuration(_duration) onlyAdmin {
        APRs[_duration] = _apr;
        emit UpdatedAPR(_duration, _apr);
    }

    /**
     * @dev Sets the maximum stake capacity allowed by the contract.
     * @param _stakeCapacity The maximum stake capacity.
     * - Only the admin can call this function.
     */
    function setStakeCapacity(
        uint256 _stakeCapacity
    ) external override onlyAdmin {
        require(_stakeCapacity > 0, "LRTNFTStaking::Stake capacity not set");
        stakeCapacity = _stakeCapacity;
        emit UpdatedStakeCapacity(_stakeCapacity);
    }

    /**
     * @dev Sets the threshold amount required for staking.
     * @param _threshold The threshold amount.
     * - Only the admin can call this function.
     */
    function setThreshold(uint256 _threshold) external override onlyAdmin {
        require(_threshold > 0, "LRTNFTStaking::Threshold not set");
        threshold = _threshold;
        emit UpdatedThreshold(_threshold);
    }

    /**
     * @dev Sets the duration limit for staking.
     * @param _durationLimit The duration limit in seconds.
     * - Only the admin can call this function.
     */
    function setdurationLimit(
        uint64 _durationLimit
    ) external override onlyAdmin {
        durationLimit = _durationLimit;
        emit UpdatedDurationLimit(_durationLimit);
    }

    /**
     * @dev Sets the address of the reward collection.
     * @param _rewardCollection The address of the reward collection contract.
     * - Only the admin can call this function.
     */
    function setRewardCollection(
        address _rewardCollection
    ) external override onlyAdmin {
        rewardCollecion = _rewardCollection;
        emit UpdatedRewardCollection(_rewardCollection);
    }

    /**
     * @dev Sets the price of a reward token.
     * @param _tokenId The ID of the reward token.
     * @param _tokenPrice The price assigned to the reward token.
     * @param _rewardLimit The maximum limit of reward tokens that can be distributed for the given token ID
     * - Only the admin can call this function.
     */
    function setRewardToken(
        uint256 _tokenId,
        uint256 _tokenPrice,
        uint256 _rewardLimit
    ) external override onlyAdmin {
        RewardToken storage rewardToken = rewardTokens[_tokenId];

        if (rewardToken.tokenPrice == 0) {
            rewardToken.rewarded = 0;
            rewardCount++;
        }

        rewardToken.tokenPrice = _tokenPrice;

        // Check if the rewardLimit is greater than already rewarded count tokenId
        require(
            _rewardLimit >= rewardToken.rewarded || _rewardLimit == 0,
            "LRTNFTStaking::Invalid reward limit"
        );

        rewardToken.rewardLimit = _rewardLimit;

        emit UpdatedRewardToken(_tokenId, _tokenPrice, _rewardLimit);
    }

    /**
     * @dev Allows users to stake tokens for a specified duration.
     * @param _amount The amount of tokens to stake.
     * @param _duration The duration for which the tokens will be staked.
     * Requirements: * - The duration must be valid.
     * - The amount must be greater than or equal to the threshold.
     * - The total value locked (TVL) plus the amount must not exceed the stake capacity.
     * - The current timestamp must be less than or equal to the duration limit.
     * - The contract must have sufficient allowance to transfer the tokens from the user.
     * - The transfer of tokens from the user to the contract must be successful.
     * Emits a {LRTNFTStaked} event.
     */
    function stake(
        uint256 _amount,
        uint8 _duration
    ) external override onlyValidDuration(_duration) {
        // Ensure that the amount to be staked is greter than the threshold
        require(
            _amount >= threshold,
            "LRTNFTStaking::Amount must be greater than the threshold"
        );
        // Ensure that staking does not exceed the capacity
        require(
            _amount + tvl <= stakeCapacity,
            "LRTNFTStaking::Stake exceed capacity"
        );
        // Ensure that staking doesn't exceed the duration limit
        require(
            uint64(block.timestamp) <= durationLimit,
            "LRTNFTStaking::Stake exceed duration limit"
        );

        // Ensure that the contract has allowance to transfer tokens from the user
        require(
            lrt.allowance(msg.sender, address(this)) >= _amount,
            "Marketplace::Allowance error"
        );

        lrt.transferFrom(msg.sender, address(this), _amount);

        UserStake memory userStake = UserStake(
            _duration,
            uint64(block.timestamp),
            _amount
        );

        uint16 currentIndex = userStat[msg.sender];

        // Adds a new staking schedule for the sender and updates their staking statistics.
        userStakes[msg.sender][currentIndex] = userStake;

        // Increment the user's staking statistics index
        userStat[msg.sender] += 1;

        // Increment the total value locked (TVL) by the specified _amount.
        tvl += _amount;

        // Calculate the reward NFT token based on the APR and taking duration
        (bool found, uint256 tokenId) = _claculateRewardToken(
            _amount,
            _duration
        );
        require(found == true, "LRTNFTStaking::TokenId not found");

        RewardToken storage rewardToken = rewardTokens[tokenId];
        // Check if the rewardLimit is greater than already rewarded count tokenId
        require(
            (rewardToken.rewardLimit > rewardToken.rewarded ||
                rewardToken.rewardLimit == 0),
            "LRTNFTStaking::There is no more tokenId to reward"
        );
        rewardToken.rewarded += 1;

        // ILandRockerERC1155(rewardCollecion).mint(
        //     msg.sender,
        //     tokenId,
        //     1,
        //     CATEGORY
        // );

        // Emit an event to indicate that tokens have been staked
        emit LRTNFTStaked(
            msg.sender,
            _amount,
            _duration,
            tokenId,
            currentIndex,
            APRs[_duration]
        );
    }

    /**
     * @dev Allows users to unstake their tokens that have reached their maturity date from a specific index in their stake list.
     * @param index The index of the stake to unstake.
     * Requirements:
     * - The user must have staked tokens.
     * - The staking period for the tokens must have ended.
     * - The staked tokens must be claimable.
     * - The transfer of tokens to the user must be successful.
     * Emits a {LRTNFTUnStaked} event.
     */
    function unstake(uint16 index) external override {
        UserStake storage userStake = userStakes[msg.sender][index];

        require(
            userStake.stakedAmount > 0,
            "LRTNFTStaking::You do not have any staking"
        );

        uint256 claimable = 0;

        uint64 cuurentTime = uint64(block.timestamp);
        uint64 endDate = userStake.startDate + (userStake.duration * PERIOD);

        require(
            cuurentTime >= endDate,
            "LRTNFTStaking::Staking period not yet finished"
        );

        if (cuurentTime >= endDate && userStake.stakedAmount > 0) {
            claimable = userStake.stakedAmount;
            userStake.stakedAmount = 0;
            tvl -= userStake.stakedAmount;
        }

        // Ensure that there are claimable tokens
        require(claimable > 0, "LRTNFTStaking::You do not have enough stake");

        require(
            lrt.balanceOf(address(this)) >= claimable,
            "LRTNFTStaking::Contract has not enough balance"
        );

        require(
            lrt.transfer(msg.sender, claimable),
            "LRTNFTStaking::Unsuccessful transfer"
        );

        // Emit an event to indicate that tokens have been unstaked
        emit LRTNFTUnStaked(msg.sender, index, claimable);
    }

    /**
     * @dev Internal function to calculate the reward token based on staked amount and duration
     * @param _amount The amount of tokens that the user has staked
     * @param _duration The duration for which the tokens are staked
     * @return Returns the tokenId corresponding to the calculated reward
     * @return Returns true if found the tokenId
     */
    function _claculateRewardToken(
        uint256 _amount,
        uint8 _duration
    ) private view returns (bool, uint256) {
        // Calculate reward amount based on the provided formula
        uint256 rewardAmount = (_amount * APRs[_duration] * _duration) / 120000;

        // Initialize tokenId to a default value that indicates no appropriate token was found
        uint256 tokenId = 0; // Assuming 0 is a default "no reward" tokenId
        bool found = false; // When not found token
        uint256 closestMatch = type(uint256).max; // Largest possible uint256 value

        // Iterate over the token IDs to find the closest match
        for (uint256 id = 1; id <= rewardCount; id++) {
            RewardToken storage rewardToken = rewardTokens[id];
            uint256 tokenPrice = rewardToken.tokenPrice;
            if (tokenPrice >= rewardAmount && tokenPrice < closestMatch) {
                if (
                    rewardToken.rewardLimit < rewardToken.rewarded ||
                    rewardToken.rewardLimit == 0
                ) {
                    closestMatch = tokenPrice;
                    found = true;
                    tokenId = id;
                }
            }
        }

        // Return the most appropriate tokenId
        return (found, tokenId);
    }

    /**
     * @dev Authorizes a contract upgrade.
     * @param newImplementation The address of the new contract implementation.
     */
    function _authorizeUpgrade(
        address newImplementation
    ) internal override onlyOwner {}
}
