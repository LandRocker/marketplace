// SPDX-License-Identifier: MIT
pragma solidity ^0.8.6;
import {Counters} from "@openzeppelin/contracts/utils/Counters.sol";
import {Clones} from "@openzeppelin/contracts/proxy/Clones.sol";
import "./LandRockerERC721.sol";
import "./ILandRockerERC721.sol";
import {ILandRockerERC721Factory} from "./ILandRockerERC721Factory.sol";

// import {ILRT} from "./../erc20/ILRT.sol";
// import {ILRTDistributor} from "./../erc20/lrtDistributor/ILRTDistributor.sol";
// import {ILandRocker} from "./../../landrocker/ILandRocker.sol";
// import {ILRTVesting} from "./../../vesting/ILRTVesting.sol";
import {INonMinted721Marketplace} from "./../../marketplace/nonMinted721/INonMinted721Marketplace.sol";

import "hardhat/console.sol";

contract LandRockerERC721Factory is ILandRockerERC721Factory {
    using Counters for Counters.Counter;

    mapping(uint256 => address) public landRockerERC721Clones;
    mapping(address => address) public landRockerERC721Creators;
    mapping(bytes32 => bool) public isUsedCollection;
    address public implementionAddress;
    IAccessRestriction public accessRestriction;
    ILandRockerERC721 _landrocker721;

    // ILRT lrt;
    // ILRTDistributor lrtDistributor;
    // ILandRocker landRocker;
    // ILRTVesting lrtVesting;
    INonMinted721Marketplace public nonMinted721Marketplace;

    Counters.Counter private _cloneId;

    /** NOTE modifier to check msg.sender has admin role */
    modifier onlyAdmin() {
        accessRestriction.ifAdmin(msg.sender);
        _;
    }

    constructor(address _acessRestriction, address _nonMinted721Marketplace) {
        accessRestriction = IAccessRestriction(_acessRestriction);
        nonMinted721Marketplace = INonMinted721Marketplace(
            _nonMinted721Marketplace
        );
    }

    function setImplementationAddress(
        address _implementionAddress
    ) external override onlyAdmin {
        implementionAddress = _implementionAddress;
    }

    function createLandRockerERC721(
        string memory _name,
        string memory _symbol,
        address _receiver,
        uint96 feeNumerator,
        string memory baseURI_
    ) external override onlyAdmin {
        require(
            isUsedCollection[keccak256(abi.encodePacked(_name))] == false,
            "duplicate collection name"
        );
        _landrocker721 = ILandRockerERC721(Clones.clone(implementionAddress));

        // lrt = ILRT(address(accessRestriction));
        // address accessRestrictionadd = address(accessRestriction);
        // address lrt1 = address(lrt);
        // lrtDistributor = ILRTDistributor(accessRestrictionadd, lrt1);
        // landRocker = ILandRocker(address(accessRestriction));
        // lrtVesting = ILRTVesting(
        //     address(lrtDistributor),
        //     address(accessRestriction)
        // );
        // nonMinted721Marketplace = NonMinted721Marketplace(
        //     address(accessRestriction),
        //     address(lrt),
        //     address(landRocker),
        //     address(lrtVesting)
        // );

        console.log(implementionAddress, "implementionAddress");

        _landrocker721.erc721Init(
            _name,
            _symbol,
            address(accessRestriction),
            _receiver,
            feeNumerator,
            baseURI_
        );
        landRockerERC721Creators[address(_landrocker721)] = msg.sender;

        landRockerERC721Clones[_cloneId.current()] = (address(_landrocker721));

        isUsedCollection[keccak256(abi.encodePacked(_name))] = true;
        _cloneId.increment();

        uint256 startGas = gasleft();
        console.log(startGas, "Used gas in Factory");
        // ...some code here...
        nonMinted721Marketplace.setLandRockerCollection(
            address(_landrocker721)
        );
        uint256 gasUsed = startGas - gasleft();
        console.log(gasUsed, "Used gas in Factory");

        emit LandRockerERC721Created(address(_landrocker721));
    }

    function getLandRockerERC721Clones(
        uint256 cloneId
    ) external override onlyAdmin returns (address) {
        return landRockerERC721Clones[cloneId];
    }
}
