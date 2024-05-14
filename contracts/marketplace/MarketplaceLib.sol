// SPDX-License-Identifier: GPL-3.0
pragma solidity 0.8.6;

// Struct representing a sell order.
library MarketPlaceLib {
    struct Sell {
        uint8 status; //Indicates the status of the sell order. 0: Started, 1: Sold, 2: Canceled
        uint64 expireDate; // The timestamp when the sell order expires.
        address collection; // The address of the collection to which the asset belongs.
        uint256 price; // The price at which the asset is being sold.
    }
}
