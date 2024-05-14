const { expect } = require("chai");
// const { time } = require("@openzeppelin/test-helpers");
const { ethers, network } = require("hardhat");

const {
  loadFixture,
  time,
} = require("@nomicfoundation/hardhat-network-helpers");
const Helper = require("./helper");
const Math = require("./helper/math");
const { TimeEnumes } = require("./helper/enums");
const { lrtVestingTeamFixture } = require("./fixture");
const { AccessErrorMsg, LRTVestingTeamErrorMsg } = require("./messages");
describe("LRTٰVestingTeam contract", function () {
  let lrtVestingTeamInstance,
    lrtDistributorInstance,
    lrtInstance,
    arInstance,
    owner,
    admin,
    approvedContract,
    script,
    addr1,
    addr2;

  beforeEach(async function () {
    ({
      lrtVestingTeamInstance,
      lrtDistributorInstance,
      lrtInstance,
      arInstance,
      owner,
      admin,
      approvedContract,
      script,
      addr1,
      addr2,
    } = await loadFixture(lrtVestingTeamFixture));
  });

  describe("set listing date", function () {
    it("Should not allow to set the listing date if the caller is not admin", async function () {
      await expect(
        lrtVestingTeamInstance.connect(addr1).setListingDate(1)
      ).to.be.revertedWith(AccessErrorMsg.CALLER_NOT_ADMIN);
    });

    it("Should not allow to set the listing date if the listing date is less than 0", async function () {
      await expect(
        lrtVestingTeamInstance.connect(admin).setListingDate(0)
      ).to.be.revertedWith(LRTVestingTeamErrorMsg.INVALID_LIST_DATE);
    });

    it("Should allow admin to set the listing date", async function () {
      const listingDate = 1;
      await lrtVestingTeamInstance.connect(admin).setListingDate(listingDate);
      expect(await lrtVestingTeamInstance.listingDate()).to.equal(listingDate);
    });
  });

  describe("set duration", function () {
    it("Should not allow to set duration if the caller is not admin", async function () {
      await expect(
        lrtVestingTeamInstance.connect(addr1).setDuration(1)
      ).to.be.revertedWith(AccessErrorMsg.CALLER_NOT_ADMIN);
    });

    it("Should not allow to set duration if the duration is less than zero", async function () {
      await expect(
        lrtVestingTeamInstance.connect(admin).setDuration(0)
      ).to.be.revertedWith(LRTVestingTeamErrorMsg.INVALID_DURATION);
    });

    it("Should allow admin to set the duration", async function () {
      const duration = 5;
      await lrtVestingTeamInstance.connect(admin).setDuration(duration);
      expect(await lrtVestingTeamInstance.duration()).to.equal(duration);
    });
  });

  describe("create vesting team", function () {
    it("Should not create a vesting team if the listing date is not set", async function () {
      const beneficiary = addr1.address;
      const amount = 100;

      await expect(
        lrtVestingTeamInstance.connect(admin).createVesting(beneficiary, amount)
      ).to.be.revertedWith(LRTVestingTeamErrorMsg.INVALID_LIST_DATE);
    });

    it("Should not create a vesting team if the duration is not set", async function () {
      const beneficiary = addr1.address;
      const amount = 100;

      await lrtVestingTeamInstance.connect(admin).setListingDate(1);

      await expect(
        lrtVestingTeamInstance.connect(admin).createVesting(beneficiary, amount)
      ).to.be.revertedWith(LRTVestingTeamErrorMsg.INVALID_DURATION);
    });

    it("Should not create a vesting with 0 amount", async function () {
      const beneficiary = addr1.address;
      const amount = 0;

      await expect(
        lrtVestingTeamInstance.connect(admin).createVesting(beneficiary, amount)
      ).to.be.revertedWith(LRTVestingTeamErrorMsg.INVALID_AMOUNT);
    });

    it("Should create a vesting team", async function () {
      const beneficiary = addr1.address;
      const amount = 100;

      await lrtVestingTeamInstance.connect(admin).setListingDate(1);
      await lrtVestingTeamInstance.connect(admin).setDuration(5);

      const tx = await lrtVestingTeamInstance
        .connect(admin)
        .createVesting(beneficiary, amount);

      //1209600
      const initialLockDuration = Number(
        await lrtVestingTeamInstance.INITIAL_LOCK_DURATION()
      );

      //15552000
      const secondaryLockDuration = Number(
        await lrtVestingTeamInstance.SECONDARY_LOCK_DURATION()
      );

      // check that the vesting plan was created
      const userVesting = await lrtVestingTeamInstance.userVestings(
        beneficiary
      );
      expect(userVesting.startDate).to.equal(1);
      expect(userVesting.endDate).to.equal(6);
      expect(userVesting.initialUnlockDate).to.equal(initialLockDuration + 1);
      expect(userVesting.secondaryUnlockDate).to.equal(
        secondaryLockDuration + 1
      );
      expect(userVesting.beneficiary).to.equal(beneficiary);
      expect(userVesting.vestedAmount).to.equal(100);
      expect(userVesting.claimedAmount).to.equal(0);

      await expect(tx)
        .to.emit(lrtVestingTeamInstance, "VestingCreated")
        .withArgs(
          beneficiary,
          1,
          initialLockDuration + 1,
          secondaryLockDuration + 1,
          6,
          amount
        );
    });
  });

  describe("claim", function () {
    it("Should not allow claiming if beneficiary is revoked", async function () {
      const beneficiary = addr1.address;
      const amount = ethers.utils.parseUnits("100");
      const duration = Helper.convertToSeconds("months", 5);
      const listedDate =
        (await time.latest()) + (await Helper.convertToSeconds("days", 1));

      await lrtVestingTeamInstance.connect(admin).setListingDate(listedDate);
      await lrtVestingTeamInstance.connect(admin).setDuration(duration);
      await lrtVestingTeamInstance
        .connect(admin)
        .createVesting(beneficiary, amount);
      const elapsedTime = await Helper.convertToSeconds("days", 20);

      await network.provider.send("evm_increaseTime", [elapsedTime]);
      await network.provider.send("evm_mine");

      await lrtVestingTeamInstance.connect(admin).revoke(beneficiary);

      await expect(
        lrtVestingTeamInstance.connect(addr1).claim()
      ).to.be.revertedWith(LRTVestingTeamErrorMsg.REVOKED_BEFORE);
    });

    it("Should not allow claiming if claimable is less than zero", async function () {
      const beneficiary = addr1.address;
      const amount = ethers.utils.parseUnits("100");
      const duration = Helper.convertToSeconds("months", 5);
      const listedDate =
        (await time.latest()) + (await Helper.convertToSeconds("days", 1));

      await lrtVestingTeamInstance.connect(admin).setListingDate(listedDate);
      await lrtVestingTeamInstance.connect(admin).setDuration(duration);
      await lrtVestingTeamInstance
        .connect(admin)
        .createVesting(beneficiary, amount);
      const elapsedTime = await Helper.convertToSeconds("days", 10);

      await network.provider.send("evm_increaseTime", [elapsedTime]);
      await network.provider.send("evm_mine");

      await expect(
        lrtVestingTeamInstance.connect(addr1).claim()
      ).to.be.revertedWith(LRTVestingTeamErrorMsg.INVALID_CLAIMABLE_AMOUNT);
    });

    it("Should allow claiming the 66% of tokens between the 14 days and 180 days after vesting start date", async function () {
      const beneficiary = addr1.address;
      const amount = ethers.utils.parseUnits("100");
      const duration = Helper.convertToSeconds("months", 5);
      const listedDate =
        (await time.latest()) + (await Helper.convertToSeconds("days", 1));

      await lrtVestingTeamInstance.connect(admin).setListingDate(listedDate);
      await lrtVestingTeamInstance.connect(admin).setDuration(duration);
      await lrtVestingTeamInstance
        .connect(admin)
        .createVesting(beneficiary, amount);
      const elapsedTime = await Helper.convertToSeconds("days", 15);

      await network.provider.send("evm_increaseTime", [elapsedTime]);
      await network.provider.send("evm_mine");

      const userVestingBeforeClaiming =
        await lrtVestingTeamInstance.userVestings(beneficiary);

      const userBalanceBeforeClaiming = await lrtInstance.balanceOf(
        addr1.address
      );

      const userVestedAmountBeforeClaiming =
        userVestingBeforeClaiming.vestedAmount;

      const tx = await lrtVestingTeamInstance.connect(addr1).claim();

      const userVestingAfterClaiming =
        await lrtVestingTeamInstance.userVestings(beneficiary);

      const claimedAmount = userVestingAfterClaiming.claimedAmount;
      const userBalanceAfterClaiming = await lrtInstance.balanceOf(
        addr1.address
      );

      const userVestedAmountAfterClaiming =
        userVestingAfterClaiming.vestedAmount.toString();

      
      expect(userVestingAfterClaiming.claimedAmount).to.equal(claimedAmount);
      expect(userVestingAfterClaiming.vestedAmount).to.equal(
        userVestedAmountBeforeClaiming
      );

      expect(userBalanceAfterClaiming).to.equal(
        userBalanceBeforeClaiming.add(claimedAmount)
      );

      await expect(tx)
        .to.emit(lrtVestingTeamInstance, "Claimed")
        .withArgs(addr1.address, claimedAmount);
    });

    it("Should allow claiming all tokens after the vesting period has ended", async function () {
      const beneficiary = addr1.address;
      const amount = ethers.utils.parseUnits("100");
      const duration = Helper.convertToSeconds("months", 5);
      const listedDate =
        (await time.latest()) + (await Helper.convertToSeconds("days", 1));

      await lrtVestingTeamInstance.connect(admin).setListingDate(listedDate);
      await lrtVestingTeamInstance.connect(admin).setDuration(duration);
      await lrtVestingTeamInstance
        .connect(admin)
        .createVesting(beneficiary, amount);
      const elapsedTime = await Helper.convertToSeconds("days", 183);

      await network.provider.send("evm_increaseTime", [elapsedTime]);
      await network.provider.send("evm_mine");

      const userVestingBeforeClaiming =
        await lrtVestingTeamInstance.userVestings(beneficiary);

      const userBalanceBeforeClaiming = await lrtInstance.balanceOf(
        addr1.address
      );

      const userVestedAmountBeforeClaiming =
        userVestingBeforeClaiming.vestedAmount;

      const tx = await lrtVestingTeamInstance.connect(addr1).claim();

      const userVestingAfterClaiming =
        await lrtVestingTeamInstance.userVestings(beneficiary);

      const claimedAmount = userVestingAfterClaiming.claimedAmount;
      const userBalanceAfterClaiming = await lrtInstance.balanceOf(
        addr1.address
      );

      const userVestedAmountAfterClaiming =
        userVestingAfterClaiming.vestedAmount.toString();

     

      expect(userVestingAfterClaiming.claimedAmount).to.equal(claimedAmount);
      expect(userVestingAfterClaiming.vestedAmount).to.equal(
        userVestedAmountBeforeClaiming
      );

      expect(userBalanceAfterClaiming).to.equal(
        userBalanceBeforeClaiming.add(claimedAmount)
      );

      await expect(tx)
        .to.emit(lrtVestingTeamInstance, "Claimed")
        .withArgs(addr1.address, claimedAmount);
    });
  });

  describe("revoke", function () {
    it("Should not allow revoke if beneficiary already revoked ", async function () {
      const beneficiary = addr1.address;
      const amount = 100;

      await lrtVestingTeamInstance.connect(admin).setListingDate(1);
      await lrtVestingTeamInstance.connect(admin).setDuration(5);

      const tx = await lrtVestingTeamInstance
        .connect(admin)
        .createVesting(beneficiary, amount);
      await lrtVestingTeamInstance.connect(admin).revoke(beneficiary);

      await expect(
        lrtVestingTeamInstance.connect(admin).revoke(beneficiary)
      ).to.be.revertedWith(LRTVestingTeamErrorMsg.REVOKED_BEFORE);
    });

    it("Should not allow to revoke if the caller is not admin", async function () {
      const beneficiary = addr1.address;
      await expect(
        lrtVestingTeamInstance.connect(addr1).revoke(beneficiary)
      ).to.be.revertedWith(AccessErrorMsg.CALLER_NOT_ADMIN);
    });

    it("Should not allow revoking if claimable is less than zero", async function () {
      const beneficiary = addr1.address;
      const amount = ethers.utils.parseUnits("100");
      const duration = Helper.convertToSeconds("months", 5);
      const listedDate =
        (await time.latest()) + (await Helper.convertToSeconds("days", 1));

      await lrtVestingTeamInstance.connect(admin).setListingDate(listedDate);
      await lrtVestingTeamInstance.connect(admin).setDuration(duration);
      await lrtVestingTeamInstance
        .connect(admin)
        .createVesting(beneficiary, amount);
      const elapsedTime = await Helper.convertToSeconds("days", 10);

      await network.provider.send("evm_increaseTime", [elapsedTime]);
      await network.provider.send("evm_mine");

      await expect(
        lrtVestingTeamInstance.connect(admin).revoke(beneficiary)
      ).to.be.revertedWith(LRTVestingTeamErrorMsg.INVALID_CLAIMABLE_AMOUNT);
    });
    it("Should allow revoking", async function () {
      const beneficiary = addr1.address;
      const amount = ethers.utils.parseUnits("100");
      const duration = Helper.convertToSeconds("months", 5);
      const listedDate =
        (await time.latest()) + (await Helper.convertToSeconds("days", 1));

      await lrtVestingTeamInstance.connect(admin).setListingDate(listedDate);
      await lrtVestingTeamInstance.connect(admin).setDuration(duration);
      await lrtVestingTeamInstance
        .connect(admin)
        .createVesting(beneficiary, amount);
      const elapsedTime = await Helper.convertToSeconds("days", 16);

      await network.provider.send("evm_increaseTime", [elapsedTime]);
      await network.provider.send("evm_mine");

      const userBalanceBeforeRevoking = await lrtInstance.balanceOf(
        beneficiary
      );

      const tx = await lrtVestingTeamInstance
        .connect(admin)
        .revoke(beneficiary);

      const userBalanceAfterRevoking = await lrtInstance.balanceOf(beneficiary);

      const userVesting = await lrtVestingTeamInstance.userVestings(
        beneficiary
      );

      const claimedAmount = userVesting.claimedAmount;

      expect(userBalanceAfterRevoking).to.equal(
        userBalanceBeforeRevoking.add(claimedAmount)
      );

      await expect(tx)
        .to.emit(lrtVestingTeamInstance, "Revoked")
        .withArgs(beneficiary, claimedAmount);
    });
  });
});
