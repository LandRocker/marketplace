// SPDX-License-Identifier: GPL-3.0
pragma solidity 0.8.6;

/**
 * @title IMarketplace interface
 * @dev This is an interface for an NFT Marketplace contract.
 */

interface IMarketplace {
    /**
     * @dev Emitted when a sell listing is canceled.
     * @param listId The Id of the sell listing that was canceled.
     */
    event SellCanceled(uint256 listId);
    /**
     * @dev Emitted when funds are withdrawn from the contract.
     * @param amount The amount of funds withdrawn.
     * @param recipient The address that received the withdrawn funds.
     */
    event Withdrawn(uint256 amount, address recipient);

    /**
     * @dev Allows the seller to cancel a sell listing.
     * @param _listId The Id of the sell listing to be canceled.
     */
    function cancelSell(uint256 _listId) external;

    /**
     * @dev Allows a buyer to purchase an item from the marketplace.
     * @param _listId The Id of the sell listing to be purchased.
     */
    function buyItem(uint256 _listId) external;

    /**
     * @dev Allows the contract owner to withdraw funds from the contract.
     * @param _amount The amount to be withdrawn.
     */
    function withdraw(uint256 _amount) external;
}
