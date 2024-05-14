// SPDX-License-Identifier: GPL-3.0
pragma solidity 0.8.6;

/**
 * @title ILandRockerERC1155Factory
 * @dev An interface for a factory contract to create LandRockerERC1155 contracts.
 */
interface ILandRockerERC1155Factory {
    /**
     * @dev Emitted when a new LandRockerERC1155 contract is created.
     * @param landRockerERC1155 The address of the newly created LandRockerERC1155 contract.
     * @param name The name of the collection.
     * @param symbol  The symbol of the collection.
     * @param baseURI The base URI for token metadata.
     */
    event LandRockerERC1155Created(
        address landRockerERC1155,
        string name,
        string symbol,
        string baseURI
    );

    /**
     * @dev Sets the address of the implementation contract used to create LandRockerERC1155 contracts.
     * @param _implementationAddress The address of the implementation contract.
     */
    function setImplementationAddress(address _implementationAddress) external;

    /**
     * @dev Creates a new LandRockerERC1155 contract with the specified parameters.
     * @param _name The name of the LandRockerERC1155 contract.
     * @param _symbol The symbol of the LandRockerERC1155 contract.
     * @param _receiver The address of the royalty recipient.
     * @param _feeNumerator The numerator of the royalty fee.
     * @param _baseURI The base URI for token metadata.
     */
    function createLandRockerERC1155(
        string memory _name,
        string memory _symbol,
        address _receiver,
        uint96 _feeNumerator,
        string memory _baseURI
    ) external;
}
