// SPDX-License-Identifier: GPL-3.0
pragma solidity 0.8.6;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title ILRT Interface
 * @dev Interface for the LRT token contract that extends ERC20
 */
interface ILRT is IERC20 {
    /**
     * @dev Transfer LRT tokens to a specified address
     * @param _to Address to transfer tokens to
     * @param _amount Amount of tokens to transfer
     * @return True if transfer is successful, false otherwise
     */
    function transferToken(
        address _to,
        uint256 _amount
    ) external returns (bool);
}
