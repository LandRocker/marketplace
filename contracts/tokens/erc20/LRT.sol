// SPDX-License-Identifier: GPL-3.0
pragma solidity 0.8.6;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {IAccessRestriction} from "../../access/IAccessRestriction.sol";
import {ILRT} from "./ILRT.sol";

/**
 * @title LRT Token Contract
 * @notice ERC20 token with additional features like access control and distribution
 */
contract LRT is ERC20, ILRT {
    /// @dev EIP-20 token name for this token
    string public constant NAME = "LandRocker";

    /// @dev EIP-20 token symbol for this token
    string public constant SYMBOL = "LRT";

    /// @dev EIP-20 token decimals for this token
    uint8 public constant DECIMALS = 18;

    /// @dev EIP-20 token supply for this token
    uint256 public constant SUPPLY = 1e10 * (10 ** DECIMALS);

    /// @dev Reference to the access restriction contract
    IAccessRestriction public immutable accessRestriction;

    /// @dev Modifier: Only accessible by distributors
    modifier onlyDistributor() {
        accessRestriction.ifDistributor(msg.sender);
        _;
    }

    /**
     * @dev LRT contract constructor
     * @param _accessRestrictionAddress Address of access restriction contract
     */
    constructor(address _accessRestrictionAddress) ERC20(NAME, SYMBOL) {
        accessRestriction = IAccessRestriction(_accessRestrictionAddress);
        _mint(address(this), SUPPLY);
    }

    /** @dev Transfer LRT tokens to a specified address
     * @inheritdoc ILRT
     * @param _to Address to transfer tokens to
     * @param _amount Amount of tokens to transfer
     * @return True if transfer is successful, false otherwise
     */
    function transferToken(
        address _to,
        uint256 _amount
    ) external override onlyDistributor returns (bool) {
        require(_amount > 0, "LRT::Insufficient amount:equal to zero");
        require(
            !accessRestriction.isOwner(_to),
            "LRT::LRT can't transfer to owner"
        );
        require(
            balanceOf(address(this)) >= _amount,
            "LRT::Insufficient balance"
        );

        _transfer(address(this), _to, _amount);

        return true;
    }
}
