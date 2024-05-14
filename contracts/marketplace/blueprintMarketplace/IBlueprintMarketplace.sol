// SPDX-License-Identifier: GPL-3.0
pragma solidity 0.8.6; 

/**
 * @title IBlueprintMarketplace interface
 * @dev This interface defines the functions and data structures for an off-chain blueprint marketplace.
 */
interface IBlueprintMarketplace {
    //To define the domain separator for signing and verifying messages.
    struct EIP712Domain {
        string name; // The name of the domain. It identifies the smart contract or the context in which the signature is used.
        string version; // To represent the version of the domain.
        uint256 chainId; // To represent the chain Id.
        address verifyingContract; // The address of the contract that will perform the signature verification.
        bytes32 salt; // To add an additional layer of uniqueness to the domain separator.
    }    
      
    /**
     * @dev Emitted when a user buys an off-chain blueprint in secondary market.
     * @param orderIdHash Hash of the order Id.
     * @param blueprintId Unique identifier of blueprint being sold. Fuel,Ne,....
     * @param buyer Address of the buyer.
     * @param totalPayment Amount of LRT tokens spent.
     */
    event FulFilledOrder(
        bytes32 indexed orderIdHash,
        uint256 indexed blueprintId,
        address seller,
        address indexed buyer,
        uint256 totalPayment
    );
    
    /**
     * @dev Emitted when funds are withdrawn from the marketplace.
     * @param amount The amount of funds withdrawn.
     * @param recipient Address of the recipient.
     */
    event Withdrawn(uint256 amount, address recipient);

    /**
     * @dev Initializes the contract.
     * @param _accessRestriction The address of the access restriction contract.
     * @param _lrt The address of the LRT token contract.
     * @param _landRocker The address of the LandRocker contract. 
     */
    function initializeBlueprintMarketplace(
        address _accessRestriction,
        address _lrt,
        address _landRocker 
    ) external;   
 

    /**
     * @dev Fulfill an off-chain order.
     * @param _orderIdHash Hash of the order Id.
     * @param _seller Address of the seller.
     * @param _status Status of the order.
     * @param _blueprintId Unique identifier of blueprint being sold. Fuel,Ne,....
     * @param _expireDate Expiration date of the order (timestamp).
     * @param _price Price of the blueprint.
     * @param _v ECDSA signature V value.
     * @param _r ECDSA signature R value.
     * @param _s ECDSA signature S value.
     */
    function fulfillOrder(
        bytes32 _orderIdHash,
        address _seller,
        uint32 _status,
        uint256 _blueprintId,
        uint64 _expireDate,
        uint256 _price,
        uint8 _v,
        bytes32 _r,
        bytes32 _s
    ) external;

    /**
     * @dev Withdraw funds from the marketplace.
     * @param _amount The amount of funds to withdraw.
     */
    function withdraw(uint256 _amount) external;  

    /**
     * @dev Check if an off-chain order has been fulfilled.
     * @param _orderIdHash Hash of the order to check.
     * @return status True if the order has been fulfilled, false otherwise.
     */
    function orderFulfilled(
        bytes32 _orderIdHash
    ) external view returns (bool status);
}
