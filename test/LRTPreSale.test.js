const { expect } = require("chai");
const { ethers, network } = require("hardhat");
const Math = require("./helper/math");
const Helper = require("./helper");
const { TimeEnumes } = require("./helper/enums");

const {
  time,
  loadFixture,
} = require("@nomicfoundation/hardhat-network-helpers");
const { preSaleFixture } = require("./fixture");
const { AccessErrorMsg, LRTErrorMsg, SaleErrorMsg } = require("./messages");

describe("LRT preSale", function () {
  let lrtPreSaleInstance,
    lrtVestingInstance,
    arInstance,
    aggregatorInstance,
    mockReentrantInstance,
    daiInstance,
    wethInstance,
    wbtcInstance,
    wmaticInstance,
    usdcInstance,
    usdtInstance,
    owner,
    admin,
    script,
    wert,
    addr1,
    addr2,
    treasury;

  beforeEach(async function () {
    ({
      lrtPreSaleInstance,
      lrtVestingInstance,
      arInstance,
      aggregatorInstance,
      mockReentrantInstance,
      daiInstance,
      wethInstance,
      wbtcInstance,
      wmaticInstance,
      usdcInstance,
      usdtInstance,
      owner,
      admin,
      script,
      wert,
      addr1,
      addr2,
      treasury,
    } = await loadFixture(preSaleFixture));

    await lrtPreSaleInstance
      .connect(admin)
      .setLrtPrice(ethers.utils.parseUnits("1", 18));
    await lrtPreSaleInstance
      .connect(admin)
      .setLrtLimit(ethers.utils.parseUnits("500", 18));
    await lrtPreSaleInstance.connect(admin).setSaleStatus(true);
    await lrtPreSaleInstance
      .connect(admin)
      .setPlanID(ethers.utils.parseUnits("0"));

    await lrtPreSaleInstance
      .connect(admin)
      .setMinLrtPerUser(ethers.utils.parseUnits("10", 18));

    await lrtPreSaleInstance
      .connect(admin)
      .setTreasuryAddress(treasury.address);

    await lrtPreSaleInstance
      .connect(admin)
      .setUserBalanceLimit(ethers.utils.parseUnits("200", 18));
    //add investor
  });

  describe("buy with native coin", function () {
    it("Should buy tokens with native coin", async function () {
      // Set up the test data
      const lrtAmount = ethers.utils.parseUnits("10", 18);
      const lrtPrice = await lrtPreSaleInstance.lrtPrice();
      const discountPercentage = await lrtPreSaleInstance.discount();
      const roundId = 123;
      const mockPrice = ethers.utils.parseUnits("10", 8);
      const zeroAddress = "0x0000000000000000000000000000000000000000";

      await aggregatorInstance.setLatestRoundData(roundId, mockPrice, 0, 0, 0);

      // Call the getRoundData() function
      const [, price, , ,] = await aggregatorInstance.getRoundData(roundId);

      let totalPay = 0;
      let discountAmount = 0;

      const requiredAmount = lrtAmount
        .mul(lrtPrice)
        .div(ethers.BigNumber.from("1000000000000000000"));

      discountAmount = requiredAmount
        .mul(discountPercentage)
        .div(ethers.BigNumber.from("10000"));

      if (await lrtPreSaleInstance.eligibleAddresses(addr2.address)) {
        totalPay = requiredAmount.sub(discountAmount);
      } else {
        totalPay = requiredAmount;
      }

      const value = totalPay
        .div(Number(price))
        .mul(ethers.BigNumber.from("100000000"));

      const oldContractBalance = await ethers.provider.getBalance(
        lrtPreSaleInstance.address
      );
      const oldLrtTSold = await lrtPreSaleInstance.lrtSold();

      // // Call buyTokenByERC20Token function
      const tx = await lrtPreSaleInstance
        .connect(addr2)
        .buyTokenByNativeCoin(lrtAmount, roundId, { value });

      await expect(tx)
        .to.emit(lrtPreSaleInstance, "PurchasedByNativeCoin")
        .withArgs(addr2.address, lrtAmount, value);
      const newContractBalance = await ethers.provider.getBalance(
        lrtPreSaleInstance.address
      );

      expect(newContractBalance).to.equal(oldContractBalance.add(value));

      const lrtTokenShare = await lrtPreSaleInstance.lrtTokenShare(
        addr2.address
      );
      const lrtTSold = await lrtPreSaleInstance.lrtSold();

      const oldTreasuryBalance = await ethers.provider.getBalance(
        treasury.address
      );

      // //   // check withdraw success
      const withdrawTx = await lrtPreSaleInstance
        .connect(admin)
        .withdrawCoins(value);

      await expect(withdrawTx)
        .to.emit(lrtPreSaleInstance, "WithdrawedCoinBalance")
        .withArgs(treasury.address, value);

      const newTreasuryBalance = await ethers.provider.getBalance(
        treasury.address
      );

      // revert withdraw
      // check caller
      await expect(
        lrtPreSaleInstance.connect(treasury).withdrawCoins(value)
      ).to.be.revertedWith(AccessErrorMsg.CALLER_NOT_ADMIN);

      //check not pass low amount
      await expect(
        lrtPreSaleInstance.connect(admin).withdrawCoins(0)
      ).to.be.revertedWith(SaleErrorMsg.VALID_AMOUNT);

      //insufficient balance
      await expect(
        lrtPreSaleInstance.connect(admin).withdrawCoins(20000000000000)
      ).to.be.revertedWith(SaleErrorMsg.INSUFFICIENT_BALANCE);

      expect(newTreasuryBalance).to.equal(oldTreasuryBalance.add(value));
      expect(lrtTokenShare).to.equal(lrtAmount);
      expect(lrtTSold).to.equal(oldLrtTSold.add(lrtAmount));
    });

    it("Should buy tokens with native coin without discount", async function () {
      await lrtPreSaleInstance.connect(admin).setSaleDiscount(0);
      // Set up the test data
      const lrtAmount = ethers.utils.parseUnits("10", 18);
      const lrtPrice = await lrtPreSaleInstance.lrtPrice();
      const discountPercentage = await lrtPreSaleInstance.discount();
      const roundId = 123;
      const mockPrice = ethers.utils.parseUnits("10", 8);
      const zeroAddress = "0x0000000000000000000000000000000000000000";

      await aggregatorInstance.setLatestRoundData(roundId, mockPrice, 0, 0, 0);

      // Call the getRoundData() function
      const [, price, , ,] = await aggregatorInstance.getRoundData(roundId);

      let totalPay = 0;
      let discountAmount = 0;

      const requiredAmount = lrtAmount
        .mul(lrtPrice)
        .div(ethers.BigNumber.from("1000000000000000000"));

      discountAmount = requiredAmount
        .mul(discountPercentage)
        .div(ethers.BigNumber.from("10000"));

      if (await lrtPreSaleInstance.eligibleAddresses(addr2.address)) {
        totalPay = requiredAmount.sub(discountAmount);
      } else {
        totalPay = requiredAmount;
      }

      const value = totalPay
        .div(Number(price))
        .mul(ethers.BigNumber.from("100000000"));

      const oldContractBalance = await ethers.provider.getBalance(
        lrtPreSaleInstance.address
      );
      const oldLrtTSold = await lrtPreSaleInstance.lrtSold();

      // // Call buyTokenByERC20Token function
      const tx = await lrtPreSaleInstance
        .connect(addr2)
        .buyTokenByNativeCoin(lrtAmount, roundId, { value });

      await expect(tx)
        .to.emit(lrtPreSaleInstance, "PurchasedByNativeCoin")
        .withArgs(addr2.address, lrtAmount, value);
      const newContractBalance = await ethers.provider.getBalance(
        lrtPreSaleInstance.address
      );

      expect(newContractBalance).to.equal(oldContractBalance.add(value));

      const lrtTokenShare = await lrtPreSaleInstance.lrtTokenShare(
        addr2.address
      );
      const lrtTSold = await lrtPreSaleInstance.lrtSold();

      const oldTreasuryBalance = await ethers.provider.getBalance(
        treasury.address
      );

      // //   // check withdraw success
      const withdrawTx = await lrtPreSaleInstance
        .connect(admin)
        .withdrawCoins(value);

      await expect(withdrawTx)
        .to.emit(lrtPreSaleInstance, "WithdrawedCoinBalance")
        .withArgs(treasury.address, value);

      const newTreasuryBalance = await ethers.provider.getBalance(
        treasury.address
      );

      // revert withdraw
      // check caller
      await expect(
        lrtPreSaleInstance.connect(treasury).withdrawCoins(value)
      ).to.be.revertedWith(AccessErrorMsg.CALLER_NOT_ADMIN);

      //check not pass low amount
      await expect(
        lrtPreSaleInstance.connect(admin).withdrawCoins(0)
      ).to.be.revertedWith(SaleErrorMsg.VALID_AMOUNT);

      //insufficient balance
      await expect(
        lrtPreSaleInstance.connect(admin).withdrawCoins(20000000000000)
      ).to.be.revertedWith(SaleErrorMsg.INSUFFICIENT_BALANCE);

      expect(newTreasuryBalance).to.equal(oldTreasuryBalance.add(value));
      expect(lrtTokenShare).to.equal(lrtAmount);
      expect(lrtTSold).to.equal(oldLrtTSold.add(lrtAmount));
    });

    it("Should buy tokens with native coin when buy cap has set", async function () {
      // Set up the test data
      await lrtPreSaleInstance.connect(admin).setBuyCap(2);

      const lrtAmount = ethers.utils.parseUnits("10", 18);
      const lrtPrice = await lrtPreSaleInstance.lrtPrice();
      const discountPercentage = await lrtPreSaleInstance.discount();
      const roundId = 123;
      const mockPrice = ethers.utils.parseUnits("10", 8);
      const zeroAddress = "0x0000000000000000000000000000000000000000";

      await aggregatorInstance.setLatestRoundData(roundId, mockPrice, 0, 0, 0);

      // Call the getRoundData() function
      const [, price, , ,] = await aggregatorInstance.getRoundData(roundId);

      let totalPay = 0;
      let discountAmount = 0;

      const requiredAmount = lrtAmount
        .mul(lrtPrice)
        .div(ethers.BigNumber.from("1000000000000000000"));

      discountAmount = requiredAmount
        .mul(discountPercentage)
        .div(ethers.BigNumber.from("10000"));

      if (await lrtPreSaleInstance.eligibleAddresses(addr2.address)) {
        totalPay = requiredAmount.sub(discountAmount);
      } else {
        totalPay = requiredAmount;
      }

      const value = totalPay
        .div(Number(price))
        .mul(ethers.BigNumber.from("100000000"));

      const tx = await lrtPreSaleInstance
        .connect(addr2)
        .buyTokenByNativeCoin(lrtAmount, roundId, { value });
      const tx2 = await lrtPreSaleInstance
        .connect(addr2)
        .buyTokenByNativeCoin(lrtAmount, roundId, { value });

      expect(
        await lrtPreSaleInstance.userDailyPurchaseCount(addr2.address)
      ).to.equal(2);
      // expect(lrtTokenShare).to.equal(lrtAmount);
      // expect(lrtTSold).to.equal(oldLrtTSold.add(lrtAmount));
    });

    it("Should not allow to buy tokens with native coin when buy cap has set and user limitation has reached", async function () {
      // Set up the test data
      await lrtPreSaleInstance.connect(admin).setBuyCap(2);

      const lrtAmount = ethers.utils.parseUnits("10", 18);
      const lrtPrice = await lrtPreSaleInstance.lrtPrice();
      const discountPercentage = await lrtPreSaleInstance.discount();
      const roundId = 123;
      const mockPrice = ethers.utils.parseUnits("10", 8);
      const zeroAddress = "0x0000000000000000000000000000000000000000";

      await aggregatorInstance.setLatestRoundData(roundId, mockPrice, 0, 0, 0);

      // Call the getRoundData() function
      const [, price, , ,] = await aggregatorInstance.getRoundData(roundId);

      let totalPay = 0;
      let discountAmount = 0;

      const requiredAmount = lrtAmount
        .mul(lrtPrice)
        .div(ethers.BigNumber.from("1000000000000000000"));

      discountAmount = requiredAmount
        .mul(discountPercentage)
        .div(ethers.BigNumber.from("10000"));

      if (await lrtPreSaleInstance.eligibleAddresses(addr2.address)) {
        totalPay = requiredAmount.sub(discountAmount);
      } else {
        totalPay = requiredAmount;
      }

      const value = totalPay
        .div(Number(price))
        .mul(ethers.BigNumber.from("100000000"));

      const tx = await lrtPreSaleInstance
        .connect(addr2)
        .buyTokenByNativeCoin(lrtAmount, roundId, { value });
      const tx2 = await lrtPreSaleInstance
        .connect(addr2)
        .buyTokenByNativeCoin(lrtAmount, roundId, { value });

      await expect(
        lrtPreSaleInstance
          .connect(addr2)
          .buyTokenByNativeCoin(lrtAmount, roundId, { value })
      ).to.be.revertedWith(SaleErrorMsg.DAILY_LIMIT);
    });

    it("Should allow to buy tokens with native coin when buy cap has set and user limitation has reached but user tried 24 hours later", async function () {
      // Set up the test data

      await lrtPreSaleInstance.connect(admin).setBuyCap(2);

      const lrtAmount = ethers.utils.parseUnits("10", 18);
      const lrtPrice = await lrtPreSaleInstance.lrtPrice();
      const discountPercentage = await lrtPreSaleInstance.discount();
      const roundId = 123;
      const mockPrice = ethers.utils.parseUnits("10", 8);
      const zeroAddress = "0x0000000000000000000000000000000000000000";

      await aggregatorInstance.setLatestRoundData(roundId, mockPrice, 0, 0, 0);

      // Call the getRoundData() function
      const [, price, , ,] = await aggregatorInstance.getRoundData(roundId);

      let totalPay = 0;
      let discountAmount = 0;

      const requiredAmount = lrtAmount
        .mul(lrtPrice)
        .div(ethers.BigNumber.from("1000000000000000000"));

      discountAmount = requiredAmount
        .mul(discountPercentage)
        .div(ethers.BigNumber.from("10000"));

      if (await lrtPreSaleInstance.eligibleAddresses(addr2.address)) {
        totalPay = requiredAmount.sub(discountAmount);
      } else {
        totalPay = requiredAmount;
      }

      const value = totalPay
        .div(Number(price))
        .mul(ethers.BigNumber.from("100000000"));

      const tx = await lrtPreSaleInstance
        .connect(addr2)
        .buyTokenByNativeCoin(lrtAmount, roundId, { value });
      const tx2 = await lrtPreSaleInstance
        .connect(addr2)
        .buyTokenByNativeCoin(lrtAmount, roundId, { value });

      await expect(
        lrtPreSaleInstance
          .connect(addr2)
          .buyTokenByNativeCoin(lrtAmount, roundId, { value })
      ).to.be.revertedWith(SaleErrorMsg.DAILY_LIMIT);

      const elapsedTime = await Helper.convertToSeconds("days", 1);

      await network.provider.send("evm_increaseTime", [elapsedTime]);
      await network.provider.send("evm_mine");

      await lrtPreSaleInstance
        .connect(addr2)
        .buyTokenByNativeCoin(lrtAmount, roundId, { value });

      expect(
        await lrtPreSaleInstance.userDailyPurchaseCount(addr2.address)
      ).to.equal(1);
    });

    it("Should revert when LRT limit is exceeded", async function () {
      // Set up the test data and environment
      const lrtAmount = ethers.utils.parseUnits("1000", 18);
      const lrtPrice = await lrtPreSaleInstance.lrtPrice();
      const discountPercentage = await lrtPreSaleInstance.discount();
      const roundId = 123;
      const mockPrice = ethers.utils.parseUnits("10", 8);
      const zeroAddress = "0x0000000000000000000000000000000000000000";

      await aggregatorInstance.setLatestRoundData(roundId, mockPrice, 0, 0, 0);

      // Call the getRoundData() function
      const [, price, , ,] = await aggregatorInstance.getRoundData(roundId);

      let totalPay = 0;
      let discountAmount = 0;

      const requiredAmount = lrtAmount
        .mul(lrtPrice)
        .div(ethers.BigNumber.from("1000000000000000000"));

      discountAmount = requiredAmount
        .mul(discountPercentage)
        .div(ethers.BigNumber.from("10000"));

      if (await lrtPreSaleInstance.eligibleAddresses(addr2.address)) {
        totalPay = requiredAmount.sub(discountAmount);
      } else {
        totalPay = requiredAmount;
      }

      const value = totalPay
        .div(Number(price))
        .mul(ethers.BigNumber.from("100000000"));

      // Call buyTokenByERC20Token function with an amount that exceeds the limit
      await expect(
        lrtPreSaleInstance
          .connect(addr2)
          .buyTokenByNativeCoin(lrtAmount, roundId, { value })
      ).to.be.revertedWith(SaleErrorMsg.LIMIT_EXCEED);
    });

    it("Should revert when user balance LRT limit is exceeded", async function () {
      // Set up the test data and environment
      await lrtPreSaleInstance
        .connect(admin)
        .setLrtPrice(ethers.utils.parseUnits("1", 18));
      const lrtAmount = ethers.utils.parseUnits("300", 18);
      const lrtPrice = await lrtPreSaleInstance.lrtPrice();
      await lrtPreSaleInstance.connect(admin).setSaleDiscount(0);

      const discountPercentage = await lrtPreSaleInstance.discount();
      const roundId = 123;
      const mockPrice = ethers.utils.parseUnits("10", 8);
      const zeroAddress = "0x0000000000000000000000000000000000000000";

      await aggregatorInstance.setLatestRoundData(roundId, mockPrice, 0, 0, 0);

      // Call the getRoundData() function
      const [, price, , ,] = await aggregatorInstance.getRoundData(roundId);

      let totalPay = 0;
      let discountAmount = 0;

      const requiredAmount = lrtAmount
        .mul(lrtPrice)
        .div(ethers.BigNumber.from("1000000000000000000"));

      discountAmount = requiredAmount
        .mul(discountPercentage)
        .div(ethers.BigNumber.from("10000"));

      if (await lrtPreSaleInstance.eligibleAddresses(addr2.address)) {
        totalPay = requiredAmount.sub(discountAmount);
      } else {
        totalPay = requiredAmount;
      }

      const value = totalPay
        .div(Number(price))
        .mul(ethers.BigNumber.from("100000000"));

      // Call buyTokenByERC20Token function with an amount that exceeds the limit
      await expect(
        lrtPreSaleInstance
          .connect(addr2)
          .buyTokenByNativeCoin(lrtAmount, roundId, { value })
      ).to.be.revertedWith(SaleErrorMsg.USER_BALANCE_LIMIT);
    });

    it("Should revert when sale is not active", async function () {
      //
      await lrtPreSaleInstance.connect(admin).setSaleStatus(false);

      // Set up the test data and environment
      const lrtAmount = ethers.utils.parseUnits("10", 18);
      const lrtPrice = await lrtPreSaleInstance.lrtPrice();

      const discountPercentage = await lrtPreSaleInstance.discount();
      const roundId = 123;
      const mockPrice = ethers.utils.parseUnits("10", 8);
      const zeroAddress = "0x0000000000000000000000000000000000000000";

      await aggregatorInstance.setLatestRoundData(roundId, mockPrice, 0, 0, 0);

      // Call the getRoundData() function
      const [, price, , ,] = await aggregatorInstance.getRoundData(roundId);

      let totalPay = 0;
      let discountAmount = 0;

      const requiredAmount = lrtAmount
        .mul(lrtPrice)
        .div(ethers.BigNumber.from("1000000000000000000"));

      discountAmount = requiredAmount
        .mul(discountPercentage)
        .div(ethers.BigNumber.from("10000"));

      if (await lrtPreSaleInstance.eligibleAddresses(addr2.address)) {
        totalPay = requiredAmount.sub(discountAmount);
      } else {
        totalPay = requiredAmount;
      }

      const value = totalPay
        .div(Number(price))
        .mul(ethers.BigNumber.from("100000000"));

      // Call buyTokenByERC20Token function after the time limit
      await expect(
        lrtPreSaleInstance
          .connect(addr1)
          .buyTokenByNativeCoin(lrtAmount, roundId, { value })
      ).to.be.revertedWith(SaleErrorMsg.SALE_NOT_ACTIVE);
    });

    it("Should revert when balance is insufficient", async function () {
      const lrtAmount = ethers.utils.parseUnits("10", 18);
      const lrtPrice = await lrtPreSaleInstance.lrtPrice();

      const discountPercentage = await lrtPreSaleInstance.discount();
      const roundId = 123;
      const mockPrice = ethers.utils.parseUnits("10", 8);
      const zeroAddress = "0x0000000000000000000000000000000000000000";

      await aggregatorInstance.setLatestRoundData(roundId, mockPrice, 0, 0, 0);

      // Call the getRoundData() function
      const [, price, , ,] = await aggregatorInstance.getRoundData(roundId);

      let totalPay = 0;
      let discountAmount = 0;

      const requiredAmount = lrtAmount
        .mul(lrtPrice)
        .div(ethers.BigNumber.from("1000000000000000000"));

      discountAmount = requiredAmount
        .mul(discountPercentage)
        .div(ethers.BigNumber.from("10000"));

      if (await lrtPreSaleInstance.eligibleAddresses(addr2.address)) {
        totalPay = requiredAmount.sub(discountAmount);
      } else {
        totalPay = requiredAmount;
      }

      const value = totalPay
        .div(Number(price))
        .mul(ethers.BigNumber.from("100000000"));

      // Call buyTokenByERC20Token function with an insufficient balance
      await expect(
        lrtPreSaleInstance
          .connect(addr1)
          .buyTokenByNativeCoin(lrtAmount, roundId, { value: 0 })
      ).to.be.revertedWith(SaleErrorMsg.INSUFFICIENT_BALANCE);
    });

    it("Should revert when LRT amount is lower than minLrt per user", async function () {
      // Set up the test data and environment
      const lrtAmount = ethers.utils.parseUnits("5", 18);
      const lrtPrice = await lrtPreSaleInstance.lrtPrice();

      const discountPercentage = await lrtPreSaleInstance.discount();
      const roundId = 123;
      const mockPrice = ethers.utils.parseUnits("10", 8);
      const zeroAddress = "0x0000000000000000000000000000000000000000";

      await aggregatorInstance.setLatestRoundData(roundId, mockPrice, 0, 0, 0);

      // Call the getRoundData() function
      const [, price, , ,] = await aggregatorInstance.getRoundData(roundId);

      let totalPay = 0;
      let discountAmount = 0;

      const requiredAmount = lrtAmount
        .mul(lrtPrice)
        .div(ethers.BigNumber.from("1000000000000000000"));

      discountAmount = requiredAmount
        .mul(discountPercentage)
        .div(ethers.BigNumber.from("10000"));

      if (await lrtPreSaleInstance.eligibleAddresses(addr2.address)) {
        totalPay = requiredAmount.sub(discountAmount);
      } else {
        totalPay = requiredAmount;
      }

      const value = totalPay
        .div(Number(price))
        .mul(ethers.BigNumber.from("100000000"));

      await expect(
        lrtPreSaleInstance
          .connect(addr1)
          .buyTokenByNativeCoin(lrtAmount, roundId, { value: value })
      ).to.be.revertedWith(SaleErrorMsg.TOO_LOW_AMOUNT);
    });

    it("Should revert when LRT amount is lower than minLrt per user", async function () {
      // Set up the test data and environment
      const lrtAmount = ethers.utils.parseUnits("0", 18);
      const lrtPrice = await lrtPreSaleInstance.lrtPrice();

      const discountPercentage = await lrtPreSaleInstance.discount();
      const roundId = 123;
      const mockPrice = ethers.utils.parseUnits("10", 8);
      const zeroAddress = "0x0000000000000000000000000000000000000000";

      await aggregatorInstance.setLatestRoundData(roundId, mockPrice, 0, 0, 0);

      // Call the getRoundData() function
      const [, price, , ,] = await aggregatorInstance.getRoundData(roundId);

      let totalPay = 0;
      let discountAmount = 0;

      const requiredAmount = lrtAmount
        .mul(lrtPrice)
        .div(ethers.BigNumber.from("1000000000000000000"));

      discountAmount = requiredAmount
        .mul(discountPercentage)
        .div(ethers.BigNumber.from("10000"));

      if (await lrtPreSaleInstance.eligibleAddresses(addr2.address)) {
        totalPay = requiredAmount.sub(discountAmount);
      } else {
        totalPay = requiredAmount;
      }

      const value = totalPay
        .div(Number(price))
        .mul(ethers.BigNumber.from("100000000"));

      await expect(
        lrtPreSaleInstance
          .connect(addr1)
          .buyTokenByNativeCoin(lrtAmount, roundId, { value: value })
      ).to.be.revertedWith(SaleErrorMsg.TOO_LOW_AMOUNT);
    });
  });

  describe("buy with erc20 coin(weth,wbtc)", function () {
    it("Should buy tokens with erc coin", async function () {
      // Set up the test data
      const lrtAmount = ethers.utils.parseUnits("10", 18);
      const lrtPrice = await lrtPreSaleInstance.lrtPrice();
      const token = Helper.stringToBytes16("WBTC");
      const discountPercentage = await lrtPreSaleInstance.discount();
      const roundId = 123;
      const mockPrice = ethers.utils.parseUnits("10", 8);

      await aggregatorInstance.setLatestRoundData(roundId, mockPrice, 0, 0, 0);

      // Call the getRoundData() function
      const [, price, , ,] = await aggregatorInstance.getRoundData(roundId);

      let totalPay = 0;
      let discountAmount = 0;
      let amountOut = 0;

      const requiredAmount = lrtAmount
        .mul(lrtPrice)
        .div(ethers.BigNumber.from("1000000000000000000"));

      discountAmount = requiredAmount
        .mul(discountPercentage)
        .div(ethers.BigNumber.from("10000"));

      if (await lrtPreSaleInstance.eligibleAddresses(addr2.address)) {
        totalPay = requiredAmount.sub(discountAmount);
      } else {
        totalPay = requiredAmount;
      }

      if (token == Helper.stringToBytes16("WBTC")) {
        const priceWith10decimal = ethers.BigNumber.from("100").mul(
          Number(price)
        );

        amountOut = totalPay.div(priceWith10decimal);
      } else {
        amountOut = totalPay
          .div(Number(price))
          .mul(ethers.BigNumber.from("100000000"));
      }

      await wbtcInstance
        .connect(addr2)
        .approve(lrtPreSaleInstance.address, amountOut);

      const oldLrtTSold = await lrtPreSaleInstance.lrtSold();

      // Call buyTokenByERC20Token function
      const tx = await lrtPreSaleInstance
        .connect(addr2)
        .buyTokenByERC20Token(lrtAmount, token, roundId);

      await expect(tx)
        .to.emit(lrtPreSaleInstance, "PurchasedByERC20Token")
        .withArgs(addr2.address, lrtAmount, amountOut, wbtcInstance.address);

      const newContractBalance = await wbtcInstance.balanceOf(
        lrtPreSaleInstance.address
      );

      const lrtTokenShare = await lrtPreSaleInstance.lrtTokenShare(
        addr2.address
      );
      const lrtTSold = await lrtPreSaleInstance.lrtSold();

      const oldTreasuryBalance = await daiInstance.balanceOf(treasury.address);

      //   //   // check withdraw success
      const withdrawTx = await lrtPreSaleInstance
        .connect(admin)
        .withdraw(newContractBalance, wbtcInstance.address);

      await expect(withdrawTx)
        .to.emit(lrtPreSaleInstance, "WithdrawedBalance")
        .withArgs(treasury.address, newContractBalance, wbtcInstance.address);

      const newTreasuryBalance = await wbtcInstance.balanceOf(treasury.address);

      // revert withdraw
      // check caller
      await expect(
        lrtPreSaleInstance
          .connect(owner)
          .withdraw(newContractBalance, wbtcInstance.address)
      ).to.be.revertedWith(AccessErrorMsg.CALLER_NOT_ADMIN);

      //check valid distenation address
      const zeroAddress = "0x0000000000000000000000000000000000000000";
      await expect(
        lrtPreSaleInstance
          .connect(admin)
          .withdraw(newContractBalance, zeroAddress)
      ).to.be.revertedWith(SaleErrorMsg.NOT_VALID_ADDRESS);

      //   //check not pass low amount
      await expect(
        lrtPreSaleInstance.connect(admin).withdraw(0, wbtcInstance.address)
      ).to.be.revertedWith(SaleErrorMsg.VALID_AMOUNT);

      //insufficent balance
      await expect(
        lrtPreSaleInstance
          .connect(admin)
          .withdraw(2000000, wbtcInstance.address)
      ).to.be.revertedWith(SaleErrorMsg.INSUFFICIENT_BALANCE);

      expect(newTreasuryBalance).to.equal(
        oldTreasuryBalance.add(newContractBalance)
      );
      expect(lrtTokenShare).to.equal(lrtAmount);
      expect(lrtTSold).to.equal(oldLrtTSold.add(lrtAmount));
    });

    it("Should buy tokens with erc coin (WETH)", async function () {
      // Set up the test data
      const lrtAmount = ethers.utils.parseUnits("10", 18);
      const lrtPrice = await lrtPreSaleInstance.lrtPrice();
      const token = Helper.stringToBytes16("WETH");
      const discountPercentage = await lrtPreSaleInstance.discount();
      const roundId = 123;
      const mockPrice = ethers.utils.parseUnits("10", 8);

      await aggregatorInstance.setLatestRoundData(roundId, mockPrice, 0, 0, 0);

      // Call the getRoundData() function
      const [, price, , ,] = await aggregatorInstance.getRoundData(roundId);

      let totalPay = 0;
      let discountAmount = 0;
      let amountOut = 0;

      const requiredAmount = lrtAmount
        .mul(lrtPrice)
        .div(ethers.BigNumber.from("1000000000000000000"));

      discountAmount = requiredAmount
        .mul(discountPercentage)
        .div(ethers.BigNumber.from("10000"));

      if (await lrtPreSaleInstance.eligibleAddresses(addr2.address)) {
        totalPay = requiredAmount.sub(discountAmount);
      } else {
        totalPay = requiredAmount;
      }

      if (token == Helper.stringToBytes16("WBTC")) {
        const priceWith10decimal = ethers.BigNumber.from("100").mul(
          Number(price)
        );

        amountOut = totalPay.div(priceWith10decimal);
      } else {
        amountOut = totalPay
          .div(Number(price))
          .mul(ethers.BigNumber.from("100000000"));
      }

      await wethInstance
        .connect(addr2)
        .approve(lrtPreSaleInstance.address, amountOut);

      const oldLrtTSold = await lrtPreSaleInstance.lrtSold();

      // Call buyTokenByERC20Token function
      const tx = await lrtPreSaleInstance
        .connect(addr2)
        .buyTokenByERC20Token(lrtAmount, token, roundId);

      await expect(tx)
        .to.emit(lrtPreSaleInstance, "PurchasedByERC20Token")
        .withArgs(addr2.address, lrtAmount, amountOut, wethInstance.address);

      const newContractBalance = await wethInstance.balanceOf(
        lrtPreSaleInstance.address
      );

      const lrtTokenShare = await lrtPreSaleInstance.lrtTokenShare(
        addr2.address
      );
      const lrtTSold = await lrtPreSaleInstance.lrtSold();

      const oldTreasuryBalance = await daiInstance.balanceOf(treasury.address);

      //   //   // check withdraw success
      const withdrawTx = await lrtPreSaleInstance
        .connect(admin)
        .withdraw(newContractBalance, wethInstance.address);

      await expect(withdrawTx)
        .to.emit(lrtPreSaleInstance, "WithdrawedBalance")
        .withArgs(treasury.address, newContractBalance, wethInstance.address);

      const newTreasuryBalance = await wethInstance.balanceOf(treasury.address);

      // revert withdraw
      // check caller
      await expect(
        lrtPreSaleInstance
          .connect(owner)
          .withdraw(newContractBalance, wethInstance.address)
      ).to.be.revertedWith(AccessErrorMsg.CALLER_NOT_ADMIN);

      //check valid distenation address
      const zeroAddress = "0x0000000000000000000000000000000000000000";
      await expect(
        lrtPreSaleInstance
          .connect(admin)
          .withdraw(newContractBalance, zeroAddress)
      ).to.be.revertedWith(SaleErrorMsg.NOT_VALID_ADDRESS);

      //   //check not pass low amount
      await expect(
        lrtPreSaleInstance.connect(admin).withdraw(0, wethInstance.address)
      ).to.be.revertedWith(SaleErrorMsg.VALID_AMOUNT);

      //insufficent balance
      await expect(
        lrtPreSaleInstance
          .connect(admin)
          .withdraw(2000000, wethInstance.address)
      ).to.be.revertedWith(SaleErrorMsg.INSUFFICIENT_BALANCE);

      expect(newTreasuryBalance).to.equal(
        oldTreasuryBalance.add(newContractBalance)
      );
      expect(lrtTokenShare).to.equal(lrtAmount);
      expect(lrtTSold).to.equal(oldLrtTSold.add(lrtAmount));
    });

    it("Should buy tokens with erc20 coin when buy cap has set", async function () {
      // Set up the test data
      await lrtPreSaleInstance.connect(admin).setBuyCap(2);

      const lrtAmount = ethers.utils.parseUnits("10", 18);
      const lrtPrice = await lrtPreSaleInstance.lrtPrice();
      const token = Helper.stringToBytes16("WBTC");

      const discountPercentage = await lrtPreSaleInstance.discount();
      const roundId = 123;
      const mockPrice = ethers.utils.parseUnits("10", 8);

      await aggregatorInstance.setLatestRoundData(roundId, mockPrice, 0, 0, 0);

      // Call the getRoundData() function
      const [, price, , ,] = await aggregatorInstance.getRoundData(roundId);

      let totalPay = 0;
      let discountAmount = 0;
      let amountOut = 0;

      const requiredAmount = lrtAmount
        .mul(lrtPrice)
        .div(ethers.BigNumber.from("1000000000000000000"));

      discountAmount = requiredAmount
        .mul(discountPercentage)
        .div(ethers.BigNumber.from("10000"));

      if (await lrtPreSaleInstance.eligibleAddresses(addr2.address)) {
        totalPay = requiredAmount.sub(discountAmount);
      } else {
        totalPay = requiredAmount;
      }

      if (token == Helper.stringToBytes16("WBTC")) {
        const priceWith10decimal = ethers.BigNumber.from("100").mul(
          Number(price)
        );

        amountOut = totalPay.div(priceWith10decimal);
      } else {
        amountOut = totalPay
          .div(Number(price))
          .mul(ethers.BigNumber.from("100000000"));
      }

      await wbtcInstance
        .connect(addr2)
        .approve(lrtPreSaleInstance.address, amountOut);

      //   // // Call buyTokenByERC20Token function
      const tx = await lrtPreSaleInstance
        .connect(addr2)
        .buyTokenByERC20Token(lrtAmount, token, roundId);

      await wbtcInstance
        .connect(addr2)
        .approve(lrtPreSaleInstance.address, amountOut);
      const tx2 = await lrtPreSaleInstance
        .connect(addr2)
        .buyTokenByERC20Token(lrtAmount, token, roundId);

      const lrtTokenShare = await lrtPreSaleInstance.lrtTokenShare(
        addr2.address
      );

      expect(
        await lrtPreSaleInstance.userDailyPurchaseCount(addr2.address)
      ).to.equal(2);
      expect(lrtTokenShare).to.equal(lrtAmount.add(lrtAmount));
      // expect(lrtTSold).to.equal(oldLrtTSold.add(lrtAmount));
    });

    it("Should not allow to buy tokens with erc20 coin when buy cap has set and user limitation has reached", async function () {
      // Set up the test data
      await lrtPreSaleInstance.connect(admin).setBuyCap(2);

      const lrtAmount = ethers.utils.parseUnits("10", 18);
      const lrtPrice = await lrtPreSaleInstance.lrtPrice();
      const token = Helper.stringToBytes16("WBTC");

      const discountPercentage = await lrtPreSaleInstance.discount();
      const roundId = 123;
      const mockPrice = ethers.utils.parseUnits("10", 8);

      await aggregatorInstance.setLatestRoundData(roundId, mockPrice, 0, 0, 0);

      // Call the getRoundData() function
      const [, price, , ,] = await aggregatorInstance.getRoundData(roundId);

      let totalPay = 0;
      let discountAmount = 0;
      let amountOut = 0;

      const requiredAmount = lrtAmount
        .mul(lrtPrice)
        .div(ethers.BigNumber.from("1000000000000000000"));

      discountAmount = requiredAmount
        .mul(discountPercentage)
        .div(ethers.BigNumber.from("10000"));

      if (await lrtPreSaleInstance.eligibleAddresses(addr2.address)) {
        totalPay = requiredAmount.sub(discountAmount);
      } else {
        totalPay = requiredAmount;
      }

      if (token == Helper.stringToBytes16("WBTC")) {
        const priceWith10decimal = ethers.BigNumber.from("100").mul(
          Number(price)
        );

        amountOut = totalPay.div(priceWith10decimal);
      } else {
        amountOut = totalPay
          .div(Number(price))
          .mul(ethers.BigNumber.from("100000000"));
      }

      await wbtcInstance
        .connect(addr2)
        .approve(lrtPreSaleInstance.address, amountOut);

      await wbtcInstance
        .connect(addr2)
        .approve(lrtPreSaleInstance.address, amountOut);

      //   // // Call buyTokenByERC20Token function
      const tx = await lrtPreSaleInstance
        .connect(addr2)
        .buyTokenByERC20Token(lrtAmount, token, roundId);

      await wbtcInstance
        .connect(addr2)
        .approve(lrtPreSaleInstance.address, amountOut);
      const tx2 = await lrtPreSaleInstance
        .connect(addr2)
        .buyTokenByERC20Token(lrtAmount, token, roundId);

      await wbtcInstance
        .connect(addr2)
        .approve(lrtPreSaleInstance.address, amountOut);
      await expect(
        lrtPreSaleInstance
          .connect(addr2)
          .buyTokenByERC20Token(lrtAmount, token, roundId)
      ).to.be.revertedWith(SaleErrorMsg.DAILY_LIMIT);

      const elapsedTime = await Helper.convertToSeconds("days", 1);

      await network.provider.send("evm_increaseTime", [elapsedTime]);
      await network.provider.send("evm_mine");

      await wbtcInstance
        .connect(addr2)
        .approve(lrtPreSaleInstance.address, amountOut);
      await lrtPreSaleInstance
        .connect(addr2)
        .buyTokenByERC20Token(lrtAmount, token, roundId);

      expect(
        await lrtPreSaleInstance.userDailyPurchaseCount(addr2.address)
      ).to.equal(1);
    });

    it("Should revert when sale is not active", async function () {
      // Set up the test data and environment
      await lrtPreSaleInstance.connect(admin).setSaleStatus(false);
      const lrtAmount = ethers.utils.parseUnits("1000", 18);
      const lrtPrice = await lrtPreSaleInstance.lrtPrice();
      const token = Helper.stringToBytes16("WBTC");

      const discountPercentage = await lrtPreSaleInstance.discount();
      const roundId = 123;
      const mockPrice = ethers.utils.parseUnits("10", 8);

      await aggregatorInstance.setLatestRoundData(roundId, mockPrice, 0, 0, 0);

      // Call the getRoundData() function
      const [, price, , ,] = await aggregatorInstance.getRoundData(roundId);

      let totalPay = 0;
      let discountAmount = 0;
      let amountOut = 0;

      const requiredAmount = lrtAmount
        .mul(lrtPrice)
        .div(ethers.BigNumber.from("1000000000000000000"));

      discountAmount = requiredAmount
        .mul(discountPercentage)
        .div(ethers.BigNumber.from("10000"));

      if (await lrtPreSaleInstance.eligibleAddresses(addr2.address)) {
        totalPay = requiredAmount.sub(discountAmount);
      } else {
        totalPay = requiredAmount;
      }

      if (token == Helper.stringToBytes16("WBTC")) {
        const priceWith10decimal = ethers.BigNumber.from("100").mul(
          Number(price)
        );

        amountOut = totalPay.div(priceWith10decimal);
      } else {
        amountOut = totalPay
          .div(Number(price))
          .mul(ethers.BigNumber.from("100000000"));
      }

      await wbtcInstance
        .connect(addr2)
        .approve(lrtPreSaleInstance.address, amountOut);

      // Call buyTokenByERC20Token function after the time limit
      await expect(
        lrtPreSaleInstance
          .connect(addr2)
          .buyTokenByERC20Token(lrtAmount, token, roundId)
      ).to.be.revertedWith(SaleErrorMsg.SALE_NOT_ACTIVE);
    });

    it("Should revert when approve amount not enough", async function () {
      const lrtAmount = ethers.utils.parseUnits("10", 18);
      const lrtPrice = await lrtPreSaleInstance.lrtPrice();
      const token = Helper.stringToBytes16("WBTC");

      const discountPercentage = await lrtPreSaleInstance.discount();
      const roundId = 123;
      const mockPrice = ethers.utils.parseUnits("10", 8);

      await aggregatorInstance.setLatestRoundData(roundId, mockPrice, 0, 0, 0);

      // Call the getRoundData() function
      const [, price, , ,] = await aggregatorInstance.getRoundData(roundId);

      let totalPay = 0;
      let discountAmount = 0;
      let amountOut = 0;

      const requiredAmount = lrtAmount
        .mul(lrtPrice)
        .div(ethers.BigNumber.from("1000000000000000000"));

      discountAmount = requiredAmount
        .mul(discountPercentage)
        .div(ethers.BigNumber.from("10000"));

      if (await lrtPreSaleInstance.eligibleAddresses(addr2.address)) {
        totalPay = requiredAmount.sub(discountAmount);
      } else {
        totalPay = requiredAmount;
      }

      if (token == Helper.stringToBytes16("WBTC")) {
        const priceWith10decimal = ethers.BigNumber.from("100").mul(
          Number(price)
        );

        amountOut = totalPay.div(priceWith10decimal);
      } else {
        amountOut = totalPay
          .div(Number(price))
          .mul(ethers.BigNumber.from("100000000"));
      }

      await wbtcInstance.connect(addr2).approve(lrtPreSaleInstance.address, 0);

      // Call buyTokenByERC20Token function with an insufficient balance
      await expect(
        lrtPreSaleInstance
          .connect(addr2)
          .buyTokenByERC20Token(lrtAmount, token, roundId)
      ).to.be.revertedWith(SaleErrorMsg.ALLOWANCE_ERROR);
    });

    it("Should revert when LRT amount is lower than minLrtPreUser", async function () {
      // Set up the test data and environment
      const lrtAmount = ethers.utils.parseUnits("5", 18);
      const lrtPrice = await lrtPreSaleInstance.lrtPrice();
      const token = Helper.stringToBytes16("WBTC");

      const discountPercentage = await lrtPreSaleInstance.discount();

      const roundId = 123;
      const mockPrice = ethers.utils.parseUnits("10", 8);

      await aggregatorInstance.setLatestRoundData(roundId, mockPrice, 0, 0, 0);

      // Call the getRoundData() function
      const [, price, , ,] = await aggregatorInstance.getRoundData(roundId);

      let totalPay = 0;
      let discountAmount = 0;
      let amountOut = 0;

      const requiredAmount = lrtAmount
        .mul(lrtPrice)
        .div(ethers.BigNumber.from("1000000000000000000"));

      discountAmount = requiredAmount
        .mul(discountPercentage)
        .div(ethers.BigNumber.from("10000"));

      if (await lrtPreSaleInstance.eligibleAddresses(addr2.address)) {
        totalPay = requiredAmount.sub(discountAmount);
      } else {
        totalPay = requiredAmount;
      }

      if (token == Helper.stringToBytes16("WBTC")) {
        const priceWith10decimal = ethers.BigNumber.from("100").mul(
          Number(price)
        );

        amountOut = totalPay.div(priceWith10decimal);
      } else {
        amountOut = totalPay
          .div(Number(price))
          .mul(ethers.BigNumber.from("100000000"));
      }

      await wbtcInstance
        .connect(addr2)
        .approve(lrtPreSaleInstance.address, amountOut);

      await expect(
        lrtPreSaleInstance
          .connect(addr2)
          .buyTokenByERC20Token(lrtAmount, token, roundId)
      ).to.be.revertedWith(SaleErrorMsg.TOO_LOW_AMOUNT);
    });

    it("Should revert when LRT token is not exist", async function () {
      // Set up the test data and environment
      const lrtAmount = ethers.utils.parseUnits("10", 18);
      const lrtPrice = await lrtPreSaleInstance.lrtPrice();
      const token = Helper.stringToBytes16("WBTDDC");
      const discountPercentage = await lrtPreSaleInstance.discount();
      const roundId = 123;
      const mockPrice = ethers.utils.parseUnits("10", 8);

      await aggregatorInstance.setLatestRoundData(roundId, mockPrice, 0, 0, 0);

      // Call the getRoundData() function
      const [, price, , ,] = await aggregatorInstance.getRoundData(roundId);

      let totalPay = 0;
      let discountAmount = 0;
      let amountOut = 0;

      const requiredAmount = lrtAmount
        .mul(lrtPrice)
        .div(ethers.BigNumber.from("1000000000000000000"));

      discountAmount = requiredAmount
        .mul(discountPercentage)
        .div(ethers.BigNumber.from("10000"));

      if (await lrtPreSaleInstance.eligibleAddresses(addr2.address)) {
        totalPay = requiredAmount.sub(discountAmount);
      } else {
        totalPay = requiredAmount;
      }

      if (token == Helper.stringToBytes16("WBTC")) {
        const priceWith10decimal = ethers.BigNumber.from("100").mul(
          Number(price)
        );

        amountOut = totalPay.div(priceWith10decimal);
      } else {
        amountOut = totalPay
          .div(Number(price))
          .mul(ethers.BigNumber.from("100000000"));
      }
      await wbtcInstance
        .connect(addr2)
        .approve(lrtPreSaleInstance.address, amountOut);

      await expect(
        lrtPreSaleInstance
          .connect(addr2)
          .buyTokenByERC20Token(lrtAmount, token, roundId)
      ).to.be.revertedWith(SaleErrorMsg.TOKEN_NOT_EXIST);
    });
  });

  describe("buy with stable coin(usdc,usdt,dai)", function () {
    it("Should buy tokens with stable coin", async function () {
      // Set up the test data
      const lrtAmount = ethers.utils.parseUnits("10", 18);
      const lrtPrice = await lrtPreSaleInstance.lrtPrice();
      const token = Helper.stringToBytes16("USDC");

      const discountPercentage = await lrtPreSaleInstance.discount();

      let totalPay = 0;
      let discountAmount = 0;

      const requiredAmount = lrtAmount
        .mul(lrtPrice)
        .div(ethers.BigNumber.from("1000000000000000000"));

      discountAmount = requiredAmount
        .mul(discountPercentage)
        .div(ethers.BigNumber.from("10000"));

      if (await lrtPreSaleInstance.eligibleAddresses(addr2.address)) {
        totalPay = requiredAmount.sub(discountAmount);
      } else {
        totalPay = requiredAmount;
      }

      const amountOut = totalPay.div(1e12);
      await usdcInstance
        .connect(addr2)
        .approve(lrtPreSaleInstance.address, amountOut);

      const oldContractBalance = await ethers.provider.getBalance(
        lrtPreSaleInstance.address
      );
      const oldLrtTSold = await lrtPreSaleInstance.lrtSold();

      //   // // Call buyTokenByERC20Token function
      const tx = await lrtPreSaleInstance
        .connect(addr2)
        .buyTokenByStableCoin(lrtAmount, token);

      await expect(tx)
        .to.emit(lrtPreSaleInstance, "PurchasedByStableCoin")
        .withArgs(addr2.address, lrtAmount, amountOut, usdcInstance.address);
      const newContractBalance = await wbtcInstance.balanceOf(
        lrtPreSaleInstance.address
      );

      const lrtTokenShare = await lrtPreSaleInstance.lrtTokenShare(
        addr2.address
      );
      const lrtTSold = await lrtPreSaleInstance.lrtSold();

      const oldTreasuryBalance = await usdcInstance.balanceOf(treasury.address);

      const usdcBalance = await usdcInstance.balanceOf(
        lrtPreSaleInstance.address
      );

      const contractBalanceAfterSwap = await ethers.provider.getBalance(
        lrtPreSaleInstance.address
      );

      //   //   // check withdraw success
      const withdrawTx = await lrtPreSaleInstance
        .connect(admin)
        .withdraw(usdcBalance, usdcInstance.address);

      await expect(withdrawTx)
        .to.emit(lrtPreSaleInstance, "WithdrawedBalance")
        .withArgs(treasury.address, usdcBalance, usdcInstance.address);

      const newTreasuryBalance = await usdcInstance.balanceOf(treasury.address);

      // revert withdraw
      // check caller
      await expect(
        lrtPreSaleInstance
          .connect(owner)
          .withdraw(usdcBalance, usdcInstance.address)
      ).to.be.revertedWith(AccessErrorMsg.CALLER_NOT_ADMIN);

      //check valid distenation address
      const zeroAddress = "0x0000000000000000000000000000000000000000";
      await expect(
        lrtPreSaleInstance.connect(admin).withdraw(usdcBalance, zeroAddress)
      ).to.be.revertedWith(SaleErrorMsg.NOT_VALID_ADDRESS);

      //   //check not pass low amount
      await expect(
        lrtPreSaleInstance.connect(admin).withdraw(0, usdcInstance.address)
      ).to.be.revertedWith(SaleErrorMsg.VALID_AMOUNT);

      //insufficent balance
      await expect(
        lrtPreSaleInstance
          .connect(admin)
          .withdraw(2000000, usdcInstance.address)
      ).to.be.revertedWith(SaleErrorMsg.INSUFFICIENT_BALANCE);

      expect(newTreasuryBalance).to.equal(oldTreasuryBalance.add(usdcBalance));
      expect(lrtTokenShare).to.equal(lrtAmount);
      expect(lrtTSold).to.equal(oldLrtTSold.add(lrtAmount));
    });

    it("Should buy tokens with stable coin with USDT", async function () {
      // Set up the test data
      const lrtAmount = ethers.utils.parseUnits("10", 18);
      const lrtPrice = await lrtPreSaleInstance.lrtPrice();
      const token = Helper.stringToBytes16("USDT");

      const discountPercentage = await lrtPreSaleInstance.discount();

      let totalPay = 0;
      let discountAmount = 0;

      const requiredAmount = lrtAmount
        .mul(lrtPrice)
        .div(ethers.BigNumber.from("1000000000000000000"));

      discountAmount = requiredAmount
        .mul(discountPercentage)
        .div(ethers.BigNumber.from("10000"));

      if (await lrtPreSaleInstance.eligibleAddresses(addr2.address)) {
        totalPay = requiredAmount.sub(discountAmount);
      } else {
        totalPay = requiredAmount;
      }

      const amountOut = totalPay.div(1e12);
      await usdtInstance
        .connect(addr2)
        .approve(lrtPreSaleInstance.address, amountOut);

      const oldContractBalance = await ethers.provider.getBalance(
        lrtPreSaleInstance.address
      );
      const oldLrtTSold = await lrtPreSaleInstance.lrtSold();

      //   // // Call buyTokenByERC20Token function
      const tx = await lrtPreSaleInstance
        .connect(addr2)
        .buyTokenByStableCoin(lrtAmount, token);

      await expect(tx)
        .to.emit(lrtPreSaleInstance, "PurchasedByStableCoin")
        .withArgs(addr2.address, lrtAmount, amountOut, usdtInstance.address);
      const newContractBalance = await usdtInstance.balanceOf(
        lrtPreSaleInstance.address
      );

      const lrtTokenShare = await lrtPreSaleInstance.lrtTokenShare(
        addr2.address
      );
      const lrtTSold = await lrtPreSaleInstance.lrtSold();

      const oldTreasuryBalance = await usdtInstance.balanceOf(treasury.address);

      const usdtBalance = await usdtInstance.balanceOf(
        lrtPreSaleInstance.address
      );

      const contractBalanceAfterSwap = await ethers.provider.getBalance(
        lrtPreSaleInstance.address
      );

      //   //   // check withdraw success
      const withdrawTx = await lrtPreSaleInstance
        .connect(admin)
        .withdraw(usdtBalance, usdtInstance.address);

      await expect(withdrawTx)
        .to.emit(lrtPreSaleInstance, "WithdrawedBalance")
        .withArgs(treasury.address, usdtBalance, usdtInstance.address);

      const newTreasuryBalance = await usdtInstance.balanceOf(treasury.address);

      // revert withdraw
      // check caller
      await expect(
        lrtPreSaleInstance
          .connect(owner)
          .withdraw(usdtBalance, usdtInstance.address)
      ).to.be.revertedWith(AccessErrorMsg.CALLER_NOT_ADMIN);

      //check valid distenation address
      const zeroAddress = "0x0000000000000000000000000000000000000000";
      await expect(
        lrtPreSaleInstance.connect(admin).withdraw(usdtBalance, zeroAddress)
      ).to.be.revertedWith(SaleErrorMsg.NOT_VALID_ADDRESS);

      //   //check not pass low amount
      await expect(
        lrtPreSaleInstance.connect(admin).withdraw(0, usdtInstance.address)
      ).to.be.revertedWith(SaleErrorMsg.VALID_AMOUNT);

      //insufficent balance
      await expect(
        lrtPreSaleInstance
          .connect(admin)
          .withdraw(2000000, usdtInstance.address)
      ).to.be.revertedWith(SaleErrorMsg.INSUFFICIENT_BALANCE);

      expect(newTreasuryBalance).to.equal(oldTreasuryBalance.add(usdtBalance));
      expect(lrtTokenShare).to.equal(lrtAmount);
      expect(lrtTSold).to.equal(oldLrtTSold.add(lrtAmount));
    });

    it("Should buy tokens with erc20 coin when buy cap has set", async function () {
      // Set up the test data
      await lrtPreSaleInstance.connect(admin).setBuyCap(2);

      const lrtAmount = ethers.utils.parseUnits("10", 18);
      const lrtPrice = await lrtPreSaleInstance.lrtPrice();
      const token = Helper.stringToBytes16("USDC");

      const discountPercentage = await lrtPreSaleInstance.discount();

      let totalPay = 0;
      let discountAmount = 0;

      const requiredAmount = lrtAmount
        .mul(lrtPrice)
        .div(ethers.BigNumber.from("1000000000000000000"));

      discountAmount = requiredAmount
        .mul(discountPercentage)
        .div(ethers.BigNumber.from("10000"));

      if (await lrtPreSaleInstance.eligibleAddresses(addr2.address)) {
        totalPay = requiredAmount.sub(discountAmount);
      } else {
        totalPay = requiredAmount;
      }

      const amountOut = totalPay.div(1e12);
      await usdcInstance
        .connect(addr2)
        .approve(lrtPreSaleInstance.address, amountOut);

      //   // // Call buyTokenByERC20Token function
      await lrtPreSaleInstance
        .connect(addr2)
        .buyTokenByStableCoin(lrtAmount, token);

      await usdcInstance
        .connect(addr2)
        .approve(lrtPreSaleInstance.address, amountOut);
      await lrtPreSaleInstance
        .connect(addr2)
        .buyTokenByStableCoin(lrtAmount, token);

      expect(
        await lrtPreSaleInstance.userDailyPurchaseCount(addr2.address)
      ).to.equal(2);
      // expect(lrtTokenShare).to.equal(lrtAmount);
      // expect(lrtTSold).to.equal(oldLrtTSold.add(lrtAmount));
    });

    it("Should not allow to buy tokens with erc20 coin when buy cap has set and user limitation has reached", async function () {
      // Set up the test data
      await lrtPreSaleInstance.connect(admin).setBuyCap(2);

      const lrtAmount = ethers.utils.parseUnits("10", 18);
      const lrtPrice = await lrtPreSaleInstance.lrtPrice();
      const token = Helper.stringToBytes16("USDC");

      const discountPercentage = await lrtPreSaleInstance.discount();

      let totalPay = 0;
      let discountAmount = 0;

      const requiredAmount = lrtAmount
        .mul(lrtPrice)
        .div(ethers.BigNumber.from("1000000000000000000"));

      discountAmount = requiredAmount
        .mul(discountPercentage)
        .div(ethers.BigNumber.from("10000"));

      if (await lrtPreSaleInstance.eligibleAddresses(addr2.address)) {
        totalPay = requiredAmount.sub(discountAmount);
      } else {
        totalPay = requiredAmount;
      }

      const amountOut = totalPay.div(1e12);
      await usdcInstance
        .connect(addr2)
        .approve(lrtPreSaleInstance.address, amountOut);

      //   // // Call buyTokenByERC20Token function
      await lrtPreSaleInstance
        .connect(addr2)
        .buyTokenByStableCoin(lrtAmount, token);

      await usdcInstance
        .connect(addr2)
        .approve(lrtPreSaleInstance.address, amountOut);
      await lrtPreSaleInstance
        .connect(addr2)
        .buyTokenByStableCoin(lrtAmount, token);

      await usdcInstance
        .connect(addr2)
        .approve(lrtPreSaleInstance.address, amountOut);
      await expect(
        lrtPreSaleInstance.connect(addr2).buyTokenByStableCoin(lrtAmount, token)
      ).to.be.revertedWith(SaleErrorMsg.DAILY_LIMIT);
    });

    it("Should not allow to buy tokens with erc20 coin when buy cap has set and user limitation has reached but user tried 24 hours later", async function () {
      // Set up the test data
      await lrtPreSaleInstance.connect(admin).setBuyCap(2);

      const lrtAmount = ethers.utils.parseUnits("10", 18);
      const lrtPrice = await lrtPreSaleInstance.lrtPrice();
      const token = Helper.stringToBytes16("USDC");

      const discountPercentage = await lrtPreSaleInstance.discount();

      let totalPay = 0;
      let discountAmount = 0;

      const requiredAmount = lrtAmount
        .mul(lrtPrice)
        .div(ethers.BigNumber.from("1000000000000000000"));

      discountAmount = requiredAmount
        .mul(discountPercentage)
        .div(ethers.BigNumber.from("10000"));

      if (await lrtPreSaleInstance.eligibleAddresses(addr2.address)) {
        totalPay = requiredAmount.sub(discountAmount);
      } else {
        totalPay = requiredAmount;
      }

      const amountOut = totalPay.div(1e12);
      await usdcInstance
        .connect(addr2)
        .approve(lrtPreSaleInstance.address, amountOut);

      //   // // Call buyTokenByERC20Token function
      await lrtPreSaleInstance
        .connect(addr2)
        .buyTokenByStableCoin(lrtAmount, token);

      await usdcInstance
        .connect(addr2)
        .approve(lrtPreSaleInstance.address, amountOut);

      await lrtPreSaleInstance
        .connect(addr2)
        .buyTokenByStableCoin(lrtAmount, token);

      await usdcInstance
        .connect(addr2)
        .approve(lrtPreSaleInstance.address, amountOut);

      await expect(
        lrtPreSaleInstance.connect(addr2).buyTokenByStableCoin(lrtAmount, token)
      ).to.be.revertedWith(SaleErrorMsg.DAILY_LIMIT);

      const elapsedTime = await Helper.convertToSeconds("days", 1);

      await network.provider.send("evm_increaseTime", [elapsedTime]);
      await network.provider.send("evm_mine");

      await usdcInstance
        .connect(addr2)
        .approve(lrtPreSaleInstance.address, amountOut);
      await lrtPreSaleInstance
        .connect(addr2)
        .buyTokenByStableCoin(lrtAmount, token);

      expect(
        await lrtPreSaleInstance.userDailyPurchaseCount(addr2.address)
      ).to.equal(1);
    });

    it("Should revert when LRT limit is exceeded", async function () {
      // Set up the test data and environment
      const lrtAmount = ethers.utils.parseUnits("1000", 18);
      const lrtPrice = await lrtPreSaleInstance.lrtPrice();
      const token = Helper.stringToBytes16("USDC");

      const discountPercentage = await lrtPreSaleInstance.discount();

      let totalPay = 0;
      let discountAmount = 0;

      const requiredAmount = lrtAmount
        .mul(lrtPrice)
        .div(ethers.BigNumber.from("1000000000000000000"));

      discountAmount = requiredAmount
        .mul(discountPercentage)
        .div(ethers.BigNumber.from("10000"));

      if (await lrtPreSaleInstance.eligibleAddresses(addr2.address)) {
        totalPay = requiredAmount.sub(discountAmount);
      } else {
        totalPay = requiredAmount;
      }

      const amountOut = totalPay.div(1e12);
      await usdcInstance
        .connect(addr2)
        .approve(lrtPreSaleInstance.address, amountOut);

      // Call buyTokenByERC20Token function with an amount that exceeds the limit
      await expect(
        lrtPreSaleInstance.connect(addr2).buyTokenByStableCoin(lrtAmount, token)
      ).to.be.revertedWith(SaleErrorMsg.LIMIT_EXCEED);
    });

    it("Should revert when sale is not active", async function () {
      // Set up the test data and environment
      await lrtPreSaleInstance.connect(admin).setSaleStatus(false);
      const lrtAmount = ethers.utils.parseUnits("10", 18);
      const lrtPrice = await lrtPreSaleInstance.lrtPrice();
      const token = Helper.stringToBytes16("USDC");

      const discountPercentage = await lrtPreSaleInstance.discount();

      let totalPay = 0;
      let discountAmount = 0;

      const requiredAmount = lrtAmount
        .mul(lrtPrice)
        .div(ethers.BigNumber.from("1000000000000000000"));

      discountAmount = requiredAmount
        .mul(discountPercentage)
        .div(ethers.BigNumber.from("10000"));

      if (await lrtPreSaleInstance.eligibleAddresses(addr2.address)) {
        totalPay = requiredAmount.sub(discountAmount);
      } else {
        totalPay = requiredAmount;
      }

      const amountOut = totalPay.div(1e12);
      await usdcInstance
        .connect(addr2)
        .approve(lrtPreSaleInstance.address, amountOut);

      // Increase the time to exceed the time limit
      await network.provider.send("evm_increaseTime", [16836424655]);
      await network.provider.send("evm_mine");

      // Call buyTokenByERC20Token function after the time limit
      await expect(
        lrtPreSaleInstance.connect(addr2).buyTokenByStableCoin(lrtAmount, token)
      ).to.be.revertedWith(SaleErrorMsg.SALE_NOT_ACTIVE);
    });

    it("Should revert when approve amount not enough", async function () {
      const lrtAmount = ethers.utils.parseUnits("10", 18);
      const lrtPrice = await lrtPreSaleInstance.lrtPrice();
      const token = Helper.stringToBytes16("USDC");

      const discountPercentage = await lrtPreSaleInstance.discount();

      let totalPay = 0;
      let discountAmount = 0;

      const requiredAmount = lrtAmount
        .mul(lrtPrice)
        .div(ethers.BigNumber.from("1000000000000000000"));

      discountAmount = requiredAmount
        .mul(discountPercentage)
        .div(ethers.BigNumber.from("10000"));

      if (await lrtPreSaleInstance.eligibleAddresses(addr2.address)) {
        totalPay = requiredAmount.sub(discountAmount);
      } else {
        totalPay = requiredAmount;
      }

      const amountOut = totalPay.div(1e12);
      await usdcInstance.connect(addr2).approve(lrtPreSaleInstance.address, 0);

      // Call buyTokenByERC20Token function with an insufficient balance
      await expect(
        lrtPreSaleInstance.connect(addr2).buyTokenByStableCoin(lrtAmount, token)
      ).to.be.revertedWith(SaleErrorMsg.ALLOWANCE_ERROR);
    });

    it("Should revert when LRT amount is too low", async function () {
      // Set up the test data and environment
      const lrtAmount = ethers.utils.parseUnits("5", 18);
      const lrtPrice = await lrtPreSaleInstance.lrtPrice();
      const token = Helper.stringToBytes16("USDC");
      const discountPercentage = await lrtPreSaleInstance.discount();

      let totalPay = 0;
      let discountAmount = 0;

      const requiredAmount = lrtAmount
        .mul(lrtPrice)
        .div(ethers.BigNumber.from("1000000000000000000"));

      discountAmount = requiredAmount
        .mul(discountPercentage)
        .div(ethers.BigNumber.from("10000"));

      if (await lrtPreSaleInstance.eligibleAddresses(addr2.address)) {
        totalPay = requiredAmount.sub(discountAmount);
      } else {
        totalPay = requiredAmount;
      }

      const amountOut = totalPay.div(1e12);
      await usdcInstance
        .connect(addr2)
        .approve(lrtPreSaleInstance.address, amountOut);

      await expect(
        lrtPreSaleInstance.connect(addr2).buyTokenByStableCoin(lrtAmount, token)
      ).to.be.revertedWith(SaleErrorMsg.TOO_LOW_AMOUNT);
    });

    it("Should revert when LRT token is not exist", async function () {
      // Set up the test data and environment
      const lrtAmount = ethers.utils.parseUnits("10", 18);
      const lrtPrice = await lrtPreSaleInstance.lrtPrice();
      const token = Helper.stringToBytes16("USDsC");

      const discountPercentage = await lrtPreSaleInstance.discount();

      let totalPay = 0;
      let discountAmount = 0;

      const requiredAmount = lrtAmount
        .mul(lrtPrice)
        .div(ethers.BigNumber.from("1000000000000000000"));

      discountAmount = requiredAmount
        .mul(discountPercentage)
        .div(ethers.BigNumber.from("10000"));

      if (await lrtPreSaleInstance.eligibleAddresses(addr2.address)) {
        totalPay = requiredAmount.sub(discountAmount);
      } else {
        totalPay = requiredAmount;
      }

      const amountOut = totalPay.div(1e12);
      await usdcInstance
        .connect(addr2)
        .approve(lrtPreSaleInstance.address, amountOut);
      await expect(
        lrtPreSaleInstance.connect(addr2).buyTokenByStableCoin(lrtAmount, token)
      ).to.be.revertedWith(SaleErrorMsg.TOKEN_NOT_EXIST);
    });
  });

  describe("buy with coin (bnb,eth)", function () {
    it("should allow investor to buy LRT with coin", async function () {
      // Buy LRT tokens with stable coins
      const lrtAmount = ethers.utils.parseUnits("10", 18);
      const lrtPrice = await lrtPreSaleInstance.lrtPrice();

      const boughtAmount = lrtPrice
        .mul(lrtAmount)
        .div(ethers.BigNumber.from("10").pow(18));

      const oldLrtTSold = await lrtPreSaleInstance.lrtSold();

      const tx = await lrtPreSaleInstance
        .connect(script)
        .buyTokenByCoin(lrtAmount, addr1.address);

      await expect(tx)
        .to.emit(lrtPreSaleInstance, "PurchasedByCoin")
        .withArgs(addr1.address, lrtAmount);

      const lrtTokenShare = await lrtPreSaleInstance.lrtTokenShare(
        addr1.address
      );
      const lrtTSold = await lrtPreSaleInstance.lrtSold();
      expect(lrtTokenShare).to.equal(lrtAmount);
      expect(lrtTSold).to.equal(oldLrtTSold.add(lrtAmount));
    });

    it("Should buy tokens with coin when buy cap has set", async function () {
      // Set up the test data
      await lrtPreSaleInstance.connect(admin).setBuyCap(2);

      const lrtAmount = ethers.utils.parseUnits("10", 18);
      const lrtPrice = await lrtPreSaleInstance.lrtPrice();

      const boughtAmount = lrtPrice
        .mul(lrtAmount)
        .div(ethers.BigNumber.from("10").pow(18));

      await lrtPreSaleInstance
        .connect(script)
        .buyTokenByCoin(lrtAmount, addr1.address);

      await lrtPreSaleInstance
        .connect(script)
        .buyTokenByCoin(lrtAmount, addr1.address);

      expect(
        await lrtPreSaleInstance.userDailyPurchaseCount(addr1.address)
      ).to.equal(2);
      // expect(lrtTokenShare).to.equal(lrtAmount);
      // expect(lrtTSold).to.equal(oldLrtTSold.add(lrtAmount));
    });

    it("Should not allow to buy tokens with coin when buy cap has set and user limitation has reached", async function () {
      // Set up the test data
      await lrtPreSaleInstance.connect(admin).setBuyCap(2);

      const lrtAmount = ethers.utils.parseUnits("10", 18);
      const lrtPrice = await lrtPreSaleInstance.lrtPrice();

      const boughtAmount = lrtPrice
        .mul(lrtAmount)
        .div(ethers.BigNumber.from("10").pow(18));

      const oldLrtTSold = await lrtPreSaleInstance.lrtSold();

      await lrtPreSaleInstance
        .connect(script)
        .buyTokenByCoin(lrtAmount, addr1.address);

      await lrtPreSaleInstance
        .connect(script)
        .buyTokenByCoin(lrtAmount, addr1.address);

      await expect(
        lrtPreSaleInstance
          .connect(script)
          .buyTokenByCoin(lrtAmount, addr1.address)
      ).to.be.revertedWith(SaleErrorMsg.DAILY_LIMIT);
    });

    it("Should not allow to buy tokens with coin when buy cap has set and user limitation has reached but user tried 24 hours later", async function () {
      // Set up the test data
      await lrtPreSaleInstance.connect(admin).setBuyCap(2);

      const lrtAmount = ethers.utils.parseUnits("10", 18);
      const lrtPrice = await lrtPreSaleInstance.lrtPrice();

      const boughtAmount = lrtPrice
        .mul(lrtAmount)
        .div(ethers.BigNumber.from("10").pow(18));

      await lrtPreSaleInstance
        .connect(script)
        .buyTokenByCoin(lrtAmount, addr1.address);

      await lrtPreSaleInstance
        .connect(script)
        .buyTokenByCoin(lrtAmount, addr1.address);

      await expect(
        lrtPreSaleInstance
          .connect(script)
          .buyTokenByCoin(lrtAmount, addr1.address)
      ).to.be.revertedWith(SaleErrorMsg.DAILY_LIMIT);

      const elapsedTime = await Helper.convertToSeconds("days", 1);

      await network.provider.send("evm_increaseTime", [elapsedTime]);
      await network.provider.send("evm_mine");

      await lrtPreSaleInstance
        .connect(script)
        .buyTokenByCoin(lrtAmount, addr1.address);

      expect(
        await lrtPreSaleInstance.userDailyPurchaseCount(addr1.address)
      ).to.equal(1);
    });

    it("Should revert when LRT limit is exceeded", async function () {
      // Set up the test data and environment
      const lrtAmount = ethers.utils.parseUnits("10000", 18);

      await expect(
        lrtPreSaleInstance
          .connect(script)
          .buyTokenByCoin(lrtAmount, addr1.address)
      ).to.be.revertedWith(SaleErrorMsg.LIMIT_EXCEED);
    });

    it("Should revert when LRT amount is too low", async function () {
      // Set up the test data and environment
      const lrtAmount = ethers.utils.parseUnits("0", 18);

      await expect(
        lrtPreSaleInstance
          .connect(script)
          .buyTokenByCoin(lrtAmount, addr1.address)
      ).to.be.revertedWith(SaleErrorMsg.TOO_LOW_AMOUNT);
    });

    it("Should revert when sale is not active", async function () {
      // Set up the test data and environment
      await lrtPreSaleInstance.connect(admin).setSaleStatus(false);
      const lrtAmount = ethers.utils.parseUnits("10", 18);

      // Increase the time to exceed the time limit
      await network.provider.send("evm_increaseTime", [16836424655]);
      await network.provider.send("evm_mine");

      await expect(
        lrtPreSaleInstance
          .connect(script)
          .buyTokenByCoin(lrtAmount, addr1.address)
      ).to.be.revertedWith(SaleErrorMsg.SALE_NOT_ACTIVE);
    });

    it("Should revert when caller is not script ", async function () {
      // Set up the test data and environment
      const lrtAmount = ethers.utils.parseUnits("10", 18);

      await expect(
        lrtPreSaleInstance
          .connect(addr1)
          .buyTokenByCoin(lrtAmount, admin.address)
      ).to.be.revertedWith(AccessErrorMsg.CALLER_NOT_SCRIPT);
    });

    it("Should revert when stable beneficiary adderss is not valid", async function () {
      const lrtAmount = ethers.utils.parseUnits("10", 18);

      const zeroAddress = "0x0000000000000000000000000000000000000000";

      await expect(
        lrtPreSaleInstance
          .connect(script)
          .buyTokenByCoin(lrtAmount, zeroAddress)
      ).to.be.revertedWith(SaleErrorMsg.NOT_VALID_ADDRESS);
    });
  });

  describe("buy with fiat coin", function () {
    it("should allow investor to buy LRT with fiat", async function () {
      // Buy LRT tokens with stable coins

      const lrtAmount = ethers.utils.parseUnits("10", 18);

      const oldLrtTSold = await lrtPreSaleInstance.lrtSold();

      const tx = await lrtPreSaleInstance
        .connect(addr2)
        .buyTokenByFiat(lrtAmount, addr1.address);

      await expect(tx)
        .to.emit(lrtPreSaleInstance, "PurchasedByFiat")
        .withArgs(addr1.address, lrtAmount);

      const lrtTokenShare = await lrtPreSaleInstance.lrtTokenShare(
        addr1.address
      );
      const lrtTSold = await lrtPreSaleInstance.lrtSold();
      expect(lrtTokenShare).to.equal(lrtAmount);
      expect(lrtTSold).to.equal(oldLrtTSold.add(lrtAmount));
    });

    it("Should buy tokens with fiat when buy cap has set", async function () {
      // Set up the test data
      await lrtPreSaleInstance.connect(admin).setBuyCap(2);

      const lrtAmount = ethers.utils.parseUnits("10", 18);

      await lrtPreSaleInstance
        .connect(addr2)
        .buyTokenByFiat(lrtAmount, addr1.address);

      await lrtPreSaleInstance
        .connect(addr2)
        .buyTokenByFiat(lrtAmount, addr1.address);

      expect(
        await lrtPreSaleInstance.userDailyPurchaseCount(addr1.address)
      ).to.equal(2);
      // expect(lrtTokenShare).to.equal(lrtAmount);
      // expect(lrtTSold).to.equal(oldLrtTSold.add(lrtAmount));
    });

    it("Should not allow to buy tokens with coin when buy cap has set and user limitation has reached", async function () {
      // Set up the test data
      await lrtPreSaleInstance.connect(admin).setBuyCap(2);

      const lrtAmount = ethers.utils.parseUnits("10", 18);

      await lrtPreSaleInstance
        .connect(addr2)
        .buyTokenByFiat(lrtAmount, addr1.address);

      await lrtPreSaleInstance
        .connect(addr2)
        .buyTokenByFiat(lrtAmount, addr1.address);

      await expect(
        lrtPreSaleInstance
          .connect(addr2)
          .buyTokenByFiat(lrtAmount, addr1.address)
      ).to.be.revertedWith(SaleErrorMsg.DAILY_LIMIT);
    });

    it("Should not allow to buy tokens with coin when buy cap has set and user limitation has reached but user tried 24 hours later", async function () {
      // Set up the test data
      await lrtPreSaleInstance.connect(admin).setBuyCap(2);

      const lrtAmount = ethers.utils.parseUnits("10", 18);

      await lrtPreSaleInstance
        .connect(addr2)
        .buyTokenByFiat(lrtAmount, addr1.address);

      await lrtPreSaleInstance
        .connect(addr2)
        .buyTokenByFiat(lrtAmount, addr1.address);

      await expect(
        lrtPreSaleInstance
          .connect(addr2)
          .buyTokenByFiat(lrtAmount, addr1.address)
      ).to.be.revertedWith(SaleErrorMsg.DAILY_LIMIT);

      const elapsedTime = await Helper.convertToSeconds("days", 1);

      await network.provider.send("evm_increaseTime", [elapsedTime]);
      await network.provider.send("evm_mine");

      await lrtPreSaleInstance
        .connect(addr2)
        .buyTokenByFiat(lrtAmount, addr1.address);
      expect(
        await lrtPreSaleInstance.userDailyPurchaseCount(addr1.address)
      ).to.equal(1);
    });

    it("Should revert when LRT limit is exceeded", async function () {
      // Set up the test data and environment
      const lrtAmount = ethers.utils.parseUnits("10000", 18);

      await expect(
        lrtPreSaleInstance
          .connect(addr2)
          .buyTokenByFiat(lrtAmount, addr1.address)
      ).to.be.revertedWith(SaleErrorMsg.LIMIT_EXCEED);
    });

    it("Should revert when LRT amount is too low", async function () {
      // Set up the test data and environment
      const lrtAmount = ethers.utils.parseUnits("0", 18);

      await expect(
        lrtPreSaleInstance
          .connect(addr2)
          .buyTokenByFiat(lrtAmount, addr1.address)
      ).to.be.revertedWith(SaleErrorMsg.TOO_LOW_AMOUNT);
    });

    it("Should revert when sale is not active", async function () {
      await lrtPreSaleInstance.connect(admin).setSaleStatus(false);
      // Set up the test data and environment
      const lrtAmount = ethers.utils.parseUnits("10", 18);

      // Increase the time to exceed the time limit
      await network.provider.send("evm_increaseTime", [16836424655]);
      await network.provider.send("evm_mine");

      await expect(
        lrtPreSaleInstance
          .connect(addr2)
          .buyTokenByFiat(lrtAmount, addr1.address)
      ).to.be.revertedWith(SaleErrorMsg.SALE_NOT_ACTIVE);
    });

    it("Should revert when caller is not WERT", async function () {
      // Set up the test data and environment
      const lrtAmount = ethers.utils.parseUnits("10", 18);

      await expect(
        lrtPreSaleInstance
          .connect(admin)
          .buyTokenByFiat(lrtAmount, admin.address)
      ).to.be.revertedWith(AccessErrorMsg.CALLER_NOT_WERT);
    });

    it("Should revert when stable beneficiary adderss is not valid", async function () {
      const lrtAmount = ethers.utils.parseUnits("10", 18);

      const zeroAddress = "0x0000000000000000000000000000000000000000";

      await expect(
        lrtPreSaleInstance.connect(addr2).buyTokenByFiat(lrtAmount, zeroAddress)
      ).to.be.revertedWith(SaleErrorMsg.NOT_VALID_ADDRESS);
    });

    it("Should revert when the function has paused", async function () {
      const lrtAmount = ethers.utils.parseUnits("10", 18);
      await arInstance.connect(owner).pause();

      await expect(
        lrtPreSaleInstance
          .connect(addr2)
          .buyTokenByFiat(lrtAmount, addr1.address)
      ).to.be.revertedWith(AccessErrorMsg.PAUSEABLE_PAUSED);
    });
  });

  describe("check some admin function", function () {
    it("Should revert set treasury address when address is not valid", async function () {
      await expect(
        lrtPreSaleInstance.connect(admin).setTreasuryAddress(treasury.address)
      )
        .to.emit(lrtPreSaleInstance, "TreasurySet")
        .withArgs(treasury.address);

      const zeroAddress = "0x0000000000000000000000000000000000000000";

      await expect(
        lrtPreSaleInstance.connect(addr2).setTreasuryAddress(treasury.address)
      ).to.be.revertedWith(AccessErrorMsg.CALLER_NOT_ADMIN);

      await expect(
        lrtPreSaleInstance.connect(admin).setTreasuryAddress(zeroAddress)
      ).to.be.revertedWith(SaleErrorMsg.NOT_VALID_ADDRESS);
    });

    it("Should revert set payment token when caller is not admin", async function () {
      await expect(
        lrtPreSaleInstance
          .connect(addr1)
          .setPaymentTokens(Helper.stringToBytes16("DAI"), daiInstance.address)
      ).to.be.revertedWith(AccessErrorMsg.CALLER_NOT_ADMIN);
    });
    it("Should revert set planId when caller is not admin", async function () {
      await expect(lrtPreSaleInstance.connect(admin).setPlanID(0))
        .to.emit(lrtPreSaleInstance, "PlanIdSet")
        .withArgs(0);

      await expect(
        lrtPreSaleInstance.connect(addr1).setPlanID(0)
      ).to.be.revertedWith(AccessErrorMsg.CALLER_NOT_ADMIN);
    });

    it("Should revert set lrt price when caller is not admin", async function () {
      await expect(
        lrtPreSaleInstance
          .connect(admin)
          .setLrtPrice(ethers.utils.parseUnits("10", 18))
      )
        .to.emit(lrtPreSaleInstance, "PriceSet")
        .withArgs(ethers.utils.parseUnits("10", 18));
      await expect(
        lrtPreSaleInstance
          .connect(addr1)
          .setLrtPrice(ethers.utils.parseUnits("10", 18))
      ).to.be.revertedWith(AccessErrorMsg.CALLER_NOT_ADMIN);
    });

    it("Should revert set lrt discount when caller is not admin", async function () {
      await expect(lrtPreSaleInstance.connect(admin).setSaleDiscount(2000))
        .to.emit(lrtPreSaleInstance, "SaleDiscountUpdated")
        .withArgs(2000);
      await expect(
        lrtPreSaleInstance.connect(addr2).setSaleDiscount(2000)
      ).to.be.revertedWith(AccessErrorMsg.CALLER_NOT_ADMIN);
    });

    it("Should revert set buy cap when caller is not admin", async function () {
      await expect(lrtPreSaleInstance.connect(admin).setBuyCap(2))
        .to.emit(lrtPreSaleInstance, "BuyCapUpdated")
        .withArgs(2);
      await expect(
        lrtPreSaleInstance.connect(addr1).setBuyCap(2)
      ).to.be.revertedWith(AccessErrorMsg.CALLER_NOT_ADMIN);
    });

    it("Should revert set lrt limit when caller is not admin", async function () {
      await expect(lrtPreSaleInstance.connect(admin).setLrtLimit(5000))
        .to.emit(lrtPreSaleInstance, "LrtLimitSet")
        .withArgs(5000);
      await expect(
        lrtPreSaleInstance.connect(addr1).setLrtLimit(5000)
      ).to.be.revertedWith(AccessErrorMsg.CALLER_NOT_ADMIN);
    });

    it("Should revert set min lrt limit per user when caller is not admin", async function () {
      await expect(lrtPreSaleInstance.connect(admin).setMinLrtPerUser(20))
        .to.emit(lrtPreSaleInstance, "MinLrtPriceSet")
        .withArgs(20);
      await expect(
        lrtPreSaleInstance.connect(addr1).setMinLrtPerUser(20)
      ).to.be.revertedWith(AccessErrorMsg.CALLER_NOT_ADMIN);
    });

    it("Should revert set sale status when caller is not admin", async function () {
      await expect(lrtPreSaleInstance.connect(admin).setSaleStatus(true))
        .to.emit(lrtPreSaleInstance, "SaleStatusSet")
        .withArgs(true);

      const saleStatus = await lrtPreSaleInstance.isActive();

      expect(saleStatus).to.equal(true);

      await expect(
        lrtPreSaleInstance.connect(addr1).setSaleStatus(true)
      ).to.be.revertedWith(AccessErrorMsg.CALLER_NOT_ADMIN);
    });

    it("should allow admin to add payment coin", async function () {
      const zeroAddress = "0x0000000000000000000000000000000000000000";

      const address = await lrtPreSaleInstance.paymentTokens(
        Helper.stringToBytes16("DAI")
      );
      expect(address).to.equal(daiInstance.address);
      await expect(
        lrtPreSaleInstance
          .connect(admin)
          .setPaymentTokens(Helper.stringToBytes16("DAI"), daiInstance.address)
      )
        .to.emit(lrtPreSaleInstance, "PaymentTokenSet")
        .withArgs(Helper.stringToBytes16("DAI"), daiInstance.address);

      await expect(
        lrtPreSaleInstance
          .connect(admin)
          .setPaymentTokens(Helper.stringToBytes16("DAI"), zeroAddress)
      ).to.be.revertedWith(SaleErrorMsg.NOT_VALID_ADDRESS);

      await expect(
        lrtPreSaleInstance
          .connect(addr1)
          .setPaymentTokens(Helper.stringToBytes16("DAI"), daiInstance.address)
      ).to.be.revertedWith(AccessErrorMsg.CALLER_NOT_ADMIN);
    });

    it("should allow admin to set aggregator address", async function () {
      const zeroAddress = "0x0000000000000000000000000000000000000000";

      const address = await lrtPreSaleInstance.priceFeeds(
        Helper.stringToBytes16("MATIC")
      );
      expect(address).to.equal(aggregatorInstance.address);
      await expect(
        lrtPreSaleInstance
          .connect(admin)
          .setAggregator(
            Helper.stringToBytes16("MATIC"),
            aggregatorInstance.address
          )
      )
        .to.emit(lrtPreSaleInstance, "AggregatorAddressSet")
        .withArgs(Helper.stringToBytes16("MATIC"), aggregatorInstance.address);

      await expect(
        lrtPreSaleInstance
          .connect(admin)
          .setAggregator(Helper.stringToBytes16("MATIC"), zeroAddress)
      ).to.be.revertedWith(SaleErrorMsg.NOT_VALID_ADDRESS);

      await expect(
        lrtPreSaleInstance
          .connect(addr1)
          .setAggregator(
            Helper.stringToBytes16("MATIC"),
            aggregatorInstance.address
          )
      ).to.be.revertedWith(AccessErrorMsg.CALLER_NOT_ADMIN);
    });

    it("should allow admin or script role to add investor as eligible address", async function () {
      const isEligible1 = await lrtPreSaleInstance.eligibleAddresses(
        addr1.address
      );
      expect(isEligible1).to.equal(true);
      await expect(
        lrtPreSaleInstance.connect(admin).addToWhiteList(addr1.address)
      )
        .to.emit(lrtPreSaleInstance, "EligibleAddressAdded")
        .withArgs(addr1.address);

      const isEligible2 = await lrtPreSaleInstance.eligibleAddresses(
        addr2.address
      );
      expect(isEligible2).to.equal(true);
      await expect(
        lrtPreSaleInstance.connect(admin).addToWhiteList(addr2.address)
      )
        .to.emit(lrtPreSaleInstance, "EligibleAddressAdded")
        .withArgs(addr2.address);

      const zeroAddress = "0x0000000000000000000000000000000000000000";

      await expect(
        lrtPreSaleInstance.connect(admin).addToWhiteList(zeroAddress)
      ).to.be.revertedWith(SaleErrorMsg.NOT_VALID_ADDRESS);

      await expect(
        lrtPreSaleInstance.connect(addr1).addToWhiteList(addr2.address)
      ).to.be.revertedWith(AccessErrorMsg.CALLER_NOT_ADMIN);
    });
  });
  
});
