const ethUtil = require("ethereumjs-util");
const sigUtils = require("eth-sig-util");
const { expect, util } = require("chai");

const {
  time,
  loadFixture,
} = require("@nomicfoundation/hardhat-network-helpers");

const {
  MarketplaceErrorMsg,
  AccessErrorMsg,
  AssetMarketplaceErrorMsg,
} = require("./messages");
const { ethers, network, upgrades } = require("hardhat");

const Math = require("./helper/math");
const {
  assetMarketplaceFixture,
} = require("./fixture/assetMarketplace.fixture");
const Helper = require("./helper");
const { createMsgWithSig } = require("./helper/signature");
const ether = require("@openzeppelin/test-helpers/src/ether");

const zeroAddress = "0x0000000000000000000000000000000000000000";

describe("Asset Marketplace contract", function () {
  let assetMarketplaceInstance,
    landRockerInstance,
    lrtVestingInstance,
    lrtInstance,
    arInstance,
    owner,
    admin,
    distributor,
    minter,
    approvedContract,
    script,
    addr1,
    addr2,
    treasury;

  beforeEach(async function () {
    ({
      assetMarketplaceInstance,
      landRockerInstance,
      lrtVestingInstance,
      lrtInstance,
      arInstance,
      owner,
      admin,
      distributor,
      minter,
      approvedContract,
      script,
      addr1,
      addr2,
      treasury,
    } = await loadFixture(assetMarketplaceFixture));
  });

  describe("test withdraw", function () {
    beforeEach(async function () {
      const price = ethers.utils.parseUnits("1");
      const assetName = Helper.stringToBytes16("Ar");
      const listedAmount = 10;
      const expireDate =
        (await time.latest()) + (await Helper.convertToSeconds("weeks", 1));
      const sellUnit = 2;

      await assetMarketplaceInstance
        .connect(admin)
        .createSell(price, assetName, expireDate, sellUnit, listedAmount);

      await lrtInstance
        .connect(distributor)
        .transferToken(addr2.address, ethers.utils.parseUnits("500"));

      await lrtInstance
        .connect(addr2)
        .approve(assetMarketplaceInstance.address, price);

      await assetMarketplaceInstance.connect(addr2).buyItem(0);
    });

    it("should allow to withdraw contract balance", async function () {
      const amount = ethers.utils.parseUnits("0.002", 18);

      const treasuryAddress = await landRockerInstance.treasury();
      const oldTreasury = await lrtInstance.balanceOf(treasuryAddress);
      const oldSystemBalance = await lrtInstance.balanceOf(
        assetMarketplaceInstance.address
      );

      const tx = await assetMarketplaceInstance.connect(admin).withdraw(amount);

      await expect(tx)
        .to.emit(assetMarketplaceInstance, "Withdrawn")
        .withArgs(amount, treasuryAddress);

      const newTreasury = await lrtInstance.balanceOf(treasuryAddress);
      const newSystemBalance = await lrtInstance.balanceOf(
        assetMarketplaceInstance.address
      );

      expect(Number(newTreasury)).to.equal(
        Number(Math.Big(oldTreasury).add(amount))
      );
      expect(Number(newSystemBalance)).to.equal(
        Number(Math.Big(oldSystemBalance).sub(amount))
      );
    });

    it("should not allow to withdraw sell if caller is not admin", async function () {
      const amount = ethers.utils.parseUnits("0.002", 18);

      await expect(
        assetMarketplaceInstance.connect(addr1).withdraw(amount)
      ).to.be.revertedWith(AccessErrorMsg.CALLER_NOT_ADMIN);
    });

    it("should not allow to withdraw sell if amount is too low", async function () {
      const amount = ethers.utils.parseUnits("0", 18);

      await expect(
        assetMarketplaceInstance.connect(admin).withdraw(amount)
      ).to.be.revertedWith(AssetMarketplaceErrorMsg.LOW_AMOUNT);
    });
    it("should not allow to withdraw sell if balance insufficient", async function () {
      const amount = ethers.utils.parseUnits("5", 18);

      await expect(
        assetMarketplaceInstance.connect(admin).withdraw(amount)
      ).to.be.revertedWith(AssetMarketplaceErrorMsg.NO_BALANCE);
    });
  });

  describe("test create Sell", function () {
    it("should allow to create sell", async function () {
      // Create an sell

      const price = ethers.utils.parseUnits("1");
      const assetName = Helper.stringToBytes16("Ar"); // fuel
      const listedAmount = 10;
      const expireDate =
        (await time.latest()) + (await Helper.convertToSeconds("weeks", 1));
      const sellUnit = 2;

      const tx = await assetMarketplaceInstance
        .connect(admin)
        .createSell(price, assetName, expireDate, sellUnit, listedAmount);

      await expect(tx)
        .to.emit(assetMarketplaceInstance, "SellCreated")
        .withArgs(0, assetName, expireDate, price, sellUnit, listedAmount);

      const sell = await assetMarketplaceInstance.assetSells(0);

      // Check that the sell has the correct details
      expect(sell.price).to.equal(price);
      expect(sell.status).to.equal(0);

      expect(sell.expireDate).to.equal(expireDate);
      expect(sell.assetName).to.equal(assetName);
      expect(sell.sellUnit).to.equal(2);
      expect(sell.listedAmount).to.equal(10);
      expect(sell.soldAmount).to.equal(0);
    });
    it("should not allow to create sell if sellUnit is invalid", async function () {
      const price = ethers.utils.parseUnits("1");
      const assetName = Helper.stringToBytes16("Ar"); // fuel
      const expireDate =
        (await time.latest()) + (await Helper.convertToSeconds("weeks", 1));
      const sellUnit = 0;
      const listedAmount = 10;

      await expect(
        assetMarketplaceInstance
          .connect(admin)
          .createSell(price, assetName, expireDate, sellUnit, listedAmount)
      ).to.be.revertedWith(AssetMarketplaceErrorMsg.INVALID_SELL_UNIT);
    });

    it("should not allow to create sell if listedAmount is invalid", async function () {
      const price = ethers.utils.parseUnits("1");
      const assetName = Helper.stringToBytes16("Ar"); // fuel
      const expireDate =
        (await time.latest()) + (await Helper.convertToSeconds("weeks", 1));
      const sellUnit = 2;
      const listedAmount = 0;

      await expect(
        assetMarketplaceInstance
          .connect(admin)
          .createSell(price, assetName, expireDate, sellUnit, listedAmount)
      ).to.be.revertedWith(AssetMarketplaceErrorMsg.INVALID_LISTED_AMOUNT);
    });

    it("should not allow to create sell if listedAmount lower than sellUnit", async function () {
      const price = ethers.utils.parseUnits("1");
      const assetName = Helper.stringToBytes16("Ar"); // fuel
      const expireDate =
        (await time.latest()) + (await Helper.convertToSeconds("weeks", 1));
      const sellUnit = 10;
      const listedAmount = 2;

      await expect(
        assetMarketplaceInstance
          .connect(admin)
          .createSell(price, assetName, expireDate, sellUnit, listedAmount)
      ).to.be.revertedWith(AssetMarketplaceErrorMsg.SELL_UNIT_IS_LARGER);
    });

    it("should not allow to create sell if listedAmount is not a coefficient of sell unit", async function () {
      const price = ethers.utils.parseUnits("1");
      const assetName = Helper.stringToBytes16("Ar"); // fuel
      const expireDate =
        (await time.latest()) + (await Helper.convertToSeconds("weeks", 1));
      const sellUnit = 3;
      const listedAmount = 100;

      await expect(
        assetMarketplaceInstance
          .connect(admin)
          .createSell(price, assetName, expireDate, sellUnit, listedAmount)
      ).to.be.revertedWith(
        AssetMarketplaceErrorMsg.NOT_COEFFICIENT_OF_SELL_UNIT
      );
    });

    it("should not allow to create sell if caller is not admin", async function () {
      const price = ethers.utils.parseUnits("1");
      const assetName = Helper.stringToBytes16("Ar"); // fuel
      const expireDate =
        (await time.latest()) + (await Helper.convertToSeconds("weeks", 1));
      const sellUnit = 2;
      const listedAmount = 100;

      await expect(
        assetMarketplaceInstance
          .connect(owner)
          .createSell(price, assetName, expireDate, sellUnit, listedAmount)
      ).to.be.revertedWith(AccessErrorMsg.CALLER_NOT_ADMIN);
    });

    it("should not allow to create sell if expire date is invalid", async function () {
      const price = ethers.utils.parseUnits("1");
      const assetName = Helper.stringToBytes16("Ar");
      const expireDate = await time.latest();
      const sellUnit = 100;
      const listedAmount = 100;

      await expect(
        assetMarketplaceInstance
          .connect(admin)
          .createSell(price, assetName, expireDate, sellUnit, listedAmount)
      ).to.be.revertedWith(AssetMarketplaceErrorMsg.INVALID_EXPIRE_DATE);
    });
  });

  describe("test edit sell", function () {
    it("should allow to edit sell", async function () {
      // Create an sell
      const price = ethers.utils.parseUnits("1");
      const assetName = Helper.stringToBytes16("Ar");
      const expireDate =
        (await time.latest()) + (await Helper.convertToSeconds("weeks", 1));
      const sellUnit = 2;
      const listedAmount = 100;

      await assetMarketplaceInstance
        .connect(admin)
        .createSell(price, assetName, expireDate, sellUnit, listedAmount);

      const price2 = ethers.utils.parseUnits("2");
      const assetName2 = Helper.stringToBytes16("Ne");

      const expireDate2 =
        (await time.latest()) + (await Helper.convertToSeconds("weeks", 2));
      const sellUnit2 = 3;
      const listedAmount2 = 99;

      const tx = await assetMarketplaceInstance
        .connect(admin)
        .editSell(0, price2, assetName2, expireDate2, sellUnit2, listedAmount2);

      await expect(tx)
        .to.emit(assetMarketplaceInstance, "SellUpdated")
        .withArgs(0, assetName2, expireDate2, price2, sellUnit2, listedAmount2);

      const sell = await assetMarketplaceInstance.assetSells(0);

      // Check that the sell has the correct details
      expect(sell.price).to.equal(price2);
      expect(sell.status).to.equal(0);
      expect(sell.assetName).to.equal(assetName2);
      expect(sell.expireDate).to.equal(expireDate2);
      expect(sell.sellUnit).to.equal(sellUnit2);
      expect(sell.listedAmount).to.equal(listedAmount2);
    });

    it("should not allow to edit sell if caller is not admin", async function () {
      const price = ethers.utils.parseUnits("1");
      const assetName = Helper.stringToBytes16("Ar"); // fuel
      const expireDate =
        (await time.latest()) + (await Helper.convertToSeconds("weeks", 1));
      const sellUnit = 2;
      const listedAmount = 100;

      await expect(
        assetMarketplaceInstance
          .connect(owner)
          .editSell(0, price, assetName, expireDate, sellUnit, listedAmount)
      ).to.be.revertedWith(AccessErrorMsg.CALLER_NOT_ADMIN);
    });

    it("should not allow to edit sell if sellUnit is too low", async function () {
      const price = ethers.utils.parseUnits("1");
      const expireDate =
        (await time.latest()) + (await Helper.convertToSeconds("weeks", 1));
      const sellUnit = 0;
      const listedAmount = 100;

      const assetName = Helper.stringToBytes16("Ar");

      await expect(
        assetMarketplaceInstance
          .connect(admin)
          .editSell(0, price, assetName, expireDate, sellUnit, listedAmount)
      ).to.be.revertedWith(AssetMarketplaceErrorMsg.INVALID_SELL_UNIT);
    });

    it("should not allow to edit sell if listedAmount is too low", async function () {
      const price = ethers.utils.parseUnits("1");
      const expireDate =
        (await time.latest()) + (await Helper.convertToSeconds("weeks", 1));
      const sellUnit = 2;
      const assetName = Helper.stringToBytes16("Ar");
      const listedAmount = 10;

      await assetMarketplaceInstance
        .connect(admin)
        .createSell(price, assetName, expireDate, sellUnit, listedAmount);

      await expect(
        assetMarketplaceInstance
          .connect(admin)
          .editSell(0, price, assetName, expireDate, sellUnit, 0)
      ).to.be.revertedWith(AssetMarketplaceErrorMsg.INVALID_LISTED_AMOUNT);
    });

    it("should not allow to edit sell if listedAmount is lower than sell unit", async function () {
      const price = ethers.utils.parseUnits("1");
      const expireDate =
        (await time.latest()) + (await Helper.convertToSeconds("weeks", 1));
      const sellUnit = 20;
      const assetName = Helper.stringToBytes16("Ar");
      const listedAmount = 100;

      await assetMarketplaceInstance
        .connect(admin)
        .createSell(price, assetName, expireDate, sellUnit, listedAmount);

      await expect(
        assetMarketplaceInstance
          .connect(admin)
          .editSell(0, price, assetName, expireDate, 20, 10)
      ).to.be.revertedWith(AssetMarketplaceErrorMsg.SELL_UNIT_IS_LARGER);
    });

    it("should not allow to edit sell if listedAmount is not a coefficient of sell unit", async function () {
      const price = ethers.utils.parseUnits("1");
      const expireDate =
        (await time.latest()) + (await Helper.convertToSeconds("weeks", 1));
      const sellUnit = 20;
      const assetName = Helper.stringToBytes16("Ar");
      const listedAmount = 100;

      await assetMarketplaceInstance
        .connect(admin)
        .createSell(price, assetName, expireDate, sellUnit, listedAmount);

      await expect(
        assetMarketplaceInstance
          .connect(admin)
          .editSell(0, price, assetName, expireDate, 3, 100)
      ).to.be.revertedWith(
        AssetMarketplaceErrorMsg.NOT_COEFFICIENT_OF_SELL_UNIT
      );
    });

    it("should not allow to edit sell if expire date is invalid", async function () {
      const price = ethers.utils.parseUnits("1");
      const expireDate = await time.latest();
      const sellUnit = 0;
      const assetName = Helper.stringToBytes16("Ar");
      const listedAmount = 100;

      await expect(
        assetMarketplaceInstance
          .connect(admin)
          .editSell(0, price, assetName, expireDate, sellUnit, listedAmount)
      ).to.be.revertedWith(AssetMarketplaceErrorMsg.INVALID_EXPIRE_DATE);
    });

    it("should not allow to edit sell if sell has not valid status", async function () {
      const price = ethers.utils.parseUnits("1");
      const assetName = Helper.stringToBytes16("Ar");
      const expireDate =
        (await time.latest()) + (await Helper.convertToSeconds("weeks", 1));
      const sellUnit = 2;
      const listedAmount = 2;
      await assetMarketplaceInstance
        .connect(admin)
        .createSell(price, assetName, expireDate, sellUnit, listedAmount);

      await lrtInstance
        .connect(distributor)
        .transferToken(addr2.address, ethers.utils.parseUnits("500"));

      await lrtInstance
        .connect(addr2)
        .approve(assetMarketplaceInstance.address, price);

      await assetMarketplaceInstance.connect(addr2).buyItem(0);

      await expect(
        assetMarketplaceInstance

          .connect(admin)
          .editSell(0, price, assetName, expireDate, sellUnit, listedAmount)
      ).to.be.revertedWith(AssetMarketplaceErrorMsg.SOLD_ASSET);
    });
  });

  describe("test buy assets", function () {
    it("should allow to buy off-chain assets", async function () {
      const price = ethers.utils.parseUnits("1");
      const assetName = Helper.stringToBytes16("Ar");
      const expireDate =
        (await time.latest()) + (await Helper.convertToSeconds("weeks", 1));
      const sellUnit = 2;
      const listedAmount = 2;

      await assetMarketplaceInstance
        .connect(admin)
        .createSell(price, assetName, expireDate, sellUnit, listedAmount);

      await lrtInstance
        .connect(distributor)
        .transferToken(addr2.address, ethers.utils.parseUnits("500"));

      await lrtInstance
        .connect(addr2)
        .approve(assetMarketplaceInstance.address, price);

      //before buy
      const oldBuyerBalance = await lrtInstance.balanceOf(addr2.address);
      const oldSystemBalance = await lrtInstance.balanceOf(
        assetMarketplaceInstance.address
      );

      const tx = await assetMarketplaceInstance.connect(addr2).buyItem(0);

      await expect(tx)
        .to.emit(assetMarketplaceInstance, "AssetBoughtWithBalance")
        .withArgs(0, assetName, addr2.address, sellUnit, price);

      const newBuyerBalance = await lrtInstance.balanceOf(addr2.address);
      const newSystemBalance = await lrtInstance.balanceOf(
        assetMarketplaceInstance.address
      );

      const sell = await assetMarketplaceInstance.assetSells(0);

      expect(sell.status).to.equal(1);
      expect(Number(newBuyerBalance)).to.equal(
        Number(Math.Big(oldBuyerBalance).sub(price))
      );

      expect(Number(newSystemBalance)).to.equal(
        Number(Math.Big(oldSystemBalance).add(price))
      );
    });

    it("should allow to buy off-chain assets with vested funds", async function () {
      //create vesting plan
      const startDate1 =
        (await time.latest()) + (await Helper.convertToSeconds("days", 1));
      const cliff1 = await Helper.convertToSeconds("months", 3); // 3 month cliff
      const duration1 = await Helper.convertToSeconds("months", 48); // 48 month vesting period
      const revocable1 = true;
      const poolName = ethers.utils.formatBytes32String("Sale");
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
          poolName
        );

      //create vesting schedules addr1
      const vestingAmount1 = ethers.utils.parseUnits("10");
      const planId1 = 0;

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
      const price = ethers.utils.parseUnits("1");
      const assetName = Helper.stringToBytes16("Ar");
      const expireDate =
        (await time.latest()) + (await Helper.convertToSeconds("weeks", 1));
      const sellUnit = 2;
      const listedAmount = 2;

      await assetMarketplaceInstance
        .connect(admin)
        .createSell(price, assetName, expireDate, sellUnit, listedAmount);

      await lrtInstance
        .connect(addr1)
        .approve(assetMarketplaceInstance.address, price);

      const tx = await assetMarketplaceInstance.connect(addr1).buyItem(0);

      await expect(tx)
        .to.emit(assetMarketplaceInstance, "AssetBoughtWithVest")
        .withArgs(0, assetName, addr1.address, sellUnit, price);

      const sell = await assetMarketplaceInstance.assetSells(0);
      const vestingStat = await lrtVestingInstance.holdersStat(addr1.address);
      expect(vestingStat.claimedAmount).to.equal(price);
      expect(sell.status).to.equal(1);
    });

    it("should not allow to buy off-chain assets token when sale has expired", async function () {
      const price = ethers.utils.parseUnits("1");
      const assetName = Helper.stringToBytes16("Ar");
      const expireDate =
        (await time.latest()) + (await Helper.convertToSeconds("weeks", 1));
      const sellUnit = 2;
      const listedAmount = 2;

      await assetMarketplaceInstance
        .connect(admin)
        .createSell(price, assetName, expireDate, sellUnit, listedAmount);

      await lrtInstance
        .connect(distributor)
        .transferToken(addr2.address, ethers.utils.parseUnits("500"));

      const elapsedTime = await Helper.convertToSeconds("weeks", 2);

      await network.provider.send("evm_increaseTime", [elapsedTime]);
      await network.provider.send("evm_mine");

      await lrtInstance
        .connect(addr2)
        .approve(assetMarketplaceInstance.address, price);

      await expect(
        assetMarketplaceInstance.connect(addr2).buyItem(0)
      ).to.be.revertedWith(AssetMarketplaceErrorMsg.HAS_EXPIRED);
    });

    it("should not allow to buy off-chain assets token when status of listed NFTs is not be valid", async function () {
      const price = ethers.utils.parseUnits("1");
      const assetName = Helper.stringToBytes16("Ar");
      const expireDate =
        (await time.latest()) + (await Helper.convertToSeconds("weeks", 1));
      const sellUnit = 2;
      const listedAmount = 2;

      await assetMarketplaceInstance
        .connect(admin)
        .createSell(price, assetName, expireDate, sellUnit, listedAmount);

      await assetMarketplaceInstance.connect(admin).cancelSell(0);

      await lrtInstance
        .connect(distributor)
        .transferToken(addr2.address, ethers.utils.parseUnits("500"));

      await lrtInstance
        .connect(addr2)
        .approve(assetMarketplaceInstance.address, price);

      await expect(
        assetMarketplaceInstance.connect(addr2).buyItem(0)
      ).to.be.revertedWith(AssetMarketplaceErrorMsg.INVALID_STATUS);
    });

    it("should not allow to buy off-chain assets token when status of listed NFTs is not be valid", async function () {
      const price = ethers.utils.parseUnits("1");
      const assetName = Helper.stringToBytes16("Ar");
      const expireDate =
        (await time.latest()) + (await Helper.convertToSeconds("weeks", 1));
      const sellUnit = 2;
      const listedAmount = 2;

      await assetMarketplaceInstance
        .connect(admin)
        .createSell(price, assetName, expireDate, sellUnit, listedAmount);

      await lrtInstance
        .connect(distributor)
        .transferToken(addr2.address, ethers.utils.parseUnits("500"));

      await lrtInstance
        .connect(addr2)
        .approve(assetMarketplaceInstance.address, price);

      await assetMarketplaceInstance.connect(addr2).buyItem(0);

      await expect(
        assetMarketplaceInstance.connect(addr2).buyItem(0)
      ).to.be.revertedWith(AssetMarketplaceErrorMsg.EXCEED_SELL);
    });

    it("should not allow to buy off-chain assets token when has allowance error", async function () {
      const price = ethers.utils.parseUnits("1");
      const assetName = Helper.stringToBytes16("Ar");
      const expireDate =
        (await time.latest()) + (await Helper.convertToSeconds("weeks", 1));
      const sellUnit = 2;
      const listedAmount = 2;

      await assetMarketplaceInstance
        .connect(admin)
        .createSell(price, assetName, expireDate, sellUnit, listedAmount);

      await lrtInstance
        .connect(distributor)
        .transferToken(addr2.address, ethers.utils.parseUnits("500"));

      await lrtInstance
        .connect(addr2)
        .approve(assetMarketplaceInstance.address, 0);

      await expect(
        assetMarketplaceInstance.connect(addr2).buyItem(0)
      ).to.be.revertedWith(AssetMarketplaceErrorMsg.ALLOWANCE);
    });

    it("should not allow to buy off-chain assets token when user has not sufficient vesting balance", async function () {
      const price = ethers.utils.parseUnits("1");
      const assetName = Helper.stringToBytes16("Ar");
      const expireDate =
        (await time.latest()) + (await Helper.convertToSeconds("weeks", 1));
      const sellUnit = 2;
      const listedAmount = 2;

      await assetMarketplaceInstance
        .connect(admin)
        .createSell(price, assetName, expireDate, sellUnit, listedAmount);

      await lrtInstance
        .connect(addr2)
        .approve(assetMarketplaceInstance.address, price);

      await expect(
        assetMarketplaceInstance.connect(addr2).buyItem(0)
      ).to.be.revertedWith(
        AssetMarketplaceErrorMsg.INSUFFICIENT_VESTED_BALANCE
      );
    });
  });

  describe("test cancel sell", function () {
    beforeEach(async function () {
      const price = ethers.utils.parseUnits("1");
      const assetName = Helper.stringToBytes16("Ar");
      const expireDate =
        (await time.latest()) + (await Helper.convertToSeconds("weeks", 1));
      const sellUnit = 2;
      const listedAmount = 2;

      await assetMarketplaceInstance
        .connect(admin)
        .createSell(price, assetName, expireDate, sellUnit, listedAmount);
    });

    it("should allow to cancel sell", async function () {
      const tx = await assetMarketplaceInstance.connect(admin).cancelSell(0);

      await expect(tx)
        .to.emit(assetMarketplaceInstance, "SellCanceled")
        .withArgs(0);

      const sell = await assetMarketplaceInstance.assetSells(0);

      // Check that the sell has the correct details
      expect(sell.status).to.equal(2);
    });

    it("should not allow a admin to cancel an off-chain asset when your not admin ", async function () {
      await expect(
        assetMarketplaceInstance.connect(addr1).cancelSell(0)
      ).to.be.revertedWith(AccessErrorMsg.CALLER_NOT_ADMIN);
    });

    it("should not allow a admin to cancel an asset sell when it has sold before ", async function () {
      await lrtInstance
        .connect(distributor)
        .transferToken(addr2.address, ethers.utils.parseUnits("500"));

      await lrtInstance
        .connect(addr2)
        .approve(
          assetMarketplaceInstance.address,
          ethers.utils.parseUnits("1")
        );

      await assetMarketplaceInstance.connect(addr2).buyItem(0);

      await expect(
        assetMarketplaceInstance.connect(admin).cancelSell(0)
      ).to.be.revertedWith(AssetMarketplaceErrorMsg.ACTIVE_ORDER);
    });
  });

  //user off-chain assets buying
  describe("test user off-chain assets buying", function () {
    it("should allow to buy off-chain assets", async function () {
      const price = ethers.utils.parseUnits("10");
      const assetName = Helper.stringToBytes16("Ar");
      const expireDate = 0;
      const sellUnit = 2;
      const status = 0;
      const seller = addr1.address;
      const buyer = addr2.address;
      const orderIdHash = ethers.utils.keccak256(Buffer.from("0"));
      const systemFee = await landRockerInstance.systemFee();

      const privateKey = Uint8Array.from(
        Buffer.from(
          "dbda1821b80551c9d65939329250298aa3472ba22feea921c0cf5d620ea67b97",
          "hex"
        )
      );

      let sign1 = await createMsgWithSig(
        assetMarketplaceInstance,
        privateKey,
        seller,
        assetName,
        expireDate,
        price,
        sellUnit
      );

      await lrtInstance
        .connect(distributor)
        .transferToken(buyer, ethers.utils.parseUnits("500"));

      await lrtInstance
        .connect(addr2)
        .approve(assetMarketplaceInstance.address, price); //addr1.address

      const oldBuyerBalance = await lrtInstance.balanceOf(buyer);
      const oldSystemBalance = await lrtInstance.balanceOf(
        assetMarketplaceInstance.address
      );
      const oldSellerBalance = await lrtInstance.balanceOf(seller);

      const tx = await assetMarketplaceInstance
        .connect(addr2)
        .fulfillOrder(
          orderIdHash,
          seller,
          status,
          assetName,
          expireDate,
          price,
          sellUnit,
          sign1.v,
          sign1.r,
          sign1.s
        );

      let systemPortion = Math.Big(systemFee).mul(price).div(10000);
      let totalPay = Math.Big(price).sub(systemPortion);

      await expect(tx)
        .to.emit(assetMarketplaceInstance, "FulFilledOrder")
        .withArgs(
          orderIdHash,
          assetName,
          seller,
          addr2.address,
          sellUnit,
          BigInt(totalPay)
        );

      const newBuyerBalance = await lrtInstance.balanceOf(buyer);
      const newSystemBalance = await lrtInstance.balanceOf(
        assetMarketplaceInstance.address
      );
      const newSellerBalance = await lrtInstance.balanceOf(seller);

      expect(
        await assetMarketplaceInstance.orderFulfilled(orderIdHash)
      ).to.equal(true);
      expect(Number(newBuyerBalance)).to.equal(
        Number(Math.Big(oldBuyerBalance).sub(price))
      );

      expect(Number(newSystemBalance)).to.equal(
        Number(Math.Big(oldSystemBalance).add(systemPortion))
      );

      expect(Number(newSellerBalance)).to.equal(
        Number(Math.Big(oldSellerBalance).add(totalPay))
      );
    });

    it("should not allow to buy user off-chain assets token when sale has expired", async function () {
      const price = ethers.utils.parseUnits("10");
      const assetName = Helper.stringToBytes16("Ar");
      const expireDate =
        (await time.latest()) + (await Helper.convertToSeconds("weeks", 1));
      const sellUnit = 2;
      const status = 0;
      const seller = addr1.address;
      const buyer = addr2.address;
      const orderIdHash = ethers.utils.keccak256(Buffer.from("0"));

      const privateKey = Uint8Array.from(
        Buffer.from(
          "dbda1821b80551c9d65939329250298aa3472ba22feea921c0cf5d620ea67b97",
          "hex"
        )
      );

      let sign1 = await createMsgWithSig(
        assetMarketplaceInstance,
        privateKey,
        seller,
        assetName,
        expireDate,
        price,
        sellUnit
      );

      await lrtInstance
        .connect(distributor)
        .transferToken(buyer, ethers.utils.parseUnits("500"));

      const elapsedTime = await Helper.convertToSeconds("weeks", 2);

      await network.provider.send("evm_increaseTime", [elapsedTime]);
      await network.provider.send("evm_mine");

      await lrtInstance
        .connect(addr2)
        .approve(assetMarketplaceInstance.address, price);

      await expect(
        assetMarketplaceInstance
          .connect(addr2)
          .fulfillOrder(
            orderIdHash,
            seller,
            status,
            assetName,
            expireDate,
            price,
            sellUnit,
            sign1.v,
            sign1.r,
            sign1.s
          )
      ).to.be.revertedWith(AssetMarketplaceErrorMsg.HAS_EXPIRED);
    });

    it("should not allow to buy user off-chain assets token when status of listed asset is not be valid", async function () {
      const price = ethers.utils.parseUnits("10");
      const assetName = Helper.stringToBytes16("Ar");
      const expireDate = 0;
      const sellUnit = 2;
      const status = 2;
      const seller = addr1.address;
      const buyer = addr2.address;
      const orderIdHash = ethers.utils.keccak256(Buffer.from("0"));
      const privateKey = Uint8Array.from(
        Buffer.from(
          "dbda1821b80551c9d65939329250298aa3472ba22feea921c0cf5d620ea67b97",
          "hex"
        )
      );

      let sign1 = await createMsgWithSig(
        assetMarketplaceInstance,
        privateKey,
        seller,
        assetName,
        expireDate,
        price,
        sellUnit
      );

      await lrtInstance
        .connect(distributor)
        .transferToken(buyer, ethers.utils.parseUnits("500"));

      await lrtInstance
        .connect(addr2)
        .approve(assetMarketplaceInstance.address, price); //addr1.address

      await expect(
        assetMarketplaceInstance
          .connect(addr2)
          .fulfillOrder(
            orderIdHash,
            seller,
            status,
            assetName,
            expireDate,
            price,
            sellUnit,
            sign1.v,
            sign1.r,
            sign1.s
          )
      ).to.be.revertedWith(AssetMarketplaceErrorMsg.INVALID_STATUS);
    });

    it("should not allow to buy user off-chain assets token when has allowance error", async function () {
      const price = ethers.utils.parseUnits("10");
      const assetName = Helper.stringToBytes16("Ar");
      const expireDate = 0;
      const sellUnit = 2;
      const status = 0;
      const seller = addr1.address;
      const buyer = addr2.address;
      const orderIdHash = ethers.utils.keccak256(Buffer.from("0"));
      const privateKey = Uint8Array.from(
        Buffer.from(
          "dbda1821b80551c9d65939329250298aa3472ba22feea921c0cf5d620ea67b97",
          "hex"
        )
      );

      let sign1 = await createMsgWithSig(
        assetMarketplaceInstance,
        privateKey,
        seller,
        assetName,
        expireDate,
        price,
        sellUnit
      );

      await lrtInstance
        .connect(distributor)
        .transferToken(buyer, ethers.utils.parseUnits("500"));

      await lrtInstance
        .connect(addr2)
        .approve(assetMarketplaceInstance.address, 0); //addr1.address

      await expect(
        assetMarketplaceInstance
          .connect(addr2)
          .fulfillOrder(
            orderIdHash,
            seller,
            status,
            assetName,
            expireDate,
            price,
            sellUnit,
            sign1.v,
            sign1.r,
            sign1.s
          )
      ).to.be.revertedWith(AssetMarketplaceErrorMsg.ALLOWANCE);
    });

    it("should not allow to buy user off-chain assets token when user has not sufficient balance", async function () {
      const price = ethers.utils.parseUnits("10");
      const assetName = Helper.stringToBytes16("Ar");
      const expireDate = 0;
      const sellUnit = 2;
      const status = 0;
      const seller = addr1.address;
      const orderIdHash = ethers.utils.keccak256(Buffer.from("0"));
      const privateKey = Uint8Array.from(
        Buffer.from(
          "dbda1821b80551c9d65939329250298aa3472ba22feea921c0cf5d620ea67b97",
          "hex"
        )
      );

      let sign1 = await createMsgWithSig(
        assetMarketplaceInstance,
        privateKey,
        seller,
        assetName,
        expireDate,
        price,
        sellUnit
      );

      await lrtInstance
        .connect(addr2)
        .approve(assetMarketplaceInstance.address, price); //addr1.address

      await expect(
        assetMarketplaceInstance
          .connect(addr2)
          .fulfillOrder(
            orderIdHash,
            seller,
            status,
            assetName,
            expireDate,
            price,
            sellUnit,
            sign1.v,
            sign1.r,
            sign1.s
          )
      ).to.be.revertedWith(AssetMarketplaceErrorMsg.INSUFFICIENT_LRT_BALANCE);
    });

    it("should not allow to buy user off-chain assets token when user wants to sell its fuels", async function () {
      const price = ethers.utils.parseUnits("10");
      const assetName = Helper.stringToBytes16("fuel");
      const expireDate = 0;
      const sellUnit = 2;
      const status = 0;
      const seller = addr1.address;
      const buyer = addr2.address;
      const orderIdHash = ethers.utils.keccak256(Buffer.from("0"));
      const privateKey = Uint8Array.from(
        Buffer.from(
          "dbda1821b80551c9d65939329250298aa3472ba22feea921c0cf5d620ea67b97",
          "hex"
        )
      );

      let sign1 = await createMsgWithSig(
        assetMarketplaceInstance,
        privateKey,
        seller,
        assetName,
        expireDate,
        price,
        sellUnit
      );

      await lrtInstance
        .connect(distributor)
        .transferToken(buyer, ethers.utils.parseUnits("500"));

      await lrtInstance
        .connect(addr2)
        .approve(assetMarketplaceInstance.address, 0); //addr1.address

      await expect(
        assetMarketplaceInstance
          .connect(addr2)
          .fulfillOrder(
            orderIdHash,
            seller,
            status,
            assetName,
            expireDate,
            price,
            sellUnit,
            sign1.v,
            sign1.r,
            sign1.s
          )
      ).to.be.revertedWith(AssetMarketplaceErrorMsg.FUEL_CANNOT_BE_SOLD);
    });

    it("should not allow to buy user off-chain assets token when user wants to buy twice", async function () {
      const price = ethers.utils.parseUnits("10");
      const assetName = Helper.stringToBytes16("Ar");
      const expireDate = 0;
      const sellUnit = 2;
      const status = 0;
      const seller = addr1.address;
      const buyer = addr2.address;
      const orderIdHash = ethers.utils.keccak256(Buffer.from("0"));
      const privateKey = Uint8Array.from(
        Buffer.from(
          "dbda1821b80551c9d65939329250298aa3472ba22feea921c0cf5d620ea67b97",
          "hex"
        )
      );

      let sign1 = await createMsgWithSig(
        assetMarketplaceInstance,
        privateKey,
        seller,
        assetName,
        expireDate,
        price,
        sellUnit
      );


      await lrtInstance
        .connect(distributor)
        .transferToken(buyer, ethers.utils.parseUnits("500"));

      await lrtInstance
        .connect(addr2)
        .approve(assetMarketplaceInstance.address, price); //addr1.address

      await assetMarketplaceInstance
        .connect(addr2)
        .fulfillOrder(
          orderIdHash,
          seller,
          status,
          assetName,
          expireDate,
          price,
          sellUnit,
          sign1.v,
          sign1.r,
          sign1.s
        );

      await expect(
        assetMarketplaceInstance
          .connect(addr2)
          .fulfillOrder(
            orderIdHash,
            seller,
            status,
            assetName,
            expireDate,
            price,
            sellUnit,
            sign1.v,
            sign1.r,
            sign1.s
          )
      ).to.be.revertedWith(AssetMarketplaceErrorMsg.ORDER_ALREADY_FUL_FILLED);
    });
  });

  describe("Contract Version 2 test", function () {
    let oldContract, upgradedContract, owner, addr1;
    beforeEach(async function () {
      [owner, addr1] = await ethers.getSigners(2);
      const AssetMarketplace = await ethers.getContractFactory(
        "AssetMarketplace"
      );
      const AssetMarketplaceUpgraded = await ethers.getContractFactory(
        "AssetMarketplaceUpgraded"
      );

      oldContract = await upgrades.deployProxy(
        AssetMarketplace,
        [
          arInstance.address,
          lrtInstance.address,
          landRockerInstance.address,
          lrtVestingInstance.address,
        ],
        { initializer: "initializeAssetMarketplace", kind: "uups" }
      );

      await oldContract.deployed();

      upgradedContract = await upgrades.upgradeProxy(
        oldContract,
        AssetMarketplaceUpgraded,
        {
          call: {
            fn: "initializeAssetMarketplace",
            args: [
              arInstance.address,
              lrtInstance.address,
              landRockerInstance.address,
              lrtVestingInstance.address,
              "hi i am upgraded",
            ],
          },
        }
      );
    });

    it("New Contract Should return the new contract return the new state variable", async function () {
      expect(await upgradedContract.greeting()).to.equal("hi i am upgraded");
    });
  });
});
