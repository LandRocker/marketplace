// SPDX-License-Identifier: MIT


// MockReentrant.sol
// This contract simulates a contract calling back into itself to cause a reentrant attack
pragma solidity ^0.8.6;

contract MockReentrant {
    bool public isReentrant = false;
    event CallCompleted();

    constructor() payable {}

    function maliciousFunction(address target) external payable {
        isReentrant = true;
        target.call{value: msg.value}(abi.encodeWithSignature("buyTokenByNativeCoin(uint256)", 100));
        isReentrant = false;
        emit CallCompleted(); // Emit the event here

    }
}