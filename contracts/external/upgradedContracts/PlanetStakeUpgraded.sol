// SPDX-License-Identifier: MIT
pragma solidity 0.8.6;

import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import {IERC1155Receiver} from "@openzeppelin/contracts/token/ERC1155/IERC1155Receiver.sol";
import {IERC1155} from "@openzeppelin/contracts/interfaces/IERC1155.sol";
import {IERC165} from "@openzeppelin/contracts/interfaces/IERC165.sol";
import {LandRockerERC1155} from "./../../tokens/erc1155/LandRockerERC1155.sol";
import {IAccessRestriction} from "../../access/IAccessRestriction.sol";
import {ILRTDistributor} from "./../../tokens/erc20/lrtDistributor/ILRTDistributor.sol";
import {Stake} from "./../../stake/Stake.sol";
import {IPlanetStake} from "./../../stake/planet/IPlanetStake.sol";
import {IAccessRestriction} from "./../../access/IAccessRestriction.sol";

// import "hardhat/console.sol";

contract PlanetStakeUpgraded is IERC1155Receiver, Stake, IPlanetStake {
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
     */
    mapping(address => mapping(address => mapping(uint256 => PlanetStaking)))
        public
        override userStakes; // userAddress => tokenAddress => tokenId => tokenStakeHistory

string public greeting;
IAccessRestriction public accessRestriction;
     ILRTDistributor public lrtDistributor;

    function __PlanetStakeUpgraded_init(
        address _landRockerERC1155,
        address _accessRestriction,
        address _lrtDistributor
    ) public reinitializer(2) {
        accessRestriction = IAccessRestriction(_accessRestriction);
        lrtDistributor = ILRTDistributor(_lrtDistributor);
        //Stake.initialize(_accessRestriction, _lrtDistributor);
        landRockerERC1155 = LandRockerERC1155(_landRockerERC1155);
    }

    function greetingNew() public pure returns (string memory) {
        return "New Upgradeable World!";
    }

    function stake(uint256 _tokenId) external override {
        _lockToken(_tokenId);
        PlanetStaking storage stakingHistory = userStakes[msg.sender][
            address(landRockerERC1155)
        ][_tokenId];
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

    function claim(
        uint256 _tokenId,
        uint256 _rewardAmount,
        address _staker,
        uint256 _userMiningCount
    ) external override onlyScript {
        require(
            _userMiningCount == planetMiningCapacity[_tokenId],
            "PlanetStake::Cannot be claimed"
        );
        PlanetStaking storage stakingHistory = userStakes[_staker][
            address(landRockerERC1155)
        ][_tokenId];

        require(
            stakingHistory.quantity >= 1,
            "PlanetStake::There isn't token to claim"
        );

        stakingHistory.quantity--;
        stakingHistory.stakeData.lastClaimedDate = uint64(block.timestamp);
        emit Claimed(
            _staker,
            address(landRockerERC1155),
            _tokenId,
            _rewardAmount,
            stakingHistory.stakeData.lastClaimedDate
        );

        landRockerERC1155.burn(address(this), _tokenId, 1);
        bool success = _lrtDistributor.distribute(
            bytes32("Game"),
            _rewardAmount,
            _staker
        );
        require(success, "PlanetStake::Fail transfer in staking claim");
    }

    function setPlanetMiningCapacity(
        uint256 _tokenId,
        uint256 _amount
    ) external override onlyAdmin {
        require(_amount > 0, "PlanetStake::Insufficient amount, equal to zero");
        planetMiningCapacity[_tokenId] = _amount;
        emit PlanetMiningCapacityUpdated(_tokenId, _amount);
    }

    function setPlanetWhiteList(uint256 _tokenId) external override onlyAdmin {
        whiteList[_tokenId] = true;
        emit PlanetWhiteListAdded(_tokenId);
    }

    function onERC1155Received(
        address operator,
        address from,
        uint256 id,
        uint256 value,
        bytes calldata data
    ) external override returns (bytes4) {
        return this.onERC1155Received.selector;
    }

    function onERC1155BatchReceived(
        address operator,
        address from,
        uint256[] calldata ids,
        uint256[] calldata values,
        bytes calldata data
    )
     external override returns (bytes4) {
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
  
    function _lockToken(uint256 _tokenId) private {
        require(whiteList[_tokenId], "PlanetStake::This token cannot be stake");

        require(
            (landRockerERC1155.isApprovedForAll(msg.sender, address(this))),
            "PlanetStake::Stake has not access"
        );
        require(
            landRockerERC1155.balanceOf(msg.sender, _tokenId) >= 1,
            "PlanetStake::You do not have enough balance"
        );
        landRockerERC1155.safeTransferFrom(
            msg.sender,
            address(this),
            _tokenId,
            1,
            ""
        );
    }
}
