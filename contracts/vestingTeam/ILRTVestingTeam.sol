// SPDX-License-Identifier: GPL-3.0
pragma solidity 0.8.6;

/**
 * @title ILRTVestingTeam Interface
 * @dev Interface for LRT vesting team contract
 */
interface ILRTVestingTeam {
    /**
     * @dev User vesting schedule details
     */
    struct Vesting {
        address beneficiary;
        uint64 startDate;
        uint64 endDate;
        uint64 initialUnlockDate;
        uint64 secondaryUnlockDate;
        uint256 vestedAmount;
        uint256 claimedAmount;
    }

    /**
     * @dev Emitted when vesting is claimed
     * @param amount Claimed amount
     * @param beneficiary Beneficiary address

     */
    event Claimed(address indexed beneficiary,uint256 amount);

    /**
     * @dev Emitted when vesting is revoked
     * @param amount Revoked amount
     * @param beneficiary Beneficiary address

     */
    event Revoked(address indexed beneficiary,uint256 amount);

    /**
     * @dev Emitted when vesting created
     * @param beneficiary Beneficiary
     * @param startDate Start timestamp
     * @param intialUnlockDate Unlock timestamp
     * @param secondaryUnlockDate Unlock timestamp
     * @param endDate End timestamp
     * @param totalAmount Total vesting amount
     */
    event VestingCreated(
        address indexed beneficiary,
        uint64 startDate,
        uint64 intialUnlockDate,
        uint64 secondaryUnlockDate,
        uint64 endDate,
        uint256 totalAmount
    );

    // External functions

    /**
     * @dev Creates new vesting schedule
     * @param _beneficiary Beneficiary address
     * @param _amount Total vesting amount
     */
    function createVesting(address _beneficiary, uint256 _amount) external;

    /**
     * @dev Revokes vesting schedule
     * @param _beneficiary Beneficiary address
     */
    function revoke(address _beneficiary) external;

    /**
     * @dev Claims vested tokens
     */
    function claim() external;

    function setListingDate(uint64 _listingDate) external;

    function setDuration(uint64 _duration) external;

    /*
     * @dev Gets user vesting details
     * @param _beneficiary Beneficiary address
     * @param planID Plan ID
     * @param index Vesting index
     * @return User vesting details
     */
    function userVestings(
        address _beneficiary
    )
        external
        view
        returns (
            address beneficiary,
            uint64 startDate,
            uint64 endDate,
            uint64 initialUnlockDate,
            uint64 secondaryUnlockDate,
            uint256 vestedAmount,
            uint256 claimedAmount
        );        
}
