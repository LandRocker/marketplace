// SPDX-License-Identifier: GPL-3.0
pragma solidity 0.8.6;

/**
 * @title ILandRockerERC721Factory
 * @dev An interface for a factory contract to create LandRockerERC721 contracts.
 */
interface ILandRockerERC721Factory {
    /**
     * @dev Emitted when a new LandRockerERC721 contract is created.
     * @param landRockerERC721 The address of the newly created LandRockerERC721 contract.
     * @param name The name of the collection.
     * @param symbol  The symbol of the collection.
     * @param baseUri The base URI for token metadata.
     */
    event LandRockerERC721Created(
        address landRockerERC721,
        string name,
        string symbol,
        string baseUri
    );

    /**
     * @dev Sets the address of the implementation contract used to create LandRockerERC721 contracts.
     * @param _implementationAddress The address of the implementation contract.
     */
    function setImplementationAddress(address _implementationAddress) external;

    /**
     * @dev Creates a new LandRockerERC721 contract with the specified parameters.
     * @param _name The name of the LandRockerERC721 contract.
     * @param _symbol The symbol of the LandRockerERC721 contract.
     * @param _receiver The address of the royalty recipient.
     * @param _feeNumerator The numerator of the royalty fee.
     * @param _baseURI The base URI for token metadata.
     */
    function createLandRockerERC721(
        string memory _name,
        string memory _symbol,
        address _receiver,
        uint96 _feeNumerator,
        string memory _baseURI
    ) external;
}
