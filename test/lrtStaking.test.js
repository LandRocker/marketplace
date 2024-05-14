const { expect, util } = require("chai");
const {
  time,
  loadFixture,
} = require("@nomicfoundation/hardhat-network-helpers");

const {
  MarketplaceErrorMsg,
  PlanetStakeErrorMsg,
  AccessErrorMsg,
  LRTVestingErrorMsg,
  LRTStakingErrorMsg,
} = require("./messages");
const { ethers } = require("hardhat");

const Math = require("./helper/math");
const Helper = require("./helper");
const { lrtStakingFixture } = require("./fixture/lrtStaking.fixture");

const nativeCoinAddress = "0x0000000000000000000000000000000000000001";
const zeroAddress = "0x0000000000000000000000000000000000000000";
describe("lrtStaking", function () {
  let lrtStakingInstance,
    lrtInstance,
    arInstance,
    owner,
    admin,
    distributor,
    approvedContract,
    script,
    addr1,
    addr2,
    treasury;

  before(async function () {
    ({
      lrtStakingInstance,
      lrtInstance,
      arInstance,
      owner,
      admin,
      distributor,
      approvedContract,
      script,
      addr1,
      addr2,
      treasury,
    } = await loadFixture(lrtStakingFixture));
  });

  describe("test setting APR", function () {
    it("should allow setting apr", async function () {
      const duration = 1;
      const apr = 5000;
      const tx = await lrtStakingInstance.connect(admin).setAPR(duration, apr);
      await expect(tx)
        .to.emit(lrtStakingInstance, "UpdatedAPR")
        .withArgs(duration, apr);
      const expectedAPR = await lrtStakingInstance.APRs(duration);
      expect(expectedAPR).to.equal(apr);
    });

    it("should not setting apr if caller is not admin", async function () {
      const duration = 1;
      const apr = 5000;
      await expect(
        lrtStakingInstance.connect(addr1).setAPR(duration, apr)
      ).to.be.revertedWith(AccessErrorMsg.CALLER_NOT_ADMIN);
    });

    it("should not setting apr if duration is invalid", async function () {
      const duration = 13;
      const apr = 5000;
      await expect(
        lrtStakingInstance.connect(addr1).setAPR(duration, apr)
      ).to.be.revertedWith(LRTStakingErrorMsg.INVALID_DURATION);
    });
  });

  describe("test stake", function () {
    beforeEach(async function () {
      const duration1 = 3;
      const apr1 = 5000;
      const tx = await lrtStakingInstance
        .connect(admin)
        .setAPR(duration1, apr1);
      await expect(tx)
        .to.emit(lrtStakingInstance, "UpdatedAPR")
        .withArgs(duration1, apr1);
      const expectedAPR = await lrtStakingInstance.APRs(duration1);
      expect(expectedAPR).to.equal(apr1);

      const duration2 = 9;
      const apr2 = 7000;
      await lrtStakingInstance.connect(admin).setAPR(duration2, apr2);
    });

    it("should allow staking LRT tokens", async function () {
      const amount = ethers.utils.parseUnits("20");
      const duration = 3;

      await lrtInstance
        .connect(distributor)
        .transferToken(addr2.address, ethers.utils.parseUnits("50"));

      await lrtInstance
        .connect(addr2)
        .approve(lrtStakingInstance.address, ethers.utils.parseUnits("40"));

      await lrtStakingInstance.connect(addr2).stake(amount, duration);

      const userStake = await lrtStakingInstance.userStakes(addr2.address, 0);

      const userStat = await lrtStakingInstance.userStat(addr2.address);

      expect(await lrtInstance.balanceOf(lrtStakingInstance.address)).to.equal(
        ethers.utils.parseUnits("20")
      );

      expect(await lrtInstance.balanceOf(addr2.address)).to.equal(
        ethers.utils.parseUnits("30")
      );

      expect(userStake.duration).to.equal(3);
      expect(userStake.apr).to.equal(5000);
      expect(userStake.stakedAmount).to.equal(ethers.utils.parseUnits("20"));
      expect(userStake.claimedAmount).to.equal(0);
      // expect(userStake.rewardAmount).to.equal(ethers.utils.parseUnits("2.5"));

      expect(userStat).to.equal(1);

      const tx = await lrtStakingInstance
        .connect(addr2)
        .stake(amount, duration);

      await expect(tx)
        .to.emit(lrtStakingInstance, "LRTStaked")
        .withArgs(addr2.address, ethers.utils.parseUnits("20"), 3, 1);
    });

    it("should not allow staking when duration is not valid", async function () {
      const amount = ethers.utils.parseUnits("20");
      const duration = 7;

      await lrtInstance
        .connect(distributor)
        .transferToken(addr2.address, ethers.utils.parseUnits("50"));

      await lrtInstance
        .connect(addr2)
        .approve(lrtStakingInstance.address, ethers.utils.parseUnits("40"));

      await expect(
        lrtStakingInstance.connect(addr2).stake(amount, duration)
      ).to.be.revertedWith(LRTStakingErrorMsg.INVALID_DURATION);
    });

    it("should not allow staking when amount is less than threshold", async function () {
      const amount = ethers.utils.parseUnits("2");
      const duration = 3;

      await lrtInstance
        .connect(distributor)
        .transferToken(addr2.address, ethers.utils.parseUnits("50"));

      await lrtInstance
        .connect(addr2)
        .approve(lrtStakingInstance.address, ethers.utils.parseUnits("40"));

      await expect(
        lrtStakingInstance.connect(addr2).stake(amount, duration)
      ).to.be.revertedWith(LRTStakingErrorMsg.INVALID_AMOUNT);
    });

    it("should not allow staking when duration limit is not passed", async function () {
      await lrtStakingInstance
        .connect(admin)
        .setDurationLimit(
          (await time.latest()) - (await Helper.convertToSeconds("weeks", 1))
        );

      const amount = ethers.utils.parseUnits("20");
      const duration = 3;

      await lrtInstance
        .connect(distributor)
        .transferToken(addr2.address, ethers.utils.parseUnits("50"));

      await lrtInstance
        .connect(addr2)
        .approve(lrtStakingInstance.address, ethers.utils.parseUnits("40"));

      await expect(
        lrtStakingInstance.connect(addr2).stake(amount, duration)
      ).to.be.revertedWith(LRTStakingErrorMsg.EXCEED_DURATION_LIMIT);
    });

    it("should not allow staking when amount plus current TVL is more than stake capacity", async function () {
      const amount = ethers.utils.parseUnits("200");
      const duration = 3;

      await lrtInstance
        .connect(distributor)
        .transferToken(addr2.address, ethers.utils.parseUnits("200"));

      await lrtInstance
        .connect(addr2)
        .approve(lrtStakingInstance.address, ethers.utils.parseUnits("200"));

      await expect(
        lrtStakingInstance.connect(addr2).stake(amount, duration)
      ).to.be.revertedWith(LRTStakingErrorMsg.EXCEED_CAPACITY);
    });

    it("should not allow staking when user has not sufficient balance", async function () {
      await lrtStakingInstance
        .connect(admin)
        .setDurationLimit(
          (await time.latest()) + (await Helper.convertToSeconds("weeks", 1))
        );
      const amount = ethers.utils.parseUnits("20");
      const duration = 3;

      await lrtInstance
        .connect(distributor)
        .transferToken(addr2.address, ethers.utils.parseUnits("50"));

      await lrtInstance
        .connect(addr2)
        .approve(lrtStakingInstance.address, ethers.utils.parseUnits("10"));

      await expect(
        lrtStakingInstance.connect(addr2).stake(amount, duration)
      ).to.be.revertedWith(MarketplaceErrorMsg.ALLOWANCE);
    });

    it("should allow staking LRT tokens twice", async function () {
      const amount1 = ethers.utils.parseUnits("20");
      const duration1 = 3;

      const amount2 = ethers.utils.parseUnits("15");
      const duration2 = 9;

      await lrtInstance
        .connect(distributor)
        .transferToken(addr1.address, ethers.utils.parseUnits("60"));

      await lrtInstance
        .connect(addr1)
        .approve(lrtStakingInstance.address, ethers.utils.parseUnits("50"));

      const beforeBalance = await lrtInstance.balanceOf(
        lrtStakingInstance.address
      );

      await lrtStakingInstance.connect(addr1).stake(amount1, duration1);
      await lrtStakingInstance.connect(addr1).stake(amount2, duration2);
      const userStake1 = await lrtStakingInstance.userStakes(addr1.address, 0);
      const userStake2 = await lrtStakingInstance.userStakes(addr1.address, 1);

      const userStat = await lrtStakingInstance.userStat(addr1.address);

      expect(
        Number(await lrtInstance.balanceOf(lrtStakingInstance.address))
      ).to.equal(
        Number(Math.Big(beforeBalance).add(ethers.utils.parseUnits("35")))
      );

      expect(Number(await lrtInstance.balanceOf(addr1.address))).to.equal(
        Number(Math.Big(ethers.utils.parseUnits("25")))
      );
      // first staking
      expect(userStake1.duration).to.equal(3);
      expect(userStake1.apr).to.equal(5000);
      expect(userStake1.stakedAmount).to.equal(ethers.utils.parseUnits("20"));
      expect(userStake1.claimedAmount).to.equal(0);

      // second staking
      expect(userStake2.duration).to.equal(9);
      expect(userStake2.apr).to.equal(7000);
      expect(userStake2.stakedAmount).to.equal(ethers.utils.parseUnits("15"));
      expect(userStake2.claimedAmount).to.equal(0);

      expect(userStat).to.equal(2);
    });
  });

  describe("test unstake", function () {
    beforeEach(async function () {
      await lrtStakingInstance
        .connect(admin)
        .setDurationLimit(
          (await time.latest()) + (await Helper.convertToSeconds("months", 15))
        );

      const duration1 = 3;
      const apr1 = 5000;
      await lrtStakingInstance.connect(admin).setAPR(duration1, apr1);

      const duration2 = 9;
      const apr2 = 7000;
      await lrtStakingInstance.connect(admin).setAPR(duration2, apr2);

      const amount1 = ethers.utils.parseUnits("20");

      const amount2 = ethers.utils.parseUnits("15");

      await lrtInstance
        .connect(distributor)
        .transferToken(addr1.address, ethers.utils.parseUnits("60"));

      await lrtInstance
        .connect(addr1)
        .approve(lrtStakingInstance.address, ethers.utils.parseUnits("50"));

      await lrtStakingInstance.connect(addr1).stake(amount1, duration1);
      await lrtStakingInstance.connect(addr1).stake(amount2, duration2);
    });

    // it("should not allow unstake if contract has not enough balance", async function () {
    //   // Fast forward time to after the staking period has ended
    //   const elapsedTime = await Helper.convertToSeconds("months", 9);
    //   await network.provider.send("evm_increaseTime", [elapsedTime]);
    //   await network.provider.send("evm_mine");

    //   const contract_balance_before = await lrtInstance.balanceOf(
    //     lrtStakingInstance.address
    //   );

    //   console.log(
    //     Number(Math.Big(contract_balance_before)),
    //     "contract_balance"
    //   );

    //   const index1 = 0;
    //   const index2 = 1;
    //   await lrtStakingInstance.connect(addr1).unstake(index1);
    //   await lrtStakingInstance.connect(addr1).unstake(index1);
    //   await lrtStakingInstance.connect(addr1).unstake(index2);
    //   await expect(
    //     lrtStakingInstance.connect(addr1).unstake(index1)
    //   ).to.be.revertedWith(LRTStakingErrorMsg.INSUFFICIENT_CONTRACT_BALANCE);
    // });

    it("should not allow unstake before staking duration date", async function () {
      const index = 0;
      await expect(
        lrtStakingInstance.connect(addr1).unstake(index)
      ).to.be.revertedWith(LRTStakingErrorMsg.STAKING_NOT_FINISHED);
    });

    it("should allow unstake", async function () {
      // Fast forward time to after the staking period has ended
      const elapsedTime = await Helper.convertToSeconds("months", 4);
      await network.provider.send("evm_increaseTime", [elapsedTime]);
      await network.provider.send("evm_mine");

      const index = 0;
      const userStakeBefore1 = await lrtStakingInstance.userStakes(
        addr1.address,
        0
      );
      const userStakeBefore2 = await lrtStakingInstance.userStakes(
        addr1.address,
        1
      );

      const userStat = await lrtStakingInstance.userStat(addr1.address);

      const addr1_balance_before = await lrtInstance.balanceOf(addr1.address);
      const contract_balance_before = await lrtInstance.balanceOf(
        lrtStakingInstance.address
      );

      const tx = await lrtStakingInstance.connect(addr1).unstake(index);

      const addr1_balance_after = await lrtInstance.balanceOf(addr1.address);
      const contract_balance_after = await lrtInstance.balanceOf(
        lrtStakingInstance.address
      );

      const userStakeAfter1 = await lrtStakingInstance.userStakes(
        addr1.address,
        0
      );
      const userStakeAfter2 = await lrtStakingInstance.userStakes(
        addr1.address,
        1
      );

      await expect(tx)
        .to.emit(lrtStakingInstance, "LRTUnStaked")
        .withArgs(addr1.address, 0, ethers.utils.parseUnits("20"));

      expect(userStakeBefore1.stakedAmount).to.equal(
        ethers.utils.parseUnits("20")
      );
      expect(userStakeBefore1.claimedAmount).to.equal(0);

      expect(userStakeAfter1.stakedAmount).to.equal(0);
      expect(userStakeAfter1.claimedAmount).to.equal(0);

      expect(userStakeBefore2.stakedAmount).to.equal(
        ethers.utils.parseUnits("15")
      );
      expect(userStakeBefore2.claimedAmount).to.equal(0);

      expect(userStakeAfter2.stakedAmount).to.equal(
        ethers.utils.parseUnits("15")
      );
      expect(userStakeAfter2.claimedAmount).to.equal(0);

      expect(Number(Math.Big(contract_balance_after))).to.equal(
        Number(
          Math.Big(contract_balance_before).sub(ethers.utils.parseUnits("20"))
        )
      );

      expect(Number(Math.Big(addr1_balance_after))).to.equal(
        Number(
          Math.Big(addr1_balance_before).add(ethers.utils.parseUnits("20"))
        )
      );

      console.log(
        Number(Math.Big(addr1_balance_before)),
        "addr1_balance_before"
      );
      console.log(Number(Math.Big(addr1_balance_after)), "addr1_balance_after");
      console.log(
        Number(Math.Big(contract_balance_before)),
        "contract_balance_before"
      );
      console.log(
        Number(Math.Big(contract_balance_after)),
        "contract_balance_after"
      );
    });

    it("should not allow unstake when staked amount is zero", async function () {
      // Fast forward time to after the staking period has ended
      const elapsedTime = await Helper.convertToSeconds("months", 5);
      await network.provider.send("evm_increaseTime", [elapsedTime]);
      await network.provider.send("evm_mine");

      const index = 1;
      const tx = await lrtStakingInstance.connect(addr1).unstake(index);
      await expect(
        lrtStakingInstance.connect(addr1).unstake(index)
      ).to.be.revertedWith(LRTStakingErrorMsg.NO_STAKING);
    });
  });

  describe("test claim", function () {
    beforeEach(async function () {
      await lrtStakingInstance
        .connect(admin)
        .setDurationLimit(
          (await time.latest()) + (await Helper.convertToSeconds("months", 15))
        );

      const duration1 = 3;
      const apr1 = 5000;
      await lrtStakingInstance.connect(admin).setAPR(duration1, apr1);

      const duration2 = 6;
      const apr2 = 5000;
      await lrtStakingInstance.connect(admin).setAPR(duration2, apr2);

      const duration3 = 9;
      const apr3 = 7000;
      await lrtStakingInstance.connect(admin).setAPR(duration3, apr3);

      const amount1 = ethers.utils.parseUnits("20");
      const amount2 = ethers.utils.parseUnits("60");
      const amount3 = ethers.utils.parseUnits("15");

      await lrtInstance
        .connect(distributor)
        .transferToken(addr1.address, ethers.utils.parseUnits("100"));

      await lrtInstance
        .connect(addr1)
        .approve(lrtStakingInstance.address, ethers.utils.parseUnits("100"));

      await lrtStakingInstance.connect(addr1).stake(amount1, duration1);
      await lrtStakingInstance.connect(addr1).stake(amount2, duration2);
      await lrtStakingInstance.connect(addr1).stake(amount3, duration3);
    });

    it("should allow fully claim", async function () {
      // // Fast forward time to after the staking period has ended
      const elapsedTime = await Helper.convertToSeconds("months", 5);
      await network.provider.send("evm_increaseTime", [elapsedTime]);
      await network.provider.send("evm_mine");
      const index = 0;
      const userStakeBefore = await lrtStakingInstance.userStakes(
        addr1.address,
        0
      );

      expect(userStakeBefore.claimedAmount).to.equal(0);
      expect(userStakeBefore.rewardAmount).to.equal(
        ethers.utils.parseUnits("2.5")
      );

      const addr1_balance_before = await lrtInstance.balanceOf(addr1.address);
      const contract_balance_before = await lrtInstance.balanceOf(
        lrtStakingInstance.address
      );

      const tx = await lrtStakingInstance.connect(addr1).claim(index);

      const addr1_balance_after = await lrtInstance.balanceOf(addr1.address);
      const contract_balance_after = await lrtInstance.balanceOf(
        lrtStakingInstance.address
      );

      const userStakeAfter = await lrtStakingInstance.userStakes(
        addr1.address,
        0
      );

      expect(userStakeAfter.claimedAmount).to.equal(
        ethers.utils.parseUnits("2.5")
      );

      expect(Number(Math.Big(contract_balance_after))).to.equal(
        Number(
          Math.Big(contract_balance_before).sub(ethers.utils.parseUnits("2.5"))
        )
      );

      expect(Number(Math.Big(addr1_balance_after))).to.equal(
        Number(
          Math.Big(addr1_balance_before).add(ethers.utils.parseUnits("2.5"))
        )
      );
    });

    it("should allow claim after 2 months", async function () {
      // Fast forward time to after the staking period has ended
      const elapsedTime = await Helper.convertToSeconds("months", 2);
      await network.provider.send("evm_increaseTime", [elapsedTime]);
      await network.provider.send("evm_mine");
      const index = 1;
      const userStakeBefore = await lrtStakingInstance.userStakes(
        addr1.address,
        0
      );
      const userStakeBefore1 = await lrtStakingInstance.userStakes(
        addr1.address,
        1
      );
      // const userStakeBefore2 = await lrtStakingInstance.userStakes(
      //   addr1.address,
      //   2
      // );
      console.log(userStakeBefore, "userStakeBefore.apr");
      console.log(userStakeBefore1, "userStakeBefore.apr");
      // console.log(userStakeBefore2, "userStakeBefore.apr");
      expect(userStakeBefore.claimedAmount).to.equal(0);
      expect(userStakeBefore.apr).to.equal(5000);

      expect(userStakeBefore.duration).to.equal(6);
      expect(userStakeBefore.rewardAmount).to.equal(
        ethers.utils.parseUnits("15")
      );

      const addr1_balance_before = await lrtInstance.balanceOf(addr1.address);
      const contract_balance_before = await lrtInstance.balanceOf(
        lrtStakingInstance.address
      );

      const tx = await lrtStakingInstance.connect(addr1).claim(index);

      const addr1_balance_after = await lrtInstance.balanceOf(addr1.address);
      const contract_balance_after = await lrtInstance.balanceOf(
        lrtStakingInstance.address
      );

      const userStakeAfter = await lrtStakingInstance.userStakes(
        addr1.address,
        1
      );

      expect(userStakeAfter.claimedAmount).to.equal(
        ethers.utils.parseUnits("5")
      );

      expect(Number(Math.Big(contract_balance_after))).to.equal(
        Number(
          Math.Big(contract_balance_before).sub(ethers.utils.parseUnits("5"))
        )
      );

      expect(Number(Math.Big(addr1_balance_after))).to.equal(
        Number(Math.Big(addr1_balance_before).add(ethers.utils.parseUnits("5")))
      );
    });

    it("should not allow claim when claimed amount is more than reward amount", async function () {
      // Fast forward time to after the staking period has ended
      const elapsedTime = await Helper.convertToSeconds("months", 5);
      await network.provider.send("evm_increaseTime", [elapsedTime]);
      await network.provider.send("evm_mine");
      const index = 0;
      const tx = await lrtStakingInstance.connect(addr1).claim(index);
      await expect(
        lrtStakingInstance.connect(addr1).claim(index)
      ).to.be.revertedWith(LRTStakingErrorMsg.FULLY_CLAIMED);
    });

    it("should allow claim twice: after two then after three months", async function () {
      // Fast forward time to after the staking period has ended
      const elapsedTime = await Helper.convertToSeconds("months", 2);
      await network.provider.send("evm_increaseTime", [elapsedTime]);
      await network.provider.send("evm_mine");
      const index = 2;
      const userStakeBefore1 = await lrtStakingInstance.userStakes(
        addr1.address,
        0
      );
      const userStakeBefore2 = await lrtStakingInstance.userStakes(
        addr1.address,
        1
      );
      const userStakeBefore3 = await lrtStakingInstance.userStakes(
        addr1.address,
        2
      );
      // console.log(userStakeBefore, "userStakeBefore.apr");
      // console.log(userStakeBefore1, "userStakeBefore.apr");
      // console.log(userStakeBefore2, "userStakeBefore.apr");
      expect(userStakeBefore3.claimedAmount).to.equal(0);
      expect(userStakeBefore3.apr).to.equal(7000);
      expect(userStakeBefore3.duration).to.equal(9);
      expect(userStakeBefore3.rewardAmount).to.equal(
        ethers.utils.parseUnits("7.875")
      );

      const addr1_balance_before_first_claim = await lrtInstance.balanceOf(
        addr1.address
      );
      const contract_balance_before_first_claim = await lrtInstance.balanceOf(
        lrtStakingInstance.address
      );

      //Claim for the first time after two months
      const tx = await lrtStakingInstance.connect(addr1).claim(index);

      const addr1_balance_after_first_claim = await lrtInstance.balanceOf(
        addr1.address
      );
      const contract_balance_after_first_claim = await lrtInstance.balanceOf(
        lrtStakingInstance.address
      );

      const userStakeAfterFirstClaim = await lrtStakingInstance.userStakes(
        addr1.address,
        2
      );

      expect(userStakeAfterFirstClaim.claimedAmount).to.equal(
        ethers.utils.parseUnits("1.75")
      );

      expect(Number(Math.Big(contract_balance_after_first_claim))).to.equal(
        Number(
          Math.Big(contract_balance_before_first_claim).sub(
            ethers.utils.parseUnits("1.75")
          )
        )
      );

      expect(Number(Math.Big(addr1_balance_after_first_claim))).to.equal(
        Number(
          Math.Big(addr1_balance_before_first_claim).add(
            ethers.utils.parseUnits("1.75")
          )
        )
      );

      //Claim for the second time after third month
      const elapsedTimeSecond = await Helper.convertToSeconds("months", 1);
      await network.provider.send("evm_increaseTime", [elapsedTimeSecond]);
      await network.provider.send("evm_mine");
      const txSecond = await lrtStakingInstance.connect(addr1).claim(index);

      const addr1_balance_after_second_claim = await lrtInstance.balanceOf(
        addr1.address
      );
      const contract_balance_after_second_claim = await lrtInstance.balanceOf(
        lrtStakingInstance.address
      );

      const userStakeAfterSecondClaim = await lrtStakingInstance.userStakes(
        addr1.address,
        2
      );

      expect(userStakeAfterSecondClaim.claimedAmount).to.equal(
        ethers.utils.parseUnits("2.625")
      );

      expect(Number(Math.Big(contract_balance_after_second_claim))).to.equal(
        Number(
          Math.Big(contract_balance_after_first_claim).sub(
            ethers.utils.parseUnits("0.875")
          )
        )
      );

      expect(Number(Math.Big(addr1_balance_after_second_claim))).to.equal(
        Number(
          Math.Big(addr1_balance_after_first_claim).add(
            ethers.utils.parseUnits("0.875")
          )
        )
      );

      // 2 eligibleMonths
      // 1750000000000000000 availableRewardAmount
      // 1750000000000000000 currentRewardAmount
      // 0 userStake.claimedAmount

      // 3 eligibleMonths
      // 2625000000000000000 availableRewardAmount
      // 875000000000000000 currentRewardAmount
      // 1750000000000000000 userStake.claimedAmount
    });

    // it("should not allow unstake if contract has not enough balance", async function () {
    //   // Fast forward time to after the staking period has ended
    //   const elapsedTime = await Helper.convertToSeconds("months", 9);
    //   await network.provider.send("evm_increaseTime", [elapsedTime]);
    //   await network.provider.send("evm_mine");

    //   const contract_balance_before = await lrtInstance.balanceOf(
    //     lrtStakingInstance.address
    //   );

    //   console.log(
    //     Number(Math.Big(contract_balance_before)),
    //     "contract_balance"
    //   );

    //   const index1 = 0;
    //   const index2 = 1;
    //   await lrtStakingInstance.connect(addr1).unstake(index1);
    //   await lrtStakingInstance.connect(addr1).unstake(index1);
    //   await lrtStakingInstance.connect(addr1).unstake(index2);
    //   await expect(
    //     lrtStakingInstance.connect(addr1).unstake(index1)
    //   ).to.be.revertedWith(LRTStakingErrorMsg.INSUFFICIENT_CONTRACT_BALANCE);
    // });
  });

  //Upgradeability testing
  describe("Contract Version 2 test", function () {
    let oldContract, upgradedContract, owner, addr1;
    beforeEach(async function () {
      [owner, addr1] = await ethers.getSigners(2);

      const LRTStakingUpgraded = await ethers.getContractFactory(
        "LRTStakingUpgraded"
      );

      upgradedContract = await upgrades.upgradeProxy(
        lrtStakingInstance,
        LRTStakingUpgraded,
        {
          call: {
            fn: "initializeLRTStake",
            args: [arInstance.address, lrtInstance.address, "hi I'm upgraded"],
          },
        }
      );
    });

    it("New Contract Should return the old & new greeting and token name after deployment", async function () {
      expect(await upgradedContract.greeting()).to.equal("hi I'm upgraded");
    });
  });
});
