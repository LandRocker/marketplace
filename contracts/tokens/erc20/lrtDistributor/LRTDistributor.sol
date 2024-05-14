// SPDX-License-Identifier: GPL-3.0
pragma solidity 0.8.6;

import {IAccessRestriction} from "../../../access/IAccessRestriction.sol";
import {ILRT} from "./../ILRT.sol";
import {ILRTDistributor} from "./ILRTDistributor.sol";

/**
 * @title LRT Token Distributor Contract
 * @dev Distributes LRT tokens from various pools with access controls
 */
contract LRTDistributor is ILRTDistributor {
    /**
     * @dev Mapping to store available liquidity for each pool
     */
    mapping(bytes32 => uint256) public override poolLiquidity;

    /**
     * @dev Mapping to track used liquidity for each pool
     */
    mapping(bytes32 => uint256) public override usedLiquidity;

    /**
     * @dev Reference to the access restriction contract
     */
    IAccessRestriction public immutable accessRestriction;

    /**
     * @dev Reverts if address is invalid
     */
    modifier validAddress(address _addr) {
        require(_addr != address(0), "LRTDistributor::Not valid address");
        _;
    }

    /**
     * @dev Reference to the LRT token contract
     */
    ILRT public immutable token;

    /**
     * @dev Modifier: Only accessible by administrators
     */
    modifier onlyAdmin() {
        accessRestriction.ifAdmin(msg.sender);
        _;
    }

    /**
     * @dev Modifier: Only accessible by authorized scripts
     */
    modifier onlyScript() {
        accessRestriction.ifScript(msg.sender);
        _;
    }

    /**
     * @dev Modifier: Only accessible by approved contracts
     */
    modifier onlyApprovedContract() {
        accessRestriction.ifApprovedContract(msg.sender);
        _;
    }

    /**
     * @dev Constructor to initialize the LRTDistributor contract
     * @param _accessRestrictionAddress Address of the access restriction contract
     * @param lrt_ Address of the LRT token contract
     */
    constructor(address _accessRestrictionAddress, address lrt_) {
        accessRestriction = IAccessRestriction(_accessRestrictionAddress);
        token = ILRT(lrt_);

        // Initialize pool liquidity values
        poolLiquidity[bytes32("Seed")] = 5e8 * (10 ** 18);
        poolLiquidity[bytes32("Sale")] = 12e8 * (10 ** 18);
        poolLiquidity[bytes32("Reserved")] = 3e8 * (10 ** 18);
        poolLiquidity[bytes32("Team")] = 1e9 * (10 ** 18);
        poolLiquidity[bytes32("Ad&Dev")] = 14e8 * (10 ** 18);
        poolLiquidity[bytes32("Game")] = 35e8 * (10 ** 18);
        poolLiquidity[bytes32("Marketing")] = 1e9 * (10 ** 18);
        poolLiquidity[bytes32("Liquidity")] = 11e8 * (10 ** 18);
    }

    /**
     * @dev Distribute LRT tokens from a specified pool
     * @param poolName Name of distribution pool
     * @param _amount Amount of tokens to distribute
     * @param _to Recipient address
     * @return Success status
     */
    function distribute(
        bytes32 poolName,
        uint256 _amount,
        address _to
    ) external override onlyApprovedContract validAddress(_to) returns (bool) {
        _distribute(poolName, _amount, _to);

        emit TokenDistributed(poolName, _amount, _to);

        return true;
    }

    /**
     * @dev Swap LRT tokens from the "Game" pool
     * @param _to Recipient address
     * @param _amount Amount of tokens to swap
     */
    function swap(
        address _to,
        uint256 _amount
    ) external override onlyScript validAddress(_to) returns (bool) {
        _distribute(bytes32("Game"), _amount, _to);

        emit TokenSwapped(_to, _amount);

        return true;
    }

    /**
     * @dev Transfer remaining liquidity from a pool to "Game"
     * @param poolName Source pool name
     */
    function transferLiquidity(bytes32 poolName) external override onlyAdmin {
        uint256 remainingToken = poolLiquidity[poolName] -
            usedLiquidity[poolName];

        poolLiquidity[poolName] -= remainingToken;
        poolLiquidity[bytes32("Game")] += remainingToken;

        emit TransferredLiquidity(poolName, bytes32("Game"), remainingToken);
    }

    /**
     * @dev Distribute tokens from a pool
     * @param poolName Pool name
     * @param _amount Amount to distribute
     * @param _to Recipient address
     */
    function _distribute(
        bytes32 poolName,
        uint256 _amount,
        address _to
    ) private {
        // Validate pool balance
        require(
            _amount + usedLiquidity[poolName] <= poolLiquidity[poolName],
            "LRTDistributor::The pool has not enough balance"
        );

        require(
            _to != address(this),
            "LRTDistributor::LRT cannot transfer to distributor"
        );

        usedLiquidity[poolName] += _amount;

        // Transfer tokens
        bool success = token.transferToken(_to, _amount);
        require(success, "LRTDistributor::Token transfer faild");
    }
}
