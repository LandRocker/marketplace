// SPDX-License-Identifier: MIT
pragma solidity 0.8.6;

import "./LandRockerERC721.sol";

interface ILandRockerERC721Factory {
    event LandRockerERC721Created(address landRockerERC721);

    function setImplementationAddress(address _implementionAddress) external;

    function createLandRockerERC721(
        string memory _name,
        string memory _symbol,
        address _receiver,
        uint96 feeNumerator,
        string memory baseURI_
    ) external;

    function getLandRockerERC721Clones(
        uint256 cloneId
    ) external returns (address);
}
