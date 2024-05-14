// SPDX-License-Identifier: GPL-3.0
pragma solidity 0.8.6;

/**
 * @title ILandRocker
 * @dev Interface for the ILandRocker contract.
 */
interface ILandRocker {
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
     * @dev Emitted when a new NFT 1155 collection is added to the marketplace.
     * @param collection The address of the NFT collection.
     * @param isActive A boolean indicating if the collection is active for sell.
     */
    event Collection1155Added(address collection, bool isActive);


    /**
     * @dev Emitted when a new NFT 721 collection is added to the marketplace.
     * @param collection The address of the NFT collection.
     * @param isActive A boolean indicating if the collection is active for sell.
     */
    event Collection721Added(address collection, bool isActive);

    /**
     * @dev Initializes the contract.
     * @param _accessRestriction The address of the access restriction contract.
     */
    function initializeLandRocker(address _accessRestriction) external;

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
     * @dev Sets whether a particular ERC1155 collection is considered valid.
     * @param _addr The address of the ERC1155 collection contract.
     * @param _isActive A boolean indicating if the collection is active for sell other usecases.
     */
    function setLandRockerCollection1155(
        address _addr,
        bool _isActive
    ) external;

    /**
     * @dev Sets whether a particular ERC721 collection is considered valid.
     * @param _addr The address of the ERC721 collection contract.
     * @param _isActive A boolean indicating if the collection is active for sell or other usecases.
     */
    function setLandRockerCollection721(
        address _addr,
        bool _isActive
    ) external; 

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

     /**
     * @dev Gets the collection1155 status.
     * @param _collection The address of the ERC1155 collection contract.
     * @return The current status of collection1155.
     */
    function landrocker1155Collections(address _collection) external view returns (bool);

         /**
     * @dev Gets the collection721 status.
     * @param _collection The address of the ERC721 collection contract.
     * @return The current status of collection721.
     */
    function landrocker721Collections(address _collection) external view returns (bool);
}
