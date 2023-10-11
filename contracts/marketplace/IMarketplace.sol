// SPDX-License-Identifier: MIT
pragma solidity 0.8.6;

/**
 * @title IMarketplace interface
 * @dev This is an interface for an NFT Marketplace contract.
 */

interface IMarketplace {
    /**
     * @dev Emitted when a sell listing is canceled.
     * @param _listID The ID of the sell listing that was canceled.
     */
    event SellCanceled(uint256 _listID);
    /**
     * @dev Emitted when funds are withdrawn from the contract.
     * @param _amount The amount of funds withdrawn.
     * @param recipient The address that received the withdrawn funds.
     */
    event Withdrawed(uint256 _amount, address recipient);

    /**
     * @dev Allows the seller to cancel a sell listing.
     * @param _listID The ID of the sell listing to be canceled.
     */
    function cancelSell(uint256 _listID) external;

    /**
     * @dev Allows a buyer to purchase an item from the marketplace.
     * @param _listID The ID of the sell listing to be purchased.
     */
    function buyItem(uint256 _listID) external;

    /**
     * @dev Allows the contract owner to withdraw funds from the contract.
     * @param _amount The amount to be withdrawn.
     */
    function withdraw(uint256 _amount) external;
}
