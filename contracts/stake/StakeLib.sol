// SPDX-License-Identifier: MIT
pragma solidity 0.8.6;

// Struct representing staking information for an asset.
library StakeLib {
    struct Staking {
        uint64 stakingDate; // The timestamp when the asset was staked.
        uint64 lastClaimedDate; // The timestamp when the last claim was made on this staked asset.
        address collection; // The address of the collection or contract related to the asset.
    }
}
