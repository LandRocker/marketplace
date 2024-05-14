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
const { lrtVestingFixture } = require("./fixture");
const {
  AccessErrorMsg,
  LRTVestingErrorMsg,
  SaleErrorMsg,
} = require("./messages");
describe("LRTٰVesting contract", function () {
  let lrtVestingInstance,
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
      lrtVestingInstance,
      lrtDistributorInstance,
      lrtInstance,
      arInstance,
      owner,
      admin,
      approvedContract,
      script,
      addr1,
      addr2,
    } = await loadFixture(lrtVestingFixture));
  });

  describe("create vesting plan", function () {
    it("should create a vesting plan", async () => {
      // set up the vesting plan parameters
      const startDate =
        (await time.latest()) + (await Helper.convertToSeconds("days", 1));
      // start the vesting in 1 minute from now
      const cliff = await Helper.convertToSeconds("days", 1); // 1 day cliff86400;
      const duration = await Helper.convertToSeconds("weeks", 1); // 1 week vesting period
      const revocable = true;
      const poolName = ethers.utils.formatBytes32String("Sale");
      const initialReleasePercentage = 5000;

      // create the vesting plan
      const tx = await lrtVestingInstance
        .connect(admin)
        .createVestingPlan(
          startDate,
          cliff,
          duration,
          revocable,
          initialReleasePercentage,
          poolName
        );

      // check that the vesting plan was created
      const vestingPlan = await lrtVestingInstance.vestingPlans(0);
      expect(vestingPlan.startDate).to.equal(startDate);
      expect(vestingPlan.cliff).to.equal(cliff);
      expect(vestingPlan.duration).to.equal(duration);
      expect(vestingPlan.revocable).to.equal(revocable);
      expect(vestingPlan.initialReleasePercentage).to.equal(
        initialReleasePercentage
      );
      expect(vestingPlan.poolName).to.equal(poolName);

      await expect(tx)
        .to.emit(lrtVestingInstance, "VestingPlanCreated")
        .withArgs(
          0,
          startDate,
          cliff,
          duration,
          revocable,
          initialReleasePercentage,
          poolName
        );
    });

    it("should revert if the cliff is greater than the duration", async () => {
      // set up the vesting plan parameters
      const startDate =
        (await time.latest()) + (await Helper.convertToSeconds("days", 1));
      const cliff = await Helper.convertToSeconds("weeks", 1); // 1 week cliff
      const duration = await Helper.convertToSeconds("days", 1); // 1 day vesting period
      const revocable = true;

      const poolName = ethers.utils.formatBytes32String("Sale");
      const initialReleasePercentage = 5000;

      // try to create the vesting plan and expect it to revert
      await expect(
        lrtVestingInstance
          .connect(admin)
          .createVestingPlan(
            startDate,
            cliff,
            duration,
            revocable,
            initialReleasePercentage,
            poolName
          )
      ).to.be.revertedWith(LRTVestingErrorMsg.INVALID_CLIFF);
    });

    it("should revert if the duration is not set", async () => {
      // set up the vesting plan parameters
      const startDate =
        (await time.latest()) + (await Helper.convertToSeconds("days", 1));
      const cliff = 0; // 1 day cliff
      const duration = 0;
      const revocable = true;

      const poolName = ethers.utils.formatBytes32String("Sale");
      const initialReleasePercentage = 5000;

      // try to create the vesting plan and expect it to revert
      await expect(
        lrtVestingInstance
          .connect(admin)
          .createVestingPlan(
            startDate,
            cliff,
            duration,
            revocable,
            initialReleasePercentage,
            poolName
          )
      ).to.be.revertedWith(LRTVestingErrorMsg.ZERO_DURATION);
    });

    it("should revert if called by non-owner or non-admin", async () => {
      // set up the vesting plan parameters
      const startDate =
        (await time.latest()) + (await Helper.convertToSeconds("days", 1));
      const cliff = await Helper.convertToSeconds("days", 1); // 1 day cliff86400;
      const duration = await Helper.convertToSeconds("weeks", 1); // 1 week vesting period
      const revocable = true;

      const poolName = ethers.utils.formatBytes32String("Sale");
      const initialReleasePercentage = 5000;

      // try to create the vesting plan and expect it to revert
      await expect(
        lrtVestingInstance
          .connect(addr1)
          .createVestingPlan(
            startDate,
            cliff,
            duration,
            revocable,
            initialReleasePercentage,
            poolName
          )
      ).to.be.revertedWith(AccessErrorMsg.CALLER_NOT_ADMIN);
    });
  });

  describe("set debt for buying off-chain assets", function () {
    beforeEach(async function () {
      // set up the vesting plan1 parameters
      const startDate1 =
        (await time.latest()) + (await Helper.convertToSeconds("days", 1));
      const cliff1 = await Helper.convertToSeconds("months", 3); // 3 month cliff
      const duration1 = await Helper.convertToSeconds("months", 48); // 48 month vesting period
      const revocable1 = true;
      const poolName1 = ethers.utils.formatBytes32String("Sale");
      const initialReleasePercentage = 5000;

      // create the vesting plan
      await lrtVestingInstance
        .connect(admin)
        .createVestingPlan(
          startDate1,
          cliff1,
          duration1,
          revocable1,
          initialReleasePercentage,
          poolName1
        );

      // set up the vesting plan2 parameters
      const startDate2 =
        (await time.latest()) + (await Helper.convertToSeconds("days", 1));
      const cliff2 = await Helper.convertToSeconds("months", 3); // 3 month cliff
      const duration2 = await Helper.convertToSeconds("months", 48); // 48 month vesting period
      const revocable2 = false;
      const poolName2 = ethers.utils.formatBytes32String("Game");

      // create the vesting plan
      await lrtVestingInstance
        .connect(admin)
        .createVestingPlan(
          startDate2,
          cliff2,
          duration2,
          revocable2,
          initialReleasePercentage,
          poolName1
        );

      //create vesting schedules addr1
      const vestingAmount1 = ethers.utils.parseUnits("10");
      const planId1 = 0;
      const planId2 = 1;

      const vestingStartDate1 =
        (await time.latest()) + (await Helper.convertToSeconds("days", 2)); // Start date 1 day from now
      await lrtVestingInstance
        .connect(admin)
        .createVesting(
          addr1.address,
          vestingStartDate1,
          vestingAmount1,
          planId1
        );

      //create vesting2 schedules addr1
      const vestingAmount2 = ethers.utils.parseUnits("10");
      const vestingStartDate2 =
        (await time.latest()) + (await Helper.convertToSeconds("days", 2));
      await lrtVestingInstance
        .connect(admin)
        .createVesting(
          addr1.address,
          vestingStartDate2,
          vestingAmount2,
          planId1
        );

      //create vesting3 schedules addr1
      const vestingAmount3 = ethers.utils.parseUnits("10");
      const vestingStartDate3 =
        (await time.latest()) + (await Helper.convertToSeconds("days", 3));
      await lrtVestingInstance
        .connect(admin)
        .createVesting(
          addr1.address,
          vestingStartDate3,
          vestingAmount3,
          planId2
        );
    });
    it("should set debt when debt amount smaller than one vesting amount", async () => {
      const debt = ethers.utils.parseUnits("5");
      const oldTotalVestingAmount =
        await lrtVestingInstance.totalVestingAmount();

      const tx = await lrtVestingInstance
        .connect(approvedContract)
        .setDebt(addr1.address, debt);
      const newTotalVestingAmount =
        await lrtVestingInstance.totalVestingAmount();

      let holderStat = await lrtVestingInstance.holdersStat(addr1.address);
      expect(holderStat.claimedAmount).to.equal(ethers.utils.parseUnits("5"));
      expect(newTotalVestingAmount).to.equal(oldTotalVestingAmount.sub(debt));

      await expect(tx)
        .to.emit(lrtVestingInstance, "DebtCreated")
        .withArgs(debt, addr1.address);
    });

    it("should set debt when debt amount grater than one vesting amount", async () => {
      const debt = ethers.utils.parseUnits("23");
      const oldTotalVestingAmount =
        await lrtVestingInstance.totalVestingAmount();
      const planId1 = 0;
      const planId2 = 1;
      const tx = await lrtVestingInstance
        .connect(approvedContract)
        .setDebt(addr1.address, debt);
      const newTotalVestingAmount =
        await lrtVestingInstance.totalVestingAmount();

      let holderStat = await lrtVestingInstance.holdersStat(addr1.address);
      expect(holderStat.claimedAmount).to.equal(ethers.utils.parseUnits("23"));
      expect(newTotalVestingAmount).to.equal(oldTotalVestingAmount.sub(debt));

      let schedules1 = await lrtVestingInstance.userVestings(
        addr1.address,
        planId1,
        0
      );

      let schedules2 = await lrtVestingInstance.userVestings(
        addr1.address,
        planId1,
        1
      );

      let schedules3 = await lrtVestingInstance.userVestings(
        addr1.address,
        planId2,
        0
      );

      expect(schedules1.claimedAmount).to.equal(ethers.utils.parseUnits("10"));
      expect(schedules2.claimedAmount).to.equal(ethers.utils.parseUnits("10"));
      expect(schedules3.claimedAmount).to.equal(ethers.utils.parseUnits("3"));

      await expect(tx)
        .to.emit(lrtVestingInstance, "DebtCreated")
        .withArgs(debt, addr1.address);
    });

    it("should revert if called by non-approved contract ", async () => {
      const debt = ethers.utils.parseUnits("5");
      await expect(
        lrtVestingInstance.connect(addr1).setDebt(addr1.address, debt)
      ).to.be.revertedWith(
        AccessErrorMsg.CALLER_NOT_ADMIN_OR_APPROVED_CONTRACT
      );
    });

    it("should revert if beneficiary by zero address ", async () => {
      const debt = ethers.utils.parseUnits("5");
      const zeroAddress = "0x0000000000000000000000000000000000000000";

      await expect(
        lrtVestingInstance.connect(approvedContract).setDebt(zeroAddress, debt)
      ).to.be.revertedWith(LRTVestingErrorMsg.NOT_VALID_ADDRESS);
    });

    it("should revert if debt amount limit exceed ", async () => {
      const debt = ethers.utils.parseUnits("40");

      await expect(
        lrtVestingInstance
          .connect(approvedContract)
          .setDebt(addr1.address, debt)
      ).to.be.revertedWith(LRTVestingErrorMsg.DEBT_LIMIT_EXCEED);
    });
  });

  describe("create vesting schedule for a user", function () {
    beforeEach(async function () {
      // set up the vesting plan parameters
      const startDate =
        (await time.latest()) + (await Helper.convertToSeconds("days", 1));
      const cliff = await Helper.convertToSeconds("days", 1); // 1 day cliff86400;
      const duration = await Helper.convertToSeconds("weeks", 1); // 1 week vesting period
      const revocable = true;
      const poolName = ethers.utils.formatBytes32String("Sale");

      const initialReleasePercentage = 5000;

      // create the vesting plan
      await lrtVestingInstance
        .connect(admin)
        .createVestingPlan(
          startDate,
          cliff,
          duration,
          revocable,
          initialReleasePercentage,
          poolName
        );
    });

    it("should create a vesting schedule for a user", async function () {
      const amount = ethers.utils.parseUnits("10");
      const planId = 0;
      const startDate =
        (await time.latest()) + (await Helper.convertToSeconds("days", 1));

      // Number(
      //   await Helper.timeInitial(
      //     TimeEnumes.seconds,
      //     await Helper.convertToSeconds("days", 2)
      //   )
      // ); // Start date 1 day from now
      const tx = await lrtVestingInstance
        .connect(admin)
        .createVesting(addr1.address, startDate, amount, planId);

      let schedules = await lrtVestingInstance.userVestings(
        addr1.address,
        planId,
        0
      );

      let holderStat = await lrtVestingInstance.holdersStat(addr1.address);

      //check holder stat
      expect(holderStat.vestingAmount).to.equal(amount);
      expect(holderStat.vestingCount).to.equal(1);
      expect(holderStat.claimedAmount).to.equal(0);
      expect(schedules.totalAmount).to.equal(amount);
      expect(schedules.claimedAmount).to.equal(0);
      expect(schedules.startDate).to.equal(startDate);
      expect(schedules.unlockDate).to.equal(
        startDate + (await Helper.convertToSeconds("days", 1))
      );
      expect(schedules.endDate).to.equal(
        startDate + (await Helper.convertToSeconds("weeks", 1))
      );

      const totalAmount = await lrtVestingInstance.totalVestingAmount();
      expect(totalAmount).to.equal(amount);

      await expect(tx)
        .to.emit(lrtVestingInstance, "VestingCreated")
        .withArgs(
          planId,
          addr1.address,
          schedules.startDate,
          schedules.unlockDate,
          schedules.endDate,
          amount
        );
    });

    it("should revert if plan does not exist", async function () {
      const amount = ethers.utils.parseEther("10");
      const planId = 2;
      const startDate =
        (await time.latest()) + (await Helper.convertToSeconds("days", 2));
      await expect(
        lrtVestingInstance.connect(admin).createVesting(
          addr1.address,
          startDate,
          amount,
          planId // Non-existent plan ID
        )
      ).to.be.revertedWith(LRTVestingErrorMsg.PLAN_IS_NOT_EXIST);
    });

    it("should revert if amount is too low", async function () {
      const amount = ethers.utils.parseEther("0");
      const planId = 0;
      const startDate =
        (await time.latest()) + (await Helper.convertToSeconds("days", 2));
      await expect(
        lrtVestingInstance
          .connect(admin)
          .createVesting(addr1.address, startDate, amount, planId)
      ).to.be.revertedWith(LRTVestingErrorMsg.LOW_AMOUNT);
    });

    it("should revert if beneficiary address is not valid", async function () {
      const amount = ethers.utils.parseEther("10");
      const planId = 0;
      const startDate = Number(
        await Helper.timeInitial(
          TimeEnumes.seconds,
          await Helper.convertToSeconds("days", 1)
        )
      ); // Start date 1 day from now
      const zeroAddress = "0x0000000000000000000000000000000000000000";

      await expect(
        lrtVestingInstance
          .connect(admin)
          .createVesting(zeroAddress, startDate, amount, planId)
      ).to.be.revertedWith(LRTVestingErrorMsg.NOT_VALID_ADDRESS);
    });

    it("should revert if startDate of vesting is lower than plan startDate", async function () {
      const amount = ethers.utils.parseEther("10");
      const planId = 0;
      const startDate = 0; // Start date 1 day from now
      await expect(
        lrtVestingInstance
          .connect(admin)
          .createVesting(addr1.address, startDate, amount, planId)
      ).to.be.revertedWith(LRTVestingErrorMsg.INVALID_START_DATE_VESTING);
    });

    it("should revert if called by non-approvedContract or non-admin", async function () {
      const amount = ethers.utils.parseEther("10");
      const planId = 0;
      const startDate =
        (await time.latest()) + (await Helper.convertToSeconds("days", 2));
      await expect(
        lrtVestingInstance
          .connect(addr1)
          .createVesting(addr1.address, startDate, amount, planId)
      ).to.be.revertedWith(
        AccessErrorMsg.CALLER_NOT_ADMIN_OR_APPROVED_CONTRACT
      );
    });
  });

  describe("claim", function () {
    beforeEach(async function () {
      // set up the vesting plan1 parameters
      const startDate1 =
        (await time.latest()) + (await Helper.convertToSeconds("days", 1));
      const cliff1 = await Helper.convertToSeconds("months", 3); // 3 month cliff
      const duration1 = await Helper.convertToSeconds("months", 48); // 48 month vesting period
      const revocable1 = true;
      const poolName1 = ethers.utils.formatBytes32String("Sale");
      const initialReleasePercentage = 1000; //5000;

      // create the vesting plan
      await lrtVestingInstance
        .connect(admin)
        .createVestingPlan(
          startDate1,
          cliff1,
          duration1,
          revocable1,
          initialReleasePercentage,
          poolName1
        );

      // set up the vesting plan2 parameters
      const startDate2 =
        (await time.latest()) + (await Helper.convertToSeconds("days", 1)); // Start date 1 day from now
      const cliff2 = await Helper.convertToSeconds("months", 3); // 3 month cliff
      const duration2 = await Helper.convertToSeconds("months", 48); // 48 month vesting period
      const revocable2 = false;
      const poolName2 = ethers.utils.formatBytes32String("Game");

      // create the vesting plan
      await lrtVestingInstance
        .connect(admin)
        .createVestingPlan(
          startDate2,
          cliff2,
          duration2,
          revocable2,
          initialReleasePercentage,
          poolName1
        );

      //create vesting schedules addr1
      const vestingAmount1 = ethers.utils.parseUnits("10"); //ethers.utils.parseUnits("10");
      const planId1 = 0;
      const planId2 = 1;

      const vestingStartDate1 =
        (await time.latest()) + (await Helper.convertToSeconds("days", 2)); // Start date 1 day from now
      await lrtVestingInstance
        .connect(admin)
        .createVesting(
          addr1.address,
          vestingStartDate1,
          vestingAmount1,
          planId1
        );

      //create vesting2 schedules addr1
      const vestingAmount2 = ethers.utils.parseUnits("10"); //ethers.utils.parseUnits("10");
      const vestingStartDate2 =
        (await time.latest()) + (await Helper.convertToSeconds("days", 2)); // Start date 2 day from now
      await lrtVestingInstance.connect(admin).createVesting(
        addr1.address,
        vestingStartDate2, //vestingStartDate2,
        vestingAmount2,
        planId1
      );

      //create vesting3 schedules addr1
      const vestingAmount3 = ethers.utils.parseUnits("10");
      const vestingStartDate3 =
        (await time.latest()) + (await Helper.convertToSeconds("days", 3));
      await lrtVestingInstance
        .connect(admin)
        .createVesting(
          addr1.address,
          vestingStartDate3,
          vestingAmount3,
          planId2
        );
    });

    it("should allow claiming all tokens after the vesting period has ended", async function () {
      // Fast forward time to after the vesting period has ended
      const elapsedTime = await Helper.convertToSeconds("months", 49);
      const planId = 0;

      await network.provider.send("evm_increaseTime", [elapsedTime]);
      await network.provider.send("evm_mine");

      const beforeVestedBalance = Number(
        await lrtVestingInstance.totalVestingAmount()
      );

      // Claim tokens and check the result
      const tx = await lrtVestingInstance.connect(addr1).claim(planId);
      // const tx2 = await lrtVestingInstance.connect(addr1).claim(planId);

      let schedules1 = await lrtVestingInstance.userVestings(
        addr1.address,
        planId,
        0
      );
      let schedules2 = await lrtVestingInstance.userVestings(
        addr1.address,
        planId,
        1
      );

      let holderStat = await lrtVestingInstance.holdersStat(addr1.address);
      expect(schedules1.claimedAmount).to.equal(ethers.utils.parseUnits("10"));
      expect(schedules2.claimedAmount).to.equal(ethers.utils.parseUnits("10"));

      const claimedAmount = await lrtInstance.balanceOf(addr1.address);

      expect(holderStat.claimedAmount).to.equal(claimedAmount);

      expect(Number(await lrtVestingInstance.totalVestingAmount())).to.equal(
        beforeVestedBalance - claimedAmount
      );

      await expect(tx)
        .to.emit(lrtVestingInstance, "Claimed")
        .withArgs(planId, claimedAmount, addr1.address);
    });

    it("should allow claiming a portion of tokens after unlock date", async function () {
      // Fast forward time to after the vesting period has ended
      const elapsedTime = await Helper.convertToSeconds("weeks", 4.5); //(await Helper.convertToSeconds("months", 48)) / 2;
      const planId = 0;
      await network.provider.send("evm_increaseTime", [elapsedTime]);
      await network.provider.send("evm_mine");

      const beforeVestedBalance = await lrtVestingInstance.totalVestingAmount();

      // Claim tokens and check the result
      const tx = await lrtVestingInstance.connect(addr1).claim(planId);
      const claimedAmount = await lrtInstance.balanceOf(addr1.address);

      let schedules1 = await lrtVestingInstance.userVestings(
        addr1.address,
        planId,
        0
      );
      let schedules2 = await lrtVestingInstance.userVestings(
        addr1.address,
        planId,
        1
      );

      expect(claimedAmount).to.be.gt(0);

      await expect(tx)
        .to.emit(lrtVestingInstance, "Claimed")
        .withArgs(planId, claimedAmount, addr1.address);
    });

    it("should allow claiming a portion of tokens after unlock date with audit senario", async function () {
      // set up the vesting plan1 parameters
      const startDate1 =
        (await time.latest()) + (await Helper.convertToSeconds("days", 1));
      const cliff1 = await Helper.convertToSeconds("weeks", 1); // 3 month cliff
      const duration1 = await Helper.convertToSeconds("weeks", 10); // 48 month vesting period
      const revocable1 = true;
      const poolName1 = ethers.utils.formatBytes32String("Game");
      const initialReleasePercentage = 1000;
      // create the vesting plan
      await lrtVestingInstance
        .connect(admin)
        .createVestingPlan(
          startDate1,
          cliff1,
          duration1,
          revocable1,
          initialReleasePercentage,
          poolName1
        );
      //create vesting schedules addr1
      const vestingAmount1 = ethers.utils.parseUnits("10");
      // const planId1 = 0;
      const planId2 = 2;

      const vestingStartDate1 =
        (await time.latest()) + (await Helper.convertToSeconds("days", 2)); // Start date 1 day from now
      await lrtVestingInstance
        .connect(admin)
        .createVesting(
          addr2.address,
          vestingStartDate1,
          vestingAmount1,
          planId2
        );
      await lrtVestingInstance
        .connect(admin)
        .createVesting(
          addr2.address,
          vestingStartDate1,
          vestingAmount1,
          planId2
        );
      await lrtVestingInstance
        .connect(approvedContract)
        .setDebt(addr2.address, ethers.utils.parseUnits("10"));

      // Fast forward time to after the vesting period has ended
      const elapsedTime = await Helper.convertToSeconds("weeks", 4.5);
      const planId = 2;

      await network.provider.send("evm_increaseTime", [elapsedTime]);
      await network.provider.send("evm_mine");

      // Claim tokens and check the result
      const tx = await lrtVestingInstance.connect(addr2).claim(planId);
      const claimedAmount = await lrtInstance.balanceOf(addr2.address);

      // Fast forward time to after the vesting period has ended
      const elapsedTime3 = await Helper.convertToSeconds("weeks", 4.5);
      await network.provider.send("evm_increaseTime", [elapsedTime3]);
      await network.provider.send("evm_mine");

      const tx2 = await lrtVestingInstance.connect(addr2).claim(planId);
      const claimedAmount2 = await lrtInstance.balanceOf(addr2.address);

      // Fast forward time to after the vesting period has ended
      const elapsedTime4 = await Helper.convertToSeconds("weeks", 0.5);
      await network.provider.send("evm_increaseTime", [elapsedTime3]);
      await network.provider.send("evm_mine");

      const tx3 = await lrtVestingInstance.connect(addr2).claim(planId);
      const claimedAmount3 = await lrtInstance.balanceOf(addr2.address);

      let schedules1 = await lrtVestingInstance.userVestings(
        addr2.address,
        planId,
        0
      );

      let schedules2 = await lrtVestingInstance.userVestings(
        addr2.address,
        planId,
        1
      );

      expect(claimedAmount).to.be.gt(0);

      await expect(tx)
        .to.emit(lrtVestingInstance, "Claimed")
        .withArgs(planId, claimedAmount, addr2.address);
    });

    it("should allow claim initial release amount when current time between start date and unlock date", async function () {
      // Fast forward time to after the vesting period has ended
      const elapsedTime = await Helper.convertToSeconds("months", 2);
      const planId = 0;

      await network.provider.send("evm_increaseTime", [elapsedTime]);
      await network.provider.send("evm_mine");

      const beforeVestedBalance = Number(
        await lrtVestingInstance.totalVestingAmount()
      );

      // Claim tokens and check the result
      const tx = await lrtVestingInstance.connect(addr1).claim(planId);
      // const tx2 = await lrtVestingInstance.connect(addr1).claim(planId);

      let schedules1 = await lrtVestingInstance.userVestings(
        addr1.address,
        planId,
        0
      );
      let schedules2 = await lrtVestingInstance.userVestings(
        addr1.address,
        planId,
        1
      );

      let totalVestingAmount = schedules1.totalAmount.add(
        schedules2.totalAmount
      );

      const initialRelease = totalVestingAmount.mul(5000).div(10000);

      let holderStat = await lrtVestingInstance.holdersStat(addr1.address);
      expect(schedules1.claimedAmount).to.equal(ethers.utils.parseUnits("1"));
      expect(schedules2.claimedAmount).to.equal(ethers.utils.parseUnits("1"));

      const claimedAmount = await lrtInstance.balanceOf(addr1.address);

      expect(holderStat.claimedAmount).to.equal(claimedAmount);

      expect(Number(await lrtVestingInstance.totalVestingAmount())).to.equal(
        beforeVestedBalance - claimedAmount
      );

      await expect(tx)
        .to.emit(lrtVestingInstance, "Claimed")
        .withArgs(planId, claimedAmount, addr1.address);
    });

    it("should allow claiming a portion of tokens after unlock date with audit senario (revoke a plan before setDept)", async function () {
      // set up the vesting plan1 parameters
      const startDate1 =
        (await time.latest()) + (await Helper.convertToSeconds("days", 1));
      const cliff1 = await Helper.convertToSeconds("weeks", 1); // 3 month cliff
      const duration1 = await Helper.convertToSeconds("weeks", 10); // 48 month vesting period
      const revocable1 = true;
      const poolName1 = ethers.utils.formatBytes32String("Game");
      const initialReleasePercentage = 1000;
      // create the vesting plan
      await lrtVestingInstance
        .connect(admin)
        .createVestingPlan(
          startDate1,
          cliff1,
          duration1,
          revocable1,
          initialReleasePercentage,
          poolName1
        );

      await lrtVestingInstance
        .connect(admin)
        .createVestingPlan(
          startDate1,
          cliff1,
          duration1,
          revocable1,
          initialReleasePercentage,
          poolName1
        );
      //create vesting schedules addr1
      const vestingAmount1 = ethers.utils.parseUnits("10");
      // const planId1 = 0;
      const planId2 = 2;

      const vestingStartDate1 =
        (await time.latest()) + (await Helper.convertToSeconds("days", 2)); // Start date 1 day from now
      await lrtVestingInstance
        .connect(admin)
        .createVesting(
          addr2.address,
          vestingStartDate1,
          vestingAmount1,
          planId2
        );
      await lrtVestingInstance
        .connect(admin)
        .createVesting(
          addr2.address,
          vestingStartDate1,
          vestingAmount1,
          planId2
        );

      await lrtVestingInstance
        .connect(admin)
        .createVesting(addr2.address, vestingStartDate1, vestingAmount1, 3);

      // Fast forward time to after the vesting period has ended
      const elapsedTime = await Helper.convertToSeconds("weeks", 4.5);
      const planId = 2;

      await network.provider.send("evm_increaseTime", [elapsedTime]);
      await network.provider.send("evm_mine");

      const holdersVesting = await lrtVestingInstance.userVestings(
        addr2.address,
        3,
        0
      );

      await lrtVestingInstance.connect(admin).revoke(addr2.address, 3);
      const claimedAmountAfterRevoke = await lrtInstance.balanceOf(
        addr2.address
      );

      await lrtVestingInstance
        .connect(approvedContract)
        .setDebt(addr2.address, ethers.utils.parseUnits("25"));

      await expect(
        lrtVestingInstance.connect(addr2).claim(2)
      ).to.be.revertedWith(LRTVestingErrorMsg.ZERO_CLAIMABLE_AMOUNT);

      await expect(
        lrtVestingInstance.connect(addr2).claim(3)
      ).to.be.revertedWith(LRTVestingErrorMsg.REVOKED_BEFORE);
    });

    it("should allow claim initial release amount when current time between start date and unlock date", async function () {
      // Fast forward time to after the vesting period has ended
      const elapsedTime = await Helper.convertToSeconds("months", 2);
      const planId = 0;

      await network.provider.send("evm_increaseTime", [elapsedTime]);
      await network.provider.send("evm_mine");

      const beforeVestedBalance = Number(
        await lrtVestingInstance.totalVestingAmount()
      );

      // Claim tokens and check the result
      const tx = await lrtVestingInstance.connect(addr1).claim(planId);
      // const tx2 = await lrtVestingInstance.connect(addr1).claim(planId);

      let schedules1 = await lrtVestingInstance.userVestings(
        addr1.address,
        planId,
        0
      );
      let schedules2 = await lrtVestingInstance.userVestings(
        addr1.address,
        planId,
        1
      );

      let totalVestingAmount = schedules1.totalAmount.add(
        schedules2.totalAmount
      );

      const initialRelease = totalVestingAmount.mul(5000).div(10000);

      let holderStat = await lrtVestingInstance.holdersStat(addr1.address);
      expect(schedules1.claimedAmount).to.equal(ethers.utils.parseUnits("1"));
      expect(schedules2.claimedAmount).to.equal(ethers.utils.parseUnits("1"));

      const claimedAmount = await lrtInstance.balanceOf(addr1.address);

      expect(holderStat.claimedAmount).to.equal(claimedAmount);

      expect(Number(await lrtVestingInstance.totalVestingAmount())).to.equal(
        beforeVestedBalance - claimedAmount
      );

      await expect(tx)
        .to.emit(lrtVestingInstance, "Claimed")
        .withArgs(planId, claimedAmount, addr1.address);
    });

    it("should not allow claiming if called by non-beneficiary", async function () {
      // Fast forward time to after the vesting period has ended
      const elapsedTime = (await Helper.convertToSeconds("months", 48)) / 2;

      await network.provider.send("evm_increaseTime", [elapsedTime]);
      await network.provider.send("evm_mine");
      // Claim tokens and check the result
      await expect(
        lrtVestingInstance.connect(owner).claim(0)
      ).to.be.revertedWith(LRTVestingErrorMsg.NO_VESTING);
    });

    it("should not allow claiming tokens before start date", async function () {
      // Claim tokens and check the result
      await expect(
        lrtVestingInstance.connect(addr1).claim(0)
      ).to.be.revertedWith(LRTVestingErrorMsg.ZERO_CLAIMABLE_AMOUNT);
    });
  });

  describe("revoke", function () {
    beforeEach(async function () {
      // set up the vesting plan1 parameters
      const startDate1 =
        (await time.latest()) + (await Helper.convertToSeconds("days", 1));
      const cliff1 = await Helper.convertToSeconds("months", 3); // 3 month cliff
      const duration1 = await Helper.convertToSeconds("months", 48); // 48 month vesting period
      const revocable1 = true;
      const poolName1 = ethers.utils.formatBytes32String("Sale");
      const initialReleasePercentage = 5000;

      // create the vesting plan
      await lrtVestingInstance
        .connect(admin)
        .createVestingPlan(
          startDate1,
          cliff1,
          duration1,
          revocable1,
          initialReleasePercentage,
          poolName1
        );

      // set up the vesting plan2 parameters
      const startDate2 =
        (await time.latest()) + (await Helper.convertToSeconds("days", 1));
      const cliff2 = await Helper.convertToSeconds("months", 3); // 3 month cliff
      const duration2 = await Helper.convertToSeconds("months", 48); // 48 month vesting period
      const revocable2 = false;
      const poolName2 = ethers.utils.formatBytes32String("Game");

      // create the vesting plan
      await lrtVestingInstance
        .connect(admin)
        .createVestingPlan(
          startDate2,
          cliff2,
          duration2,
          revocable2,
          initialReleasePercentage,
          poolName1
        );

      //create vesting schedules addr1
      const vestingAmount1 = ethers.utils.parseUnits("10");
      const planId1 = 0;
      const planId2 = 1;

      const vestingStartDate1 =
        (await time.latest()) + (await Helper.convertToSeconds("days", 2)); // Start date 1 day from now
      await lrtVestingInstance
        .connect(admin)
        .createVesting(
          addr1.address,
          vestingStartDate1,
          vestingAmount1,
          planId1
        );

      //create vesting2 schedules addr1
      const vestingAmount2 = ethers.utils.parseUnits("10");
      const vestingStartDate2 =
        (await time.latest()) + (await Helper.convertToSeconds("days", 2));
      await lrtVestingInstance
        .connect(admin)
        .createVesting(
          addr1.address,
          vestingStartDate2,
          vestingAmount2,
          planId1
        );

      //create vesting3 schedules addr1
      const vestingAmount3 = ethers.utils.parseUnits("10");
      const vestingStartDate3 =
        (await time.latest()) + (await Helper.convertToSeconds("days", 2));
      await lrtVestingInstance
        .connect(admin)
        .createVesting(
          addr1.address,
          vestingStartDate3,
          vestingAmount3,
          planId2
        );
    });

    it("should allow revoking all tokens after the vesting period has ended", async function () {
      // Fast forward time to after the vesting period has ended
      const elapsedTime = await Helper.convertToSeconds("months", 49);
      const planId = 0;

      await network.provider.send("evm_increaseTime", [elapsedTime]);
      await network.provider.send("evm_mine");

      const beforeVestedBalance = Number(
        await lrtVestingInstance.totalVestingAmount()
      );

      // Claim tokens and check the result
      const tx = await lrtVestingInstance
        .connect(admin)
        .revoke(addr1.address, planId);
      // const tx2 = await lrtVestingInstance.connect(addr1).claim(planId);

      let schedules1 = await lrtVestingInstance.userVestings(
        addr1.address,
        planId,
        0
      );
      let schedules2 = await lrtVestingInstance.userVestings(
        addr1.address,
        planId,
        1
      );

      let holderStat = await lrtVestingInstance.holdersStat(addr1.address);
      expect(schedules1.claimedAmount).to.equal(ethers.utils.parseUnits("10"));
      expect(schedules2.claimedAmount).to.equal(ethers.utils.parseUnits("10"));

      const claimedAmount = await lrtInstance.balanceOf(addr1.address);

      expect(holderStat.claimedAmount).to.equal(claimedAmount);

      expect(Number(await lrtVestingInstance.totalVestingAmount())).to.equal(
        beforeVestedBalance - claimedAmount
      );
      await expect(tx)
        .to.emit(lrtVestingInstance, "Revoked")
        .withArgs(planId, claimedAmount, addr1.address);
    });

    it("should not allow revoking all tokens after revoking a plan recently", async function () {
      const elapsedTime = await Helper.convertToSeconds("months", 49);
      const planId = 0;

      await network.provider.send("evm_increaseTime", [elapsedTime]);
      await network.provider.send("evm_mine");

      const beforeVestedBalance = Number(
        await lrtVestingInstance.totalVestingAmount()
      );

      // Claim tokens and check the result
      const tx = await lrtVestingInstance
        .connect(admin)
        .revoke(addr1.address, planId);
      // const tx2 = await lrtVestingInstance.connect(addr1).claim(planId);

      let schedules1 = await lrtVestingInstance.userVestings(
        addr1.address,
        planId,
        0
      );
      let schedules2 = await lrtVestingInstance.userVestings(
        addr1.address,
        planId,
        1
      );

      let holderStat = await lrtVestingInstance.holdersStat(addr1.address);
      expect(schedules1.claimedAmount).to.equal(ethers.utils.parseUnits("10"));
      expect(schedules2.claimedAmount).to.equal(ethers.utils.parseUnits("10"));

      const claimedAmount = await lrtInstance.balanceOf(addr1.address);

      expect(holderStat.claimedAmount).to.equal(claimedAmount);

      expect(Number(await lrtVestingInstance.totalVestingAmount())).to.equal(
        beforeVestedBalance - claimedAmount
      );
      await expect(
        lrtVestingInstance.connect(admin).revoke(addr1.address, 0)
      ).to.be.revertedWith(LRTVestingErrorMsg.REVOKED_BEFORE);
    });

    it("should allow revoking a portion of tokens during the vesting period", async function () {
      // Fast forward time to after the vesting period has ended
      const elapsedTime = await Helper.convertToSeconds("months", 2);
      const planId = 0;

      await network.provider.send("evm_increaseTime", [elapsedTime]);
      await network.provider.send("evm_mine");

      const beforeVestedBalance = Number(
        await lrtVestingInstance.totalVestingAmount()
      );

      // Claim tokens and check the result
      const tx = await lrtVestingInstance
        .connect(admin)
        .revoke(addr1.address, planId);
      // const tx2 = await lrtVestingInstance.connect(addr1).claim(planId);

      let schedules1 = await lrtVestingInstance.userVestings(
        addr1.address,
        planId,
        0
      );
      let schedules2 = await lrtVestingInstance.userVestings(
        addr1.address,
        planId,
        1
      );

      let totalVestingAmount = schedules1.totalAmount.add(
        schedules2.totalAmount
      );

      const initialRelease = totalVestingAmount.mul(5000).div(10000);

      let holderStat = await lrtVestingInstance.holdersStat(addr1.address);
      expect(schedules1.claimedAmount).to.equal(ethers.utils.parseUnits("5"));
      expect(schedules2.claimedAmount).to.equal(ethers.utils.parseUnits("5"));

      const claimedAmount = await lrtInstance.balanceOf(addr1.address);

      expect(holderStat.claimedAmount).to.equal(claimedAmount);

      expect(Number(await lrtVestingInstance.totalVestingAmount())).to.equal(
        beforeVestedBalance - claimedAmount
      );
      await expect(tx)
        .to.emit(lrtVestingInstance, "Revoked")
        .withArgs(planId, claimedAmount, addr1.address);
    });

    it("should allow revoke initial release amount when current time between start date and unlock date", async function () {
      // Fast forward time to after the vesting period has ended
      const elapsedTime = await Helper.convertToSeconds("months", 2);
      const planId = 0;

      await network.provider.send("evm_increaseTime", [elapsedTime]);
      await network.provider.send("evm_mine");

      const beforeVestedBalance = Number(
        await lrtVestingInstance.totalVestingAmount()
      );

      // Claim tokens and check the result
      const tx = await lrtVestingInstance
        .connect(admin)
        .revoke(addr1.address, planId);
      // const tx2 = await lrtVestingInstance.connect(addr1).claim(planId);

      let schedules1 = await lrtVestingInstance.userVestings(
        addr1.address,
        planId,
        0
      );
      let schedules2 = await lrtVestingInstance.userVestings(
        addr1.address,
        planId,
        1
      );

      let totalVestingAmount = schedules1.totalAmount.add(
        schedules2.totalAmount
      );

      const initialRelease = totalVestingAmount.mul(5000).div(10000);

      let holderStat = await lrtVestingInstance.holdersStat(addr1.address);
      expect(schedules1.claimedAmount).to.equal(ethers.utils.parseUnits("5"));
      expect(schedules2.claimedAmount).to.equal(ethers.utils.parseUnits("5"));

      const claimedAmount = await lrtInstance.balanceOf(addr1.address);

      expect(holderStat.claimedAmount).to.equal(claimedAmount);

      expect(Number(await lrtVestingInstance.totalVestingAmount())).to.equal(
        beforeVestedBalance - claimedAmount
      );

      await expect(tx)
        .to.emit(lrtVestingInstance, "Revoked")
        .withArgs(planId, claimedAmount, addr1.address);
    });

    it("should not allow revoking if called by non-owner or admin", async function () {
      const elapsedTime = (await Helper.convertToSeconds("months", 48)) / 2;

      await network.provider.send("evm_increaseTime", [elapsedTime]);
      await network.provider.send("evm_mine");
      // revoke tokens and check the result
      await expect(
        lrtVestingInstance.connect(addr1).revoke(addr1.address, 0)
      ).to.be.revertedWith(AccessErrorMsg.CALLER_NOT_ADMIN);
    });

    it("should revert if revoke address is not valid", async function () {
      const elapsedTime = (await Helper.convertToSeconds("months", 48)) / 2;
      const zeroAddress = "0x0000000000000000000000000000000000000000";

      await network.provider.send("evm_increaseTime", [elapsedTime]);
      await network.provider.send("evm_mine");
      // revoke tokens and check the result
      await expect(
        lrtVestingInstance.connect(admin).revoke(zeroAddress, 0)
      ).to.be.revertedWith(LRTVestingErrorMsg.NOT_VALID_ADDRESS);
    });

    it("should not allow revoking tokens before unlockDate", async function () {
      // Revoke tokens and check the result
      await expect(
        lrtVestingInstance.connect(admin).revoke(addr1.address, 0)
      ).to.be.revertedWith(LRTVestingErrorMsg.ZERO_CLAIMABLE_AMOUNT);
    });

    it("should not allow revoking tokens unrevocable plan", async function () {
      await expect(
        lrtVestingInstance.connect(admin).revoke(addr1.address, 2)
      ).to.be.revertedWith(LRTVestingErrorMsg.NOT_REVOCABLE);
    });

    it("should not allow claiming if dose not exist any vesting", async function () {
      // Fast forward time to after the vesting period has ended
      const elapsedTime = (await Helper.convertToSeconds("months", 48)) / 2;

      await network.provider.send("evm_increaseTime", [elapsedTime]);
      await network.provider.send("evm_mine");
      // Claim tokens and check the result
      await expect(
        lrtVestingInstance.connect(admin).revoke(admin.address, 0)
      ).to.be.revertedWith(LRTVestingErrorMsg.NO_VESTING);
    });
  });
});
