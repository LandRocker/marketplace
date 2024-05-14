const { expect } = require("chai");
const Math = require("./helper/math");

const {
  time,
  loadFixture,
} = require("@nomicfoundation/hardhat-network-helpers");
const { lrtDistributorFixture } = require("./fixture");
const { AccessErrorMsg, LRTDistroErrorMsg } = require("./messages");
const ether = require("@openzeppelin/test-helpers/src/ether");
const { ethers } = require("hardhat");

describe("LRTDistributor contract", function () {
  let lrtDistributorInstance,
    lrtInstance,
    arInstance,
    owner,
    admin,
    distributor,
    approvedContract,
    script,
    addr1,
    addr2;
  const zeroAddress = "0x0000000000000000000000000000000000000000";

  beforeEach(async function () {
    ({
      lrtDistributorInstance,
      lrtInstance,
      arInstance,
      owner,
      admin,
      distributor,
      approvedContract,
      script,
      addr1,
      addr2,
    } = await loadFixture(lrtDistributorFixture));
  });

  describe("distribute tokens", function () {
    it("should allow to distribute token", async function () {
      const oldPoolUsedBalance = await lrtDistributorInstance.usedLiquidity(
        ethers.utils.formatBytes32String("Sale")
      );
      const amount = ethers.utils.parseUnits("100", 18);
      const tx = await lrtDistributorInstance
        .connect(approvedContract)
        .distribute(
          ethers.utils.formatBytes32String("Sale"),
          amount,
          addr1.address
        );
      expect(await lrtInstance.balanceOf(addr1.address)).to.equal(amount);
      await expect(tx)
        .to.emit(lrtDistributorInstance, "TokenDistributed")
        .withArgs(
          ethers.utils.formatBytes32String("Sale"),
          amount,
          addr1.address
        );
      const newPoolUsedBalance = await lrtDistributorInstance.usedLiquidity(
        ethers.utils.formatBytes32String("Sale")
      );
      expect(newPoolUsedBalance).to.equal(amount.add(oldPoolUsedBalance));
    });

    it("should not allow to distribute token when caller is not approved contract", async function () {
      const amount = ethers.utils.parseUnits("100", 18);

      await expect(
        lrtDistributorInstance
          .connect(owner)
          .distribute(
            ethers.utils.formatBytes32String("Sale"),
            amount,
            addr1.address
          )
      ).to.be.revertedWith(AccessErrorMsg.CALLER_NOT_APPROVED_CONTRACT);
    });

    it("should not allow to distribute when th liquidity pool is over", async function () {
      const amount = ethers.utils.parseUnits("100", 18);
      await lrtDistributorInstance
        .connect(approvedContract)
        .distribute(
          ethers.utils.formatBytes32String("Sale"),
          amount,
          addr1.address
        );

      const amount2 = ethers.utils.parseUnits("100000000000000000000", 18);

      await expect(
        lrtDistributorInstance
          .connect(approvedContract)
          .distribute(
            ethers.utils.formatBytes32String("Sale"),
            amount2,
            addr1.address
          )
      ).to.be.revertedWith(LRTDistroErrorMsg.POOL_INSUFFICIENT_BALANCE);
    });

    it("should not allow to distribute when the dest address is zero address", async function () {
      const amount = ethers.utils.parseUnits("100", 18);
     

      await expect(
        lrtDistributorInstance
          .connect(approvedContract)
          .distribute(
            ethers.utils.formatBytes32String("Sale"),
            amount,
            zeroAddress
          )
      ).to.be.revertedWith(LRTDistroErrorMsg.INVALID_ADDRESS);
    });

      it("should not allow to distribute when the dest address is distributor address", async function () {
        const amount = ethers.utils.parseUnits("100", 18);

        await expect(
          lrtDistributorInstance
            .connect(approvedContract)
            .distribute(
              ethers.utils.formatBytes32String("Sale"),
              amount,
              lrtDistributorInstance.address
            )
        ).to.be.revertedWith(LRTDistroErrorMsg.NOT_VALID_DESTINATION);
      });
  });

  describe("swap tokens", function () {
    it("should allow to swap token by script", async function () {
      const oldPoolUsedBalance = await lrtDistributorInstance.usedLiquidity(
        ethers.utils.formatBytes32String("Game")
      );
      const amount = ethers.utils.parseUnits("100", 18);
      const tx = await lrtDistributorInstance
        .connect(script)
        .swap(addr1.address, amount);
      expect(await lrtInstance.balanceOf(addr1.address)).to.equal(amount);
      await expect(tx)
        .to.emit(lrtDistributorInstance, "TokenSwapped")
        .withArgs(addr1.address, amount);
      const newPoolUsedBalance = await lrtDistributorInstance.usedLiquidity(
        ethers.utils.formatBytes32String("Game")
      );
      expect(newPoolUsedBalance).to.equal(amount.add(oldPoolUsedBalance));
    });

    it("should not allow to swap token when caller is not script", async function () {
      const amount = ethers.utils.parseUnits("100", 18);

      await expect(
        lrtDistributorInstance.connect(owner).swap(addr1.address, amount)
      ).to.be.revertedWith(AccessErrorMsg.CALLER_NOT_SCRIPT);
    });

    it("should not allow to swap token dest address is zero address", async function () {
      const amount = ethers.utils.parseUnits("100", 18);

      await expect(
        lrtDistributorInstance.connect(script).swap(zeroAddress, amount)
      ).to.be.revertedWith(LRTDistroErrorMsg.INVALID_ADDRESS);
    });

      it("should not allow to swap token dest address is distributor address", async function () {
        const amount = ethers.utils.parseUnits("100", 18);

        await expect(
          lrtDistributorInstance
            .connect(script)
            .swap(lrtDistributorInstance.address, amount)
        ).to.be.revertedWith(LRTDistroErrorMsg.NOT_VALID_DESTINATION);
      });

    it("should not allow to swap when the liquidity pool is over", async function () {
      const amount = ethers.utils.parseUnits("100", 18);
      await lrtDistributorInstance.connect(script).swap(addr1.address, amount);

      const amount2 = ethers.utils.parseUnits("100000000000000000000", 18);

      await expect(
        lrtDistributorInstance.connect(script).swap(addr1.address, amount2)
      ).to.be.revertedWith(LRTDistroErrorMsg.POOL_INSUFFICIENT_BALANCE);
    });
  });

  describe("transfer liquidity to game incentive pool", function () {
    it("should allow to transfer liquidity to game pool by admin", async function () {
      fromPoolName = ethers.utils.formatBytes32String("Sale");
      destPoolName = ethers.utils.formatBytes32String("Game");

      const amount = ethers.utils.parseUnits("1000", 18);
      await lrtDistributorInstance
        .connect(approvedContract)
        .distribute(fromPoolName, amount, addr1.address);

      const fromUsedBalance = await lrtDistributorInstance.usedLiquidity(
        fromPoolName
      );
      const fromLiquidityBalance = await lrtDistributorInstance.poolLiquidity(
        fromPoolName
      );

      const DestLiquidityBalance = await lrtDistributorInstance.poolLiquidity(
        destPoolName
      );

      const remainingToken = fromLiquidityBalance.sub(fromUsedBalance);
      const tx = await lrtDistributorInstance
        .connect(admin)
        .transferLiquidity(fromPoolName);
      await expect(tx)
        .to.emit(lrtDistributorInstance, "TransferredLiquidity")
        .withArgs(fromPoolName, destPoolName, remainingToken);

      const newDestLiquidityBalance =
        await lrtDistributorInstance.poolLiquidity(destPoolName);

      const newFromPoolLiquidityBalance =
        await lrtDistributorInstance.poolLiquidity(fromPoolName);
      expect(newFromPoolLiquidityBalance).to.equal(
        fromLiquidityBalance.sub(remainingToken)
      );

      expect(newDestLiquidityBalance).to.equal(
        DestLiquidityBalance.add(remainingToken)
      );
    });

    it("should not allow to swap token when caller is not admin", async function () {
      fromPoolName = ethers.utils.formatBytes32String("Sale");

      await expect(
        lrtDistributorInstance.connect(owner).transferLiquidity(fromPoolName)
      ).to.be.revertedWith(AccessErrorMsg.CALLER_NOT_ADMIN);
    });
  });
});
