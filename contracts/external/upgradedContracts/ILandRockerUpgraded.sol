// SPDX-License-Identifier: GPL-3.0
pragma solidity 0.8.6;

/**
 * @title ILandRockerUpgraded
 * @dev Interface for the ILandRocker contract.
 */
interface ILandRockerUpgraded {
    /**
     * @dev Emitted when the system fee is updated.
     * @param fee The new system fee.
     */
    event SystemFeeUpdated(uint256 fee);

    /**
     * @dev Emitted when the treasury address is updated.
     * @param treasury The new treasury address.
     */
    event TreasuryAddressUpdated(address treasury);

    /**
     * @dev Emitted when the treasury address is updated.
     * @param treasury The new treasury address.
     */
    event TreasuryAddress721Updated(address treasury);

    /**
     * @dev Emitted when the treasury address for ERC1155 tokens is updated.
     * @param treasury The new treasury address for ERC1155 tokens.
     */
    event TreasuryAddress1155Updated(address treasury);

     /**
     * @dev Initializes the contract.
     * @param _accessRestriction The address of the access restriction contract.
     */
    function initializeLandRocker(address _accessRestriction,string memory _greeting) external;

    /**
     * @dev Sets the system fee.
     * @param _systemFee The new system fee to set.
     */
    function setSystemFee(uint256 _systemFee) external;

    /**
     * @dev Sets the treasury address.
     * @param _address The new treasury address to set.
     */
    function setTreasuryAddress(address _address) external;

    /**
     * @dev Sets the treasury address for ERC721 tokens.
     * @param _treasury The new treasury address for ERC721 tokens to set.
     */
    function setTreasuryAddress721(address _treasury) external;

    /**
     * @dev Sets the treasury address for ERC1155 tokens.
     * @param _treasury The new treasury address for ERC1155 tokens to set.
     */
    function setTreasuryAddress1155(address _treasury) external;

    /**
     * @dev Gets the current system fee.
     * @return The current system fee.
     */
    function systemFee() external view returns (uint256);

    /**
     * @dev Gets the treasury address.
     * @return The current treasury address.
     */
    function treasury() external view returns (address);

    /**
     * @dev Gets the treasury address for ERC721 tokens.
     * @return The current treasury address for ERC721 tokens.
     */
    function treasury721() external view returns (address);

    /**
     * @dev Gets the treasury address for ERC1155 tokens.
     * @return The current treasury address for ERC1155 tokens.
     */
    function treasury1155() external view returns (address);

    function greeting() external view returns(string memory);

}
