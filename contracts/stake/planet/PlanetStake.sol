// SPDX-License-Identifier: MIT
pragma solidity 0.8.6;

import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import {IERC1155Receiver} from "@openzeppelin/contracts/token/ERC1155/IERC1155Receiver.sol";
import {IERC1155} from "@openzeppelin/contracts/interfaces/IERC1155.sol";
import {IERC165} from "@openzeppelin/contracts/interfaces/IERC165.sol";
import {LandRockerERC1155} from "./../../tokens/erc1155/LandRockerERC1155.sol";
import {IAccessRestriction} from "../../access/IAccessRestriction.sol";
import {Stake} from "./../Stake.sol";
import {IPlanetStake} from "./IPlanetStake.sol";

// import "hardhat/console.sol";

/**
 * @title PlanetStake Contract
 * @dev A contract to manages staking and rewards for Planet tokens.
 */
contract PlanetStake is IERC1155Receiver, Stake, IPlanetStake {
    LandRockerERC1155 public landRockerERC1155;
    /**
     * @dev Mapping to store planet mining capacity data for each tokenId
     */
    mapping(uint256 => uint256) public override planetMiningCapacity;
    /**
     * @dev Mapping to store whiteList data for each tokenId
     */
    mapping(uint256 => bool) public override whiteList;

    /**
     * @dev Mapping to store user planet staking data for each tokenId related to a specific token address
     * userAddress => tokenAddress => tokenId => tokenStakeHistory
     */
    mapping(address => mapping(address => mapping(uint256 => PlanetStaking)))
        public
        override userStakes;

    string public greeting;

    /**
     * @dev Initializes the PlanetStake contract.
     * @param _landRockerERC1155 The address of the LandRockerERC1155 contract.
     * @param _accessRestriction The address of the access restriction contract.
     * @param _lrtDistributor The address of the LRT distributor contract.
     */
    function __PlanetStake_init(
        address _landRockerERC1155,
        address _accessRestriction,
        address _lrtDistributor
    ) public initializer {
        Stake.initialize(_accessRestriction, _lrtDistributor);
        landRockerERC1155 = LandRockerERC1155(_landRockerERC1155);
        greeting = "Hello, upgradeable world!";
    }

    /**
     * @dev Stakes a specific token.
     * @param _tokenId The ID of the token to stake.
     */
    function stake(uint256 _tokenId) external override {
        // Lock the specified token for staking
        _lockToken(_tokenId);

        // Get the staking history for the user and token
        PlanetStaking storage stakingHistory = userStakes[msg.sender][
            address(landRockerERC1155)
        ][_tokenId];

        // Update staking data
        stakingHistory.stakeData.stakingDate = uint64(block.timestamp);
        stakingHistory.tokenId = _tokenId;
        stakingHistory.quantity += 1;
        stakingHistory.stakeData.collection = address(landRockerERC1155);

        emit Staked(
            msg.sender,
            address(landRockerERC1155),
            stakingHistory.tokenId,
            stakingHistory.quantity,
            stakingHistory.stakeData.stakingDate
        );
    }

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
    ) external override onlyScript {
        // Check if the user's mining count matches the planet's mining capacity
        require(
            _userMiningCount == planetMiningCapacity[_tokenId],
            "PlanetStake::Cannot be claimed"
        );

        // Get the staking history for the user and token
        PlanetStaking storage stakingHistory = userStakes[_staker][
            address(landRockerERC1155)
        ][_tokenId];

        // Ensure that there is at least one token staked by the user
        require(
            stakingHistory.quantity >= 1,
            "PlanetStake::There is not token to claim"
        );

        // Decrement the quantity of staked tokens for the user
        stakingHistory.quantity--;
        // Update the last claimed date for the staked token
        stakingHistory.stakeData.lastClaimedDate = uint64(block.timestamp);
        emit Claimed(
            _staker,
            address(landRockerERC1155),
            _tokenId,
            _rewardAmount,
            stakingHistory.stakeData.lastClaimedDate
        );

        // Burn the staked token
        landRockerERC1155.burn(address(this), _tokenId, 1);

        // Distribute rewards to the staker using the LRT distributor
        bool success = _lrtDistributor.distribute(
            bytes32("Game"),
            _rewardAmount,
            _staker
        );
        // Ensure the reward distribution was successful
        require(success, "PlanetStake::Fail transfer in staking claim");
    }

    /**
     * @dev Sets the mining capacity of a planet.
     * @param _tokenId The ID of the planet token.
     * @param _amount The new mining capacity amount.
     */
    function setPlanetMiningCapacity(
        uint256 _tokenId,
        uint256 _amount
    ) external override onlyAdmin {
        // Ensure that the specified mining capacity amount is greater than zero
        require(_amount > 0, "PlanetStake::Insufficient amount, equal to zero");

        // Set the mining capacity for the specified planet token
        planetMiningCapacity[_tokenId] = _amount;
        emit PlanetMiningCapacityUpdated(_tokenId, _amount);
    }

    /**
     * @dev Adds a token to the Planet's white list.
     * @param _tokenId The ID of the token to add.
     */
    function setPlanetWhiteList(uint256 _tokenId) external override onlyAdmin {
        whiteList[_tokenId] = true;
        emit PlanetWhiteListAdded(_tokenId);
    }

    /**
     * @dev Handles the receipt of ERC1155 tokens when they are transferred to this contract.
     * @param operator The address which called `safeTransferFrom` function (i.e., the sender).
     * @param from The address which previously owned the token.
     * @param id The ID of the ERC1155 token being transferred.
     * @param value The amount of tokens being transferred.
     * @param data Additional data with no specified format.
     * @return A bytes4 magic value, indicating ERC1155Receiver compatibility.
     *  See {IERC1155-onERC1155Received}.
     */
    function onERC1155Received(
        address operator,
        address from,
        uint256 id,
        uint256 value,
        bytes calldata data
    ) external override returns (bytes4) {
        return this.onERC1155Received.selector;
    }

    /**
     * @dev Handles the receipt of a batch of ERC1155 tokens when they are transferred to this contract.
     * @param operator The address which called `safeBatchTransferFrom` function (i.e., the sender).
     * @param from The address which previously owned the tokens.
     * @param ids An array of IDs for the ERC1155 tokens being transferred.
     * @param values An array of amounts corresponding to the tokens being transferred.
     * @param data Additional data with no specified format.
     * @return A bytes4 magic value, indicating ERC1155Receiver compatibility (0xbc197c81).
     *  See {IERC1155-onERC1155BatchReceived}.
     */
    function onERC1155BatchReceived(
        address operator,
        address from,
        uint256[] calldata ids,
        uint256[] calldata values,
        bytes calldata data
    ) external override returns (bytes4) {
        return this.onERC1155BatchReceived.selector;
    }

    /**
     * @dev See {IERC165-supportsInterface}.
     */
    function supportsInterface(
        bytes4 interfaceId
    ) public view virtual override returns (bool) {
        return
            interfaceId == type(IERC1155Receiver).interfaceId ||
            interfaceId == type(IERC165).interfaceId;
    }

    /**
     * @dev Locks a token for staking.
     * @param _tokenId The ID of the token to lock.
     */
    function _lockToken(uint256 _tokenId) private {
        // Check if the specified token is whitelisted for staking
        require(whiteList[_tokenId], "PlanetStake::This token cannot be stake");

        // Check if the caller (msg.sender) has approved this contract to manage their tokens
        require(
            (landRockerERC1155.isApprovedForAll(msg.sender, address(this))),
            "PlanetStake::Stake has not access"
        );

        // Check if the caller has a sufficient balance of the specified token
        require(
            landRockerERC1155.balanceOf(msg.sender, _tokenId) >= 1,
            "PlanetStake::You do not have enough balance"
        );

        // Transfer 1 unit of the specified token from the caller to this contract
        landRockerERC1155.safeTransferFrom(
            msg.sender,
            address(this),
            _tokenId,
            1,
            ""
        );
    }
}
