// SPDX-License-Identifier: GPL-3.0
pragma solidity 0.8.6;
import {ReentrancyGuardUpgradeable} from "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import {UUPSUpgradeable} from "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import {IERC1155Receiver} from "@openzeppelin/contracts/token/ERC1155/IERC1155Receiver.sol";
import {IERC1155} from "@openzeppelin/contracts/interfaces/IERC1155.sol";
import {IERC165} from "@openzeppelin/contracts/interfaces/IERC165.sol";
import {LandRockerERC1155} from "./../../tokens/erc1155/LandRockerERC1155.sol";
import {IAccessRestriction} from "../../access/IAccessRestriction.sol";
import {IPlanetStake} from "./IPlanetStake.sol";
import {ILRT} from "./../../tokens/erc20/ILRT.sol";

// import "hardhat/console.sol";

/**
 * @title PlanetStake Contract
 * @dev A contract to manages staking and rewards for Planet tokens.
 */
contract PlanetStake is
    Initializable,
    UUPSUpgradeable,
    IERC1155Receiver,
    ReentrancyGuardUpgradeable,
    IPlanetStake
{
    LandRockerERC1155 public landRockerERC1155;
    IAccessRestriction public accessRestriction;
    ILRT public lrt;

    /**
     * @dev Mapping to store whiteList data for each tokenId
     */
    mapping(uint256 => Planet) public override planets;

    /**
     * @dev Mapping to store user planet staking data for each tokenId related to a specific token address
     * userAddress => tokenAddress => tokenId => tokenStakeHistory
     */
    mapping(address => mapping(uint256 => UserStake))
        public
        override userStakes;

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

    /**
     * @dev Reverts if address is invalid
     */
    modifier validAddress(address _addr) {
        require(_addr != address(0), "LRTVesting::Not valid address");
        _;
    }

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    /**
     * @dev Initializes the PlanetStake contract.
     * @param _landRockerERC1155 The address of the LandRockerERC1155 contract.
     * @param _accessRestriction The address of the access restriction contract.
     */
    function initializePlanetStake(
        address _landRockerERC1155,
        address _accessRestriction,
        address _lrt
    ) external override initializer {
        landRockerERC1155 = LandRockerERC1155(_landRockerERC1155);
        accessRestriction = IAccessRestriction(_accessRestriction);
        lrt = ILRT(_lrt);
    }

    /**
     * @dev Stakes a specific token.
     * @param _tokenId The Id of the token to stake.
     * @param _quantity The quantity of tokens staked.
     */
    function stake(
        uint256 _tokenId,
        uint256 _quantity
    ) external override nonReentrant {
        Planet memory planet = planets[_tokenId];
        require(
            planet.rewardAmount > 0,
            "PlanetStake::This token cannot be stake"
        );

        // Lock the specified token for staking
        _lockToken(_tokenId, _quantity);

        // Get the staking history for the user and token
        UserStake storage userStake = userStakes[msg.sender][_tokenId];

        // Update staking data
        userStake.tokenId = _tokenId;
        userStake.quantity += _quantity;
        userStake.staker = msg.sender;

        emit Staked(msg.sender, _tokenId, _quantity);
    }

    /**
     * @dev Makes the rewards claimable for a specific staker and token.
     * @param _staker The address of the staker.
     * @param _tokenId The ID of the token for which rewards are being made claimable.
     * Requirements:
     * - The staker address must be a valid address.
     * - The staker must have a non-zero balance for the specified token.
     * - The claimable amount must not exceed the staker's balance for the token.
     * Effects:
     * - Updates the claimable rewards for the staker and token.
     * Emits:
     * - ClaimableRewardsUpdated event indicating the update in claimable rewards for the staker and token.
     */
    function makeRewardsClaimable(
        address _staker,
        uint256 _tokenId
    ) external override onlyApprovedContract validAddress(_staker) {
        // Get the staking history for the user and token
        UserStake storage userStake = userStakes[_staker][_tokenId];

        require(
            userStake.quantity > 0,
            "PlanetStake::User has not enough balance"
        );
        require(
            userStake.claimable + 1 <= userStake.quantity,
            "PlanetStake::Claimable amount should not be more than user's quantity"
        );
        userStake.claimable++;
        emit ClaimableRewardsUpdated(_staker, _tokenId);
    }

    /**
     * @dev Claims rewards for a staked token.
     * @param _tokenId The Id of the staked token.
     */
    function claim(uint256 _tokenId) external override nonReentrant {
        // Get the staking history for the user and token
        UserStake storage userStake = userStakes[msg.sender][_tokenId];
        Planet memory planet = planets[_tokenId];

        require(
            userStake.staker == msg.sender,
            "PlanetStake::You are not staker"
        );

        require(
            userStake.claimable > 0,
            "PlanetStake::There is not token to claim"
        );

        // Decrement the quantity of staked tokens for the user
        userStake.quantity--;
        userStake.claimable--;
        userStake.claimedPlanets++;
        emit Claimed(msg.sender, _tokenId, planet.rewardAmount);

        require(
            lrt.balanceOf(address(this)) >= planet.rewardAmount,
            "PlanetStake::Contract has not enough balance"
        );

        require(
            lrt.transfer(msg.sender, planet.rewardAmount),
            "PlanetStake::Unsuccessful transfer"
        );

        // Burn the staked token
        landRockerERC1155.burn(address(this), _tokenId, 1);
    }

    /**
     * @dev Adds a token to the Planet's white list.
     * @param _tokenId The Id of the token to add.
     * @param _rewardAmount The amount of rewards could be claimed.
     */
    function addPlanet(
        uint256 _tokenId,
        uint256 _rewardAmount
    ) external override onlyAdmin {
        require(_rewardAmount > 0, "PlanetStake::Reward Amount is not valid");
        planets[_tokenId].rewardAmount = _rewardAmount;
        emit PlanetWhiteListAdded(_tokenId, _rewardAmount);
    }

    /**
     * @dev Handles the receipt of ERC1155 tokens when they are transferred to this contract.
     * @param operator The address which called `safeTransferFrom` function (i.e., the sender).
     * @param from The address which previously owned the token.
     * @param id The Id of the ERC1155 token being transferred.
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
    ) external pure override returns (bytes4) {
        return this.onERC1155Received.selector;
    }

    /**
     * @dev Handles the receipt of a batch of ERC1155 tokens when they are transferred to this contract.
     * @param operator The address which called `safeBatchTransferFrom` function (i.e., the sender).
     * @param from The address which previously owned the tokens.
     * @param ids An array of Ids for the ERC1155 tokens being transferred.
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
    ) external pure override returns (bytes4) {
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
     * @dev Authorizes a contract upgrade.
     * @param newImplementation The address of the new contract implementation.
     */
    function _authorizeUpgrade(
        address newImplementation
    ) internal override onlyOwner {}

    /**
     * @dev Locks a token for staking.
     * @param _tokenId The Id of the token to lock.
     * @param _quantity The quantity of tokens staked.
     */
    function _lockToken(uint256 _tokenId, uint256 _quantity) private {
        // Check if the specified token is whitelisted for staking

        // Check if the caller (msg.sender) has approved this contract to manage their tokens
        require(
            (landRockerERC1155.isApprovedForAll(msg.sender, address(this))),
            "PlanetStake::Stake has not access"
        );

        // Check if the caller has a sufficient balance of the specified token
        require(
            landRockerERC1155.balanceOf(msg.sender, _tokenId) >= _quantity,
            "PlanetStake::You do not have enough balance"
        );

        // Transfer _quantity units of the specified token from the caller to this contract
        landRockerERC1155.safeTransferFrom(
            msg.sender,
            address(this),
            _tokenId,
            _quantity,
            ""
        );
    }
}
