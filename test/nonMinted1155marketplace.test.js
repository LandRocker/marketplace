const { expect, util } = require("chai");
const {
  time,
  loadFixture,
} = require("@nomicfoundation/hardhat-network-helpers");

const {
  MarketplaceErrorMsg,
  AccessErrorMsg,
  NonMinted1155ErrorMsg,
} = require("./messages");
const { ethers, network } = require("hardhat");

const Math = require("./helper/math");

const {
  nonMinted1155MarketplaceFixture,
} = require("./fixture/nonMinted1155Marketplace.fixture");
const Helper = require("./helper");

const zeroAddress = "0x0000000000000000000000000000000000000000";

describe("NonMinted1155 Marketplace contract", function () {
  let nonMinted1155MarketplaceInstance,
    lrtVestingInstance,
    landRockerInstance,
    landRockerERC1155Instance,
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
    royaltyRecipient;
  let baseURI =
    "https://srvs20.landrocker.io/game_service/bc/get/uniq/token/data?token_id=";
  let baseURI2 =
    "https://srvs20.landrocker.io/game_service/bc/get/token/data?token_id=";

  beforeEach(async function () {
    ({
      nonMinted1155MarketplaceInstance,
      landRockerInstance,
      landRockerERC1155Instance,
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
      royaltyRecipient,
      lrtVestingInstance,
    } = await loadFixture(nonMinted1155MarketplaceFixture));
  });

  describe("test withdraw", function () {
    beforeEach(async function () {
      const price = ethers.utils.parseUnits("5");
      const expireDate = 0;
      const listedAmount = 10;
      const sellUnit = 10;
      const royaltyPercentage = 1000;
      const systemFee = await landRockerInstance.systemFee();
      const treasury1155 = await landRockerInstance.treasury1155();
   
      await nonMinted1155MarketplaceInstance
        .connect(admin)
        .createSell(price, expireDate, listedAmount, sellUnit);

      await lrtInstance
        .connect(distributor)
        .transferToken(addr2.address, ethers.utils.parseUnits("500"));

      await lrtInstance
        .connect(addr2)
        .approve(nonMinted1155MarketplaceInstance.address, price);

      await nonMinted1155MarketplaceInstance.connect(addr2).buyItem(0);
    //   await lrtInstance
    //     .connect(distributor)
    //     .transferToken(nonMinted1155MarketplaceInstance.address, ethers.utils.parseUnits("500"));
     });

    it("should allow to withdraw contract balance", async function () {
      const amount = ethers.utils.parseUnits("0.002", 18);
      const treasuryAddress = await landRockerInstance.treasury();
      const oldTreasury = await lrtInstance.balanceOf(treasuryAddress);
      const oldSystemBalance = await lrtInstance.balanceOf(
        nonMinted1155MarketplaceInstance.address
      );

     
        ethers.utils.formatUnits(
          await lrtInstance.balanceOf(nonMinted1155MarketplaceInstance.address)
        ),
        "after buy"
 

      const tx = await nonMinted1155MarketplaceInstance
        .connect(admin)
        .withdraw(amount);

      console.log(
        await lrtInstance.balanceOf(nonMinted1155MarketplaceInstance.address),
        "after withdraw"
      );

      await expect(tx)
        .to.emit(nonMinted1155MarketplaceInstance, "Withdrawed")
        .withArgs(amount, treasuryAddress);

      const newTreasury = await lrtInstance.balanceOf(treasuryAddress);
      const newSystemBalance = await lrtInstance.balanceOf(
        nonMinted1155MarketplaceInstance.address
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
        nonMinted1155MarketplaceInstance.connect(addr1).withdraw(amount)
      ).to.be.revertedWith(AccessErrorMsg.CALLER_NOT_ADMIN);
    });

    it("should not allow to withdraw sell if amount is too low", async function () {
      const amount = ethers.utils.parseUnits("0", 18);

      await expect(
        nonMinted1155MarketplaceInstance.connect(admin).withdraw(amount)
      ).to.be.revertedWith(MarketplaceErrorMsg.TOO_LOW_AMOUNT);
    });

    it("should not allow to withdraw sell if balance insufficient", async function () {
      const amount = ethers.utils.parseUnits("1000", 18);

      await expect(
        nonMinted1155MarketplaceInstance.connect(admin).withdraw(amount)
      ).to.be.revertedWith(MarketplaceErrorMsg.NO_BALANCE_WITHDRAW);
    });
  });

  describe("test create Sell", function () {
    it("should allow to create sell", async function () {
      // Create an sell
      const price = ethers.utils.parseUnits("1");
      const expireDate =
        (await time.latest()) + (await Helper.convertToSeconds("weeks", 1));
      const listedAmount = 100;
      const sellUnit = 1;

      const tx = await nonMinted1155MarketplaceInstance
        .connect(admin)
        .createSell(price, expireDate, listedAmount, sellUnit);

      const sell = await nonMinted1155MarketplaceInstance.nonMinted1155Sells(0);

      await expect(tx)
        .to.emit(nonMinted1155MarketplaceInstance, "SellCreated")
        .withArgs(
          0,
          admin.address,
          landRockerERC1155Instance.address,
          expireDate,
          price,
          listedAmount,
          sellUnit,
          sell.tokenId
        );

      // Check that the sell has the correct details
      expect(sell.sellData.price).to.equal(price);
      expect(sell.sellData.status).to.equal(0);
      expect(sell.sellData.collection).to.equal(
        landRockerERC1155Instance.address
      );
      expect(sell.sellData.expireDate).to.equal(expireDate);
      expect(sell.listedAmount).to.equal(listedAmount);
      expect(sell.sellUnit).to.equal(sellUnit);
      expect(sell.tokenId).to.equal(0);

      expect(sell.soldAmount).to.equal(0);
      expect(
        await landRockerERC1155Instance.balanceOf(
          nonMinted1155MarketplaceInstance.address,
          sell.tokenId
        )
      ).to.equal(listedAmount);
    });
    it("should not allow to create sell if caller is not admin", async function () {
      const price = ethers.utils.parseUnits("1");
      const expireDate =
        (await time.latest()) + (await Helper.convertToSeconds("weeks", 1));
      const listedAmount = 100;
      const sellUnit = 1;
      await expect(
        nonMinted1155MarketplaceInstance
          .connect(addr2)
          .createSell(price, expireDate, listedAmount, sellUnit)
      ).to.be.revertedWith(AccessErrorMsg.CALLER_NOT_ADMIN);
    });

    it("should not allow to create sell if listed Amount is too low", async function () {
      const price = ethers.utils.parseUnits("1");
      const expireDate =
        (await time.latest()) + (await Helper.convertToSeconds("weeks", 1));
      const listedAmount = 0;
      const sellUnit = 1;
      await expect(
        nonMinted1155MarketplaceInstance
          .connect(admin)
          .createSell(price, expireDate, listedAmount, sellUnit)
      ).to.be.revertedWith(NonMinted1155ErrorMsg.INVALID_LISTED_AMOUNT);
    });

    it("should not allow to create sell if sell unit is too low", async function () {
      const price = ethers.utils.parseUnits("1");
      const expireDate =
        (await time.latest()) + (await Helper.convertToSeconds("weeks", 1));
      const listedAmount = 10;
      const sellUnit = 0;
      await expect(
        nonMinted1155MarketplaceInstance
          .connect(admin)
          .createSell(price, expireDate, listedAmount, sellUnit)
      ).to.be.revertedWith(NonMinted1155ErrorMsg.INVALID_SELL_UNIT);
    });

    it("should not allow to create sell if sell unit is larger than listed Amount", async function () {
      const price = ethers.utils.parseUnits("1");
      const expireDate =
        (await time.latest()) + (await Helper.convertToSeconds("weeks", 1));
      const listedAmount = 10;
      const sellUnit = 100;

      await expect(
        nonMinted1155MarketplaceInstance
          .connect(admin)
          .createSell(price, expireDate, listedAmount, sellUnit)
      ).to.be.revertedWith(NonMinted1155ErrorMsg.SELL_UNIT_IS_LARGER);
    });

    it("should not allow to create sell if expire date is invalid", async function () {
      const price = ethers.utils.parseUnits("1");
      const expireDate = await time.latest();
      const listedAmount = 1000;
      const sellUnit = 10;
      await expect(
        nonMinted1155MarketplaceInstance
          .connect(admin)
          .createSell(price, expireDate, listedAmount, sellUnit)
      ).to.be.revertedWith(MarketplaceErrorMsg.INVALID_EXPIRE_DATE);
    });

    it("should not allow to create sell if listed amount is not a coefficient of sell unit", async function () {
      const price = ethers.utils.parseUnits("1");
      const expireDate = 0;
      const listedAmount = 10;
      const sellUnit = 6;
      const treasury1155 = await landRockerInstance.treasury1155();

      await expect(nonMinted1155MarketplaceInstance
        .connect(admin)
        .createSell(price, expireDate, listedAmount, sellUnit))
        .to.be.revertedWith(NonMinted1155ErrorMsg.NOT_COEFFICIENT_OF_SELL_UNIT);      
    });
  });

  describe("test edit sell", function () {
    it("should not allow to edit sell when listedAmount lower than old listedAmount", async function () {
      // Create an sell
      const price = ethers.utils.parseUnits("1");
      const expireDate =
        (await time.latest()) + (await Helper.convertToSeconds("weeks", 1));
      const listedAmount = 100;
      const sellUnit = 1;

      await nonMinted1155MarketplaceInstance
        .connect(admin)
        .createSell(price, expireDate, listedAmount, sellUnit);

      //new values
      const price2 = ethers.utils.parseUnits("2");
      const expireDate2 =
        (await time.latest()) + (await Helper.convertToSeconds("weeks", 2));
      const listedAmount2 = 50;
      const sellUnit2 = 2;

        await expect(
          nonMinted1155MarketplaceInstance
            .connect(admin)
            .editSell(0, price2, expireDate2, listedAmount2, sellUnit2)
        ).to.be.revertedWith(NonMinted1155ErrorMsg.LOW_LISTED_AMOUNT);    
    });

    it("should allow to edit sell when listedAmount larger or equal to old listedAmount", async function () {
      // Create an sell
      const price = ethers.utils.parseUnits("1");
      const expireDate =
        (await time.latest()) + (await Helper.convertToSeconds("weeks", 1));
      const listedAmount = 100;
      const sellUnit = 1;

      await nonMinted1155MarketplaceInstance
        .connect(admin)
        .createSell(price, expireDate, listedAmount, sellUnit);

      //new values
      const price2 = ethers.utils.parseUnits("2");
      const expireDate2 =
        (await time.latest()) + (await Helper.convertToSeconds("weeks", 2));
      const listedAmount2 = 200;
      const sellUnit2 = 2;

      const tx = await nonMinted1155MarketplaceInstance
        .connect(admin)
        .editSell(0, price2, expireDate2, listedAmount2, sellUnit2);

      await expect(tx)
        .to.emit(nonMinted1155MarketplaceInstance, "SellUpdated")
        .withArgs(
          0,
          admin.address,
          landRockerERC1155Instance.address,
          expireDate2,
          price2,
          listedAmount2,
          sellUnit2
        );

      const sell = await nonMinted1155MarketplaceInstance.nonMinted1155Sells(0);

      // Check that the sell has the correct details
      expect(sell.sellData.price).to.equal(price2);
      expect(sell.sellData.status).to.equal(0);
      expect(sell.sellData.collection).to.equal(
        landRockerERC1155Instance.address
      );
      expect(sell.sellData.expireDate).to.equal(expireDate2);
      expect(sell.listedAmount).to.equal(listedAmount2);
      expect(sell.sellUnit).to.equal(sellUnit2);
      expect(sell.soldAmount).to.equal(0);
      expect(
        await landRockerERC1155Instance.balanceOf(
          nonMinted1155MarketplaceInstance.address,
          sell.tokenId
        )
      ).to.equal(listedAmount2);
    });

    it("should not allow to edit sell if caller is not admin", async function () {
      const price = ethers.utils.parseUnits("1");
      const expireDate =
        (await time.latest()) + (await Helper.convertToSeconds("weeks", 1));
      const listedAmount = 100;
      const sellUnit = 1;
      await expect(
        nonMinted1155MarketplaceInstance
          .connect(addr2)
          .editSell(0, price, expireDate, listedAmount, sellUnit)
      ).to.be.revertedWith(AccessErrorMsg.CALLER_NOT_ADMIN);
    });

    it("should not allow to edit sell if listed Amount is too low", async function () {
      const price = ethers.utils.parseUnits("1");
      const expireDate =
        (await time.latest()) + (await Helper.convertToSeconds("weeks", 1));
      const listedAmount = 0;
      const sellUnit = 1;
      await expect(
        nonMinted1155MarketplaceInstance
          .connect(admin)
          .editSell(0, price, expireDate, listedAmount, sellUnit)
      ).to.be.revertedWith(NonMinted1155ErrorMsg.INVALID_LISTED_AMOUNT);
    });

    it("should not allow to edit sell if sell unit is too low", async function () {
      const price = ethers.utils.parseUnits("1");
      const expireDate =
        (await time.latest()) + (await Helper.convertToSeconds("weeks", 1));
      const listedAmount = 10;
      const sellUnit = 0;
      await expect(
        nonMinted1155MarketplaceInstance
          .connect(admin)
          .editSell(0, price, expireDate, listedAmount, sellUnit)
      ).to.be.revertedWith(NonMinted1155ErrorMsg.INVALID_SELL_UNIT);
    });

    it("should not allow to edit sell if sell unit is larger than listed Amount", async function () {
      const price = ethers.utils.parseUnits("1");
      const expireDate =
        (await time.latest()) + (await Helper.convertToSeconds("weeks", 1));
      const listedAmount = 10;
      const sellUnit = 100;
      await expect(
        nonMinted1155MarketplaceInstance
          .connect(admin)
          .editSell(0, price, expireDate, listedAmount, sellUnit)
      ).to.be.revertedWith(NonMinted1155ErrorMsg.SELL_UNIT_IS_LARGER);
    });

    it("should not allow to edit sell if expire date is invalid", async function () {
      const price = ethers.utils.parseUnits("1");
      const expireDate = await time.latest();
      const listedAmount = 1000;
      const sellUnit = 10;
      await expect(
        nonMinted1155MarketplaceInstance
          .connect(admin)
          .editSell(0, price, expireDate, listedAmount, sellUnit)
      ).to.be.revertedWith(MarketplaceErrorMsg.INVALID_EXPIRE_DATE);
    });

    it("should not allow to edit sell if sell has not valid status", async function () {
      const price = ethers.utils.parseUnits("1");
      const expireDate = 0;
      const listedAmount = 10;
      const sellUnit = 10;

      await nonMinted1155MarketplaceInstance
        .connect(admin)
        .createSell(price, expireDate, listedAmount, sellUnit);

      await lrtInstance
        .connect(distributor)
        .transferToken(addr2.address, ethers.utils.parseUnits("500"));

      await lrtInstance
        .connect(addr2)
        .approve(nonMinted1155MarketplaceInstance.address, price);

      await nonMinted1155MarketplaceInstance.connect(addr2).buyItem(0);

      await expect(
        nonMinted1155MarketplaceInstance
          .connect(admin)
          .editSell(0, price, expireDate, listedAmount, sellUnit)
      ).to.be.revertedWith(NonMinted1155ErrorMsg.SOLD_NFT);
    });
  });
  
  describe("test buy NFT", function () {
    it("should allow to buy non minted erc1155 token", async function () {
      const price = ethers.utils.parseUnits("1");
      const expireDate = 0;
      const listedAmount = 10;
      const sellUnit = 10;
      //const royaltyPercentage = 1000;
      //const systemFee = await landRockerInstance.systemFee();
      const treasury1155 = await landRockerInstance.treasury1155();

      await nonMinted1155MarketplaceInstance
        .connect(admin)
        .createSell(price, expireDate, listedAmount, sellUnit);

      await lrtInstance
        .connect(distributor)
        .transferToken(addr2.address, ethers.utils.parseUnits("500"));

      await lrtInstance
        .connect(addr2)
        .approve(nonMinted1155MarketplaceInstance.address, price);

      //before buy
      const oldBuyerBalance = await lrtInstance.balanceOf(addr2.address);
      const oldTreasury1155 = await lrtInstance.balanceOf(treasury1155);
      const oldSystemBalance = await lrtInstance.balanceOf(
        nonMinted1155MarketplaceInstance.address
      );

      const tx = await nonMinted1155MarketplaceInstance
        .connect(addr2)
        .buyItem(0);

      await expect(tx)
        .to.emit(nonMinted1155MarketplaceInstance, "ItemBoughtNonMinted1155")
        .withArgs(0, addr2.address, 0, sellUnit);

      const newBuyerBalance = await lrtInstance.balanceOf(addr2.address);
      const newTreasury1155 = await lrtInstance.balanceOf(treasury1155);
      const newSystemBalance = await lrtInstance.balanceOf(
        nonMinted1155MarketplaceInstance.address
      );

      //let systemPortion = Math.Big(systemFee).mul(price).div(10000);
      //let totalPay = Math.Big(price).sub(systemPortion);
      //let royaltyAmount = Math.Big(totalPay).mul(royaltyPercentage).div(10000);

      const sell = await nonMinted1155MarketplaceInstance.nonMinted1155Sells(0);
      expect(
        await landRockerERC1155Instance.balanceOf(addr2.address, sell.tokenId)
      ).to.equal(10);
      expect(sell.sellData.status).to.equal(1);
      expect(Number(newBuyerBalance)).to.equal(
        Number(Math.Big(oldBuyerBalance).sub(price))
      );
      // expect(Number(newTreasury1155)).to.equal(
      //   Number(
      //     Math.Big(oldTreasury1155).add(Math.Big(price)))
      //   );
      // expect(Number(newTreasury1155)).to.equal(
      //   Number(
      //     Math.Big(oldTreasury1155).add(Math.Big(totalPay).sub(royaltyAmount))
      //   )
      // );
      expect(Number(newSystemBalance)).to.equal(
        Number(Math.Big(oldSystemBalance).add(price))
      );
      // expect(Number(newSystemBalance)).to.equal(
      //   Number(Math.Big(oldSystemBalance).add(systemPortion))
      // );
    });

    it("should not allow to buy non minted erc1155 token when sale has expired", async function () {
      const price = ethers.utils.parseUnits("1");
      const expireDate =
        (await time.latest()) + (await Helper.convertToSeconds("weeks", 1));
      const listedAmount = 10;
      const sellUnit = 10;

      await nonMinted1155MarketplaceInstance
        .connect(admin)
        .createSell(price, expireDate, listedAmount, sellUnit);

      await lrtInstance
        .connect(distributor)
        .transferToken(addr2.address, ethers.utils.parseUnits("500"));

      const elapsedTime = await Helper.convertToSeconds("weeks", 2);

      await network.provider.send("evm_increaseTime", [elapsedTime]);
      await network.provider.send("evm_mine");

      await lrtInstance
        .connect(addr2)
        .approve(nonMinted1155MarketplaceInstance.address, price);

      await expect(
        nonMinted1155MarketplaceInstance.connect(addr2).buyItem(0)
      ).to.be.revertedWith(MarketplaceErrorMsg.SALE_HAS_EXPIRED);
    });

    it("should not allow to buy non minted erc1155 token when status of listed NFTs is not be valid", async function () {
      const price = ethers.utils.parseUnits("1");
      const expireDate = 0;
      const listedAmount = 10;
      const sellUnit = 10;

      await nonMinted1155MarketplaceInstance
        .connect(admin)
        .createSell(price, expireDate, listedAmount, sellUnit);

      await nonMinted1155MarketplaceInstance.connect(admin).cancelSell(0);

      await lrtInstance
        .connect(distributor)
        .transferToken(addr2.address, ethers.utils.parseUnits("500"));

      await lrtInstance
        .connect(addr2)
        .approve(nonMinted1155MarketplaceInstance.address, price);

      await expect(
        nonMinted1155MarketplaceInstance.connect(addr2).buyItem(0)
      ).to.be.revertedWith(NonMinted1155ErrorMsg.INVALID_STATUS_TO_SELL);
    });    

    it("should set debt to buy non minted erc1155 token when user has not sufficient balance", async function () {
      const price = ethers.utils.parseUnits("10");
      const expireDate = 0;
      const listedAmount = 10;
      const sellUnit = 10;
      //const royaltyPercentage = 1000;
      //const systemFee = await landRockerInstance.systemFee();
      const treasury1155 = await landRockerInstance.treasury1155();

      await nonMinted1155MarketplaceInstance
        .connect(admin)
        .createSell(price, expireDate, listedAmount, sellUnit);

      await lrtInstance
        .connect(distributor)
        .transferToken(addr2.address, ethers.utils.parseUnits("5"));

      // set up the vesting plan parameters
      const startDate = await time.latest();
      const cliff = await Helper.convertToSeconds("days", 1); // 1 day cliff86400;
      const duration = await Helper.convertToSeconds("weeks", 1); // 1 week vesting period
      const revocable = true;
      const poolName = ethers.utils.formatBytes32String("PreSale");
      const initialReleasePercentage = 5000;

      // create the vesting plan
      const txVestingPlan = await lrtVestingInstance
        .connect(admin)
        .createVestingPlan(
          startDate,
          cliff,
          duration,
          revocable,
          initialReleasePercentage,
          poolName
        );
      

        //create vesting schedules addr2
      const vestingAmount = ethers.utils.parseUnits("10");
      const planId = 0;

      const vestingStartDate =
        (await time.latest()) + (await Helper.convertToSeconds("days", 1)); // Start date 1 day from now
      await lrtVestingInstance
        .connect(admin)
        .createVesting(
          addr2.address,
          vestingStartDate,
          vestingAmount,
          planId
        );

      await lrtInstance
        .connect(addr2)
        .approve(nonMinted1155MarketplaceInstance.address, price);

      //before buy
      const oldBuyerBalance = await lrtInstance.balanceOf(addr2.address);
      const oldTreasury1155 = await lrtInstance.balanceOf(treasury1155);
      const oldSystemBalance = await lrtInstance.balanceOf(
        nonMinted1155MarketplaceInstance.address
      );

      const tx = await nonMinted1155MarketplaceInstance
        .connect(addr2)
        .buyItem(0);

      await expect(tx)
        .to.emit(nonMinted1155MarketplaceInstance, "ItemBoughtNonMinted1155")
        .withArgs(0, addr2.address, 0, sellUnit);

      const newBuyerBalance = await lrtInstance.balanceOf(addr2.address);
      const newTreasury1155 = await lrtInstance.balanceOf(treasury1155);
      const newSystemBalance = await lrtInstance.balanceOf(
        nonMinted1155MarketplaceInstance.address
      );

      //let systemPortion = Math.Big(systemFee).mul(price).div(10000);
      //let totalPay = Math.Big(price).sub(systemPortion);
      //let royaltyAmount = Math.Big(totalPay).mul(royaltyPercentage).div(10000);

      const sell = await nonMinted1155MarketplaceInstance.nonMinted1155Sells(0);
     
      expect(
        await landRockerERC1155Instance.balanceOf(addr2.address, sell.tokenId)
      ).to.equal(10);
      expect(sell.sellData.status).to.equal(1);
      expect(Number(newBuyerBalance)).to.equal(
        Number(Math.Big(oldBuyerBalance))
      );
      expect(Number(newTreasury1155)).to.equal(
        Number(Math.Big(oldTreasury1155))
      );
      expect(Number(newSystemBalance)).to.equal(
        Number(Math.Big(oldSystemBalance))
      );

      const vestingStat = await lrtVestingInstance.holdersStat(addr2.address);
      expect(vestingStat.claimedAmount).to.equal(price);

      await expect(tx)
        .to.emit(lrtVestingInstance, "DebtCreated")
        .withArgs(price, addr2.address);
    });     
   
    it("should not allow to buy non minted erc1155 token when sellunit+soldAmount is greater than listedAmount", async function () {
      const price = ethers.utils.parseUnits("1");
      const expireDate = 0;
      const listedAmount = 10;
      const sellUnit = 10;
      const treasury1155 = await landRockerInstance.treasury1155();

      await nonMinted1155MarketplaceInstance
        .connect(admin)
        .createSell(price, expireDate, listedAmount, sellUnit);

      await lrtInstance
        .connect(distributor)
        .transferToken(addr2.address, ethers.utils.parseUnits("500"));

      await lrtInstance
        .connect(addr2)
        .approve(nonMinted1155MarketplaceInstance.address, price);      

      const tx = await nonMinted1155MarketplaceInstance
        .connect(addr2)
        .buyItem(0);

      await expect(tx)
        .to.emit(nonMinted1155MarketplaceInstance, "ItemBoughtNonMinted1155")
        .withArgs(0, addr2.address, 0, sellUnit);

      const sell = await nonMinted1155MarketplaceInstance.nonMinted1155Sells(0);

      await expect(
        nonMinted1155MarketplaceInstance.connect(addr2).buyItem(0)
      ).to.be.revertedWith(NonMinted1155ErrorMsg.EXCEED_SELL);
      
    }); 

    it("should not allow to buy non minted erc1155 token when has allowance error", async function () {
      const price = ethers.utils.parseUnits("1");
      const expireDate = 0;
      const listedAmount = 10;
      const sellUnit = 10;

      await nonMinted1155MarketplaceInstance
        .connect(admin)
        .createSell(price, expireDate, listedAmount, sellUnit);

      await lrtInstance
        .connect(distributor)
        .transferToken(addr2.address, ethers.utils.parseUnits("500"));

      await lrtInstance
        .connect(addr2)
        .approve(nonMinted1155MarketplaceInstance.address, 0);

      await expect(
        nonMinted1155MarketplaceInstance.connect(addr2).buyItem(0)
      ).to.be.revertedWith(MarketplaceErrorMsg.ALLOWANCE);
    });    
  });

  describe("test canceling a sell", function () {
    it("should allow to cancel non minted erc1155 token", async function () {
      const price = ethers.utils.parseUnits("1");
      const expireDate = 0;
      const listedAmount = 10;
      const sellUnit = 10;

      await nonMinted1155MarketplaceInstance
        .connect(admin)
        .createSell(price, expireDate, listedAmount, sellUnit);

      const tx = await nonMinted1155MarketplaceInstance
        .connect(admin)
        .cancelSell(0);

      await expect(tx)
        .to.emit(nonMinted1155MarketplaceInstance, "SellCanceled")
        .withArgs(0);

      const sell = await nonMinted1155MarketplaceInstance.nonMinted1155Sells(0);

      // Check that the sell has the correct details
      expect(sell.sellData.status).to.equal(2);
    });

    it("should not allow to cancel non minted erc1155 token when the sell order is active", async function () {
      const price = ethers.utils.parseUnits("1");
      const expireDate = 0;
      const listedAmount = 10;
      const sellUnit = 10;

      await nonMinted1155MarketplaceInstance
        .connect(admin)
        .createSell(price, expireDate, listedAmount, sellUnit);

      await lrtInstance
        .connect(distributor)
        .transferToken(addr2.address, ethers.utils.parseUnits("500"));

      await lrtInstance
        .connect(addr2)
        .approve(nonMinted1155MarketplaceInstance.address, price);

      await nonMinted1155MarketplaceInstance.connect(addr2).buyItem(0);

      await expect(
        nonMinted1155MarketplaceInstance.connect(admin).cancelSell(0)
      ).to.be.revertedWith(NonMinted1155ErrorMsg.ACTIVE_ORDER);
    });

    it("should not allow to cancel non minted erc1155 token when the caller is not admin", async function () {
      const price = ethers.utils.parseUnits("1");
      const expireDate = 0;
      const listedAmount = 10;
      const sellUnit = 10;

      await nonMinted1155MarketplaceInstance
        .connect(admin)
        .createSell(price, expireDate, listedAmount, sellUnit);

      await lrtInstance
        .connect(distributor)
        .transferToken(addr2.address, ethers.utils.parseUnits("500"));

      await lrtInstance
        .connect(addr2)
        .approve(nonMinted1155MarketplaceInstance.address, price);

      await nonMinted1155MarketplaceInstance.connect(addr2).buyItem(0);

      await expect(
        nonMinted1155MarketplaceInstance.connect(addr1).cancelSell(0)
      ).to.be.revertedWith(AccessErrorMsg.CALLER_NOT_ADMIN);
    });
  });

  //Upgradeability testing
  describe("Contract Version 1 test", function () {
    it("Should return the greeting after deployment", async function () {
      const NonMinted1155Marketplace = await ethers.getContractFactory("NonMinted1155Marketplace");
  
      const contract = await upgrades.deployProxy(NonMinted1155Marketplace, [landRockerERC1155Instance.address,
        arInstance.address,
        lrtInstance.address,
        landRockerInstance.address,
        lrtVestingInstance.address], { initializer: '__NonMinted1155Marketplace_init', kind: 'uups'});
      await contract.deployed();
  
      expect(await contract.greeting()).to.equal("Hello, upgradeable world!");
    });
  });
  
  describe("Contract Version 2 test", function () {
    let oldContract, upgradedContract, owner, addr1;
    beforeEach(async function () {
      [owner, addr1] = await ethers.getSigners(2);
      const NonMinted1155Marketplace = await ethers.getContractFactory("NonMinted1155Marketplace");
      const NonMinted1155MarketplaceUpgraded = await ethers.getContractFactory("NonMinted1155MarketplaceUpgraded");
  
      oldContract = await upgrades.deployProxy(NonMinted1155Marketplace, [landRockerERC1155Instance.address,
        arInstance.address,
        lrtInstance.address,
        landRockerInstance.address,
        lrtVestingInstance.address], { initializer: '__NonMinted1155Marketplace_init', kind: 'uups'});
  
      await oldContract.deployed();  

      upgradedContract = await upgrades.upgradeProxy(oldContract, NonMinted1155MarketplaceUpgraded,
         {call: {fn: '__NonMinted1155MarketplaceUpgraded_init', args:[landRockerERC1155Instance.address,
          arInstance.address,
          lrtInstance.address,
          landRockerInstance.address,
          lrtVestingInstance.address]}});  
    });
  
    it("Old contract should return old greeting", async function () {
      expect(await oldContract.greeting()).to.equal("Hello, upgradeable world!");
    });
  
    it("Old contract cannot mint NFTs", async function () {
      try {
        oldContract.greetingNew()
      } catch (error) {
        expect(error.message === "oldContract.greetingNew is not a function" )
      }
    });

    it("New Contract Should return the old & new greeting and token name after deployment", async function() {
      expect(await upgradedContract.greeting()).to.equal("Hello, upgradeable world!");
      expect(await upgradedContract.greetingNew()).to.equal("New Upgradeable World!");
    });
   
  });
});
