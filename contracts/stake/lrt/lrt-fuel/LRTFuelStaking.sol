// SPDX-License-Identifier: GPL-3.0
pragma solidity 0.8.6;
import {ReentrancyGuardUpgradeable} from "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import {UUPSUpgradeable} from "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import {IAccessRestriction} from "../../../access/IAccessRestriction.sol";
import {ILRTFuelStaking} from "./ILRTFuelStaking.sol";
import {ILRT} from "./../../../tokens/erc20/ILRT.sol";

// import "hardhat/console.sol";

/**
 * @title PlanetStake Contract
 * @dev A contract to manages staking and rewards for LRTFuelStaking.
 */
contract LRTFuelStaking is
    Initializable,
    UUPSUpgradeable,
    ReentrancyGuardUpgradeable,
    ILRTFuelStaking
{
    IAccessRestriction public accessRestriction;
    ILRT public lrt;

    uint256 public apy;
    uint256 public fuelPrice;
    mapping(uint8 => uint256[]) public discountRates;
    uint256[] public amountThresholds;
    mapping(address => UserStake[]) public override userStakes;

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

    function setAPY(uint256 _apy) external override onlyAdmin {
        apy = _apy;
    }

    function setFuelPrice(uint256 _fuelPrice) external override onlyAdmin {
        fuelPrice = _fuelPrice;
    }

    function setDiscountRates(
        uint8 duration,
        uint256[] calldata rates
    ) external override onlyAdmin {
        require(rates.length == 5, "Incorrect number of rate entries");
        discountRates[duration] = rates;
    }

    function setAmountThresholds(
        uint256[] calldata thresholds
    ) external override onlyAdmin {
        amountThresholds = thresholds;
    }

    function stake(uint256 _amount, uint8 _duration) external override {
        require(_amount > 0, "Amount must be positive");
        require(
            _duration == 1 ||
                _duration == 3 ||
                _duration == 6 ||
                _duration == 9 ||
                _duration == 12,
            "Invalid duration"
        );

        require(
            lrt.allowance(msg.sender, address(this)) >= _amount,
            "Marketplace::Allowance error"
        );
        lrt.transferFrom(msg.sender, address(this), _amount);

        uint256 index = _findAmountIndex(_amount);
        uint256 fuelReward = _calculateFuelReward(_amount, index, _duration);

        UserStake memory userStake = UserStake(
            uint64(block.timestamp),
            _duration,
            _amount,
            fuelReward
        );

        userStakes[msg.sender].push(userStake);

        emit LRTFuelStaked(msg.sender, _amount, _duration, fuelReward);
    }

    function unstake() external override {
        UserStake[] storage userStakesList = userStakes[msg.sender];

        uint256 claimable = 0;
        for (uint256 i = 0; i <= userStakesList.length; i++) {
            UserStake storage currentStaking = userStakesList[i];
            uint64 cuurentTime = uint64(block.timestamp);
            uint64 endDate = currentStaking.startTime +
                (currentStaking.duration * 30 days);
            if (cuurentTime >= endDate && currentStaking.stakedAmount > 0) {
                claimable += currentStaking.stakedAmount;
                currentStaking.stakedAmount = 0;
            }
        }
        require(claimable > 0, "you dont have enough stake");

        require(
            lrt.transfer(msg.sender, claimable),
            "Staking period not yet finished"
        );

        emit LRTFuelUnStaked(msg.sender, claimable);
    }

    function _calculateFuelReward(
        uint256 amount,
        uint256 index,
        uint8 duration
    ) private view returns (uint256) {
        uint256 rate = discountRates[duration][index]; // rate is also scaled by 10,000
        uint256 effectiveFuelPrice = (fuelPrice * rate) / 10000; // Adjust fuel price by discount rate
        uint256 reward = (((apy * amount) / 10000) / duration) /
            (fuelPrice - effectiveFuelPrice);
        return reward;
    }

    function _findAmountIndex(uint256 amount) private view returns (uint256) {
        uint256 low = 0;
        uint256 high = amountThresholds.length;

        while (low < high) {
            uint256 mid = low + (high - low) / 2;
            if (amountThresholds[mid] > amount) {
                high = mid;
            } else {
                low = mid + 1;
            }
        }
        return low;
    }

    /**
     * @dev Authorizes a contract upgrade.
     * @param newImplementation The address of the new contract implementation.
     */
    function _authorizeUpgrade(
        address newImplementation
    ) internal override onlyOwner {}
}
