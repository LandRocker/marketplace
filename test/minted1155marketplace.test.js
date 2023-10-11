const { expect, util } = require("chai");
const {
  time,
  loadFixture,
} = require("@nomicfoundation/hardhat-network-helpers");

const {
  MarketplaceErrorMsg,
  AccessErrorMsg,
  Minted1155ErrorMsg,
} = require("./messages");
const { ethers, network } = require("hardhat");

const Math = require("./helper/math");
const { minted1155MarketplaceFixture } = require("./fixture/minted1155Marketplace.fixture");
const Helper = require("./helper");

const zeroAddress = "0x0000000000000000000000000000000000000000";

describe("Minted1155 Marketplace contract", function () {
  let minted1155MarketplaceInstance,
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
    factory,
    lrtVestingInstance;
  let baseURI =
    "https://srvs20.landrocker.io/game_service/bc/get/uniq/token/data?token_id=";
  let baseURI2 =
    "https://srvs20.landrocker.io/game_service/bc/get/token/data?token_id=";

  beforeEach(async function () {
    ({
      minted1155MarketplaceInstance,
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
      factory,
    } = await loadFixture(minted1155MarketplaceFixture));
  });

  describe("test withdraw", function () {
    beforeEach(async function () {
      const tokenId = await landRockerERC1155Instance
        .connect(approvedContract)
        .callStatic.safeMint(owner.address, 10);

      await landRockerERC1155Instance
        .connect(approvedContract)
        .safeMint(owner.address, 10);

      const price = ethers.utils.parseUnits("1");
      const expireDate =
        (await time.latest()) + (await Helper.convertToSeconds("weeks", 1));
      const quantity = 2;

      await landRockerERC1155Instance
        .connect(owner)
        .setApprovalForAll(minted1155MarketplaceInstance.address, true);

      await minted1155MarketplaceInstance
        .connect(owner)
        .createSell(price, expireDate, tokenId, quantity);

      await lrtInstance
        .connect(distributor)
        .transferToken(addr2.address, ethers.utils.parseUnits("500"));

      await lrtInstance
        .connect(addr2)
        .approve(minted1155MarketplaceInstance.address, price);

      //await minted1155MarketplaceInstance.connect(addr2).buyItem(0);
      await lrtInstance
        .connect(distributor)
        .transferToken(minted1155MarketplaceInstance.address, ethers.utils.parseUnits("500"));

    });

    it("should allow to withdraw contract balance", async function () {
      const amount = ethers.utils.parseUnits("0.002", 18);
      const treasuryAddress = await landRockerInstance.treasury();
      const oldTreasury = await lrtInstance.balanceOf(treasuryAddress);
      const oldSystemBalance = await lrtInstance.balanceOf(
        minted1155MarketplaceInstance.address
      );

      const tx = await minted1155MarketplaceInstance
        .connect(admin)
        .withdraw(amount);

      await expect(tx)
        .to.emit(minted1155MarketplaceInstance, "Withdrawed")
        .withArgs(amount, treasuryAddress);

      const newTreasury = await lrtInstance.balanceOf(treasuryAddress);
      const newSystemBalance = await lrtInstance.balanceOf(
        minted1155MarketplaceInstance.address
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
        minted1155MarketplaceInstance.connect(addr1).withdraw(amount)
      ).to.be.revertedWith(AccessErrorMsg.CALLER_NOT_ADMIN);
    });

    it("should not allow to withdraw sell if amount is too low", async function () {
      const amount = ethers.utils.parseUnits("0", 18);

      await expect(
        minted1155MarketplaceInstance.connect(admin).withdraw(amount)
      ).to.be.revertedWith(MarketplaceErrorMsg.TOO_LOW_AMOUNT);
    });
    it("should not allow to withdraw sell if balance insufficient", async function () {
      const amount = ethers.utils.parseUnits("1000", 18);

      await expect(
        minted1155MarketplaceInstance.connect(admin).withdraw(amount)
      ).to.be.revertedWith(MarketplaceErrorMsg.NO_BALANCE_WITHDRAW);
    });
  });

  describe("test create Sell", function () {
    it("should allow to create sell", async function () {
      // Create an sell
      // Mint some 1155 NFT Tokens
      const tokenId = await landRockerERC1155Instance
        .connect(approvedContract)
        .callStatic.safeMint(owner.address, 10);

      await landRockerERC1155Instance
        .connect(approvedContract)
        .safeMint(owner.address, 10);

      const price = ethers.utils.parseUnits("1");
      const expireDate =
        (await time.latest()) + (await Helper.convertToSeconds("weeks", 1));
      const quantity = 2;
      await landRockerERC1155Instance
        .connect(owner)
        .setApprovalForAll(minted1155MarketplaceInstance.address, true);

      const tx = await minted1155MarketplaceInstance
        .connect(owner)
        .createSell(price, expireDate, tokenId, quantity);

      await expect(tx)
        .to.emit(minted1155MarketplaceInstance, "SellCreated")
        .withArgs(
          0,
          owner.address,
          landRockerERC1155Instance.address,
          price,
          expireDate,
          tokenId,
          quantity
        );

      const sell = await minted1155MarketplaceInstance.minted1155Sells(0);

      // Check that the sell has the correct details
      expect(sell.sellData.price).to.equal(price);
      expect(sell.sellData.status).to.equal(0);
      expect(sell.sellData.collection).to.equal(
        landRockerERC1155Instance.address
      );
      expect(sell.sellData.expireDate).to.equal(expireDate);
      expect(sell.tokenId).to.equal(tokenId);
      expect(sell.quantity).to.equal(2);
    });
    it("should not allow to create sell if quantity is invalid", async function () {
      // Mint some 1155 NFT Tokens
      const tokenId = await landRockerERC1155Instance
        .connect(approvedContract)
        .callStatic.safeMint(owner.address, 10);

      await landRockerERC1155Instance
        .connect(approvedContract)
        .safeMint(owner.address, 10);

      const price = ethers.utils.parseUnits("1");
      const expireDate =
        (await time.latest()) + (await Helper.convertToSeconds("weeks", 1));
      const quantity = 0;
      await landRockerERC1155Instance
        .connect(owner)
        .setApprovalForAll(minted1155MarketplaceInstance.address, true);

      await expect(
        minted1155MarketplaceInstance
          .connect(owner)
          .createSell(price, expireDate, tokenId, quantity)
      ).to.be.revertedWith(Minted1155ErrorMsg.INVALID_QUANTITY);
    });

    it("should not allow to create sell if seller has not enough balance", async function () {
      // Mint some 1155 NFT Tokens
      const tokenId = await landRockerERC1155Instance
        .connect(approvedContract)
        .callStatic.safeMint(owner.address, 10);

      await landRockerERC1155Instance
        .connect(approvedContract)
        .safeMint(owner.address, 10);

      const price = ethers.utils.parseUnits("1");
      const expireDate =
        (await time.latest()) + (await Helper.convertToSeconds("weeks", 1));
      const quantity = 100;
      await landRockerERC1155Instance
        .connect(owner)
        .setApprovalForAll(minted1155MarketplaceInstance.address, true);
      await expect(
        minted1155MarketplaceInstance
          .connect(owner)
          .createSell(price, expireDate, tokenId, quantity)
      ).to.be.revertedWith(Minted1155ErrorMsg.INSUFFICIENT_BALANCE);
    });

    it("should not allow to create sell if seller doesn't give access to marketplace", async function () {
      const tokenId = await landRockerERC1155Instance
        .connect(approvedContract)
        .callStatic.safeMint(owner.address, 10);

      await landRockerERC1155Instance
        .connect(approvedContract)
        .safeMint(owner.address, 10);

      const price = ethers.utils.parseUnits("1");
      const expireDate =
        (await time.latest()) + (await Helper.convertToSeconds("weeks", 1));
      const quantity = 2;

      await expect(
        minted1155MarketplaceInstance
          .connect(owner)
          .createSell(price, expireDate, tokenId, quantity)
      ).to.be.revertedWith(Minted1155ErrorMsg.HAS_NOT_ACCESS);
    });

    it("should not allow to create sell if expire date is invalid", async function () {
      const tokenId = await landRockerERC1155Instance
        .connect(approvedContract)
        .callStatic.safeMint(owner.address, 10);

      await landRockerERC1155Instance
        .connect(approvedContract)
        .safeMint(owner.address, 10);

      const price = ethers.utils.parseUnits("1");
      const expireDate = await time.latest();
      const quantity = 100;
      await landRockerERC1155Instance
        .connect(owner)
        .setApprovalForAll(minted1155MarketplaceInstance.address, true);
      await expect(
        minted1155MarketplaceInstance
          .connect(owner)
          .createSell(price, expireDate, tokenId, quantity)
      ).to.be.revertedWith(MarketplaceErrorMsg.INVALID_EXPIRE_DATE);
    });
  });

  describe("test edit sell", function () {
    it("should allow to edit sell", async function () {
      // Create an sell
      const tokenId = await landRockerERC1155Instance
        .connect(approvedContract)
        .callStatic.safeMint(owner.address, 10);

      await landRockerERC1155Instance
        .connect(approvedContract)
        .safeMint(owner.address, 10);

      const price = ethers.utils.parseUnits("1");
      const expireDate =
        (await time.latest()) + (await Helper.convertToSeconds("weeks", 1));
      const quantity = 2;
      await landRockerERC1155Instance
        .connect(owner)
        .setApprovalForAll(minted1155MarketplaceInstance.address, true);

      await minted1155MarketplaceInstance
        .connect(owner)
        .createSell(price, expireDate, tokenId, quantity);

      //new values
      const price2 = ethers.utils.parseUnits("2");
      const expireDate2 =
        (await time.latest()) + (await Helper.convertToSeconds("weeks", 2));
      const quantity2 = 3;

      const tx = await minted1155MarketplaceInstance
        .connect(owner)
        .editSell(0, price2, expireDate2, tokenId, quantity2);

      await expect(tx)
        .to.emit(minted1155MarketplaceInstance, "SellUpdated")
        .withArgs(0, owner.address, expireDate2, price2, tokenId, quantity2);

      const sell = await minted1155MarketplaceInstance.minted1155Sells(0);

      // Check that the sell has the correct details
      expect(sell.sellData.price).to.equal(price2);
      expect(sell.sellData.status).to.equal(0);
      expect(sell.sellData.collection).to.equal(
        landRockerERC1155Instance.address
      );
      expect(sell.sellData.expireDate).to.equal(expireDate2);
      expect(sell.tokenId).to.equal(tokenId);
      expect(sell.quantity).to.equal(quantity2);
    });

    it("should not allow to edit sell if caller is not NFT owner", async function () {
      // Create an sell
      const tokenId = await landRockerERC1155Instance
        .connect(approvedContract)
        .callStatic.safeMint(owner.address, 10);

      await landRockerERC1155Instance
        .connect(approvedContract)
        .safeMint(owner.address, 10);

      const price = ethers.utils.parseUnits("1");
      const expireDate =
        (await time.latest()) + (await Helper.convertToSeconds("weeks", 1));
      const quantity = 2;

      await landRockerERC1155Instance
        .connect(owner)
        .setApprovalForAll(minted1155MarketplaceInstance.address, true);

      await expect(
        minted1155MarketplaceInstance
          .connect(owner)
          .editSell(0, price, expireDate, tokenId, quantity)
      ).to.be.revertedWith(Minted1155ErrorMsg.NOT_NFT_OWNER);
    });

    it("should not allow to edit sell if quantity Amount is too low", async function () {
      const tokenId = await landRockerERC1155Instance
        .connect(approvedContract)
        .callStatic.safeMint(owner.address, 10);

      await landRockerERC1155Instance
        .connect(approvedContract)
        .safeMint(owner.address, 10);

      const price = ethers.utils.parseUnits("1");
      const expireDate =
        (await time.latest()) + (await Helper.convertToSeconds("weeks", 1));
      const quantity = 0;

      await landRockerERC1155Instance
        .connect(owner)
        .setApprovalForAll(minted1155MarketplaceInstance.address, true);
      await expect(
        minted1155MarketplaceInstance
          .connect(owner)
          .editSell(0, price, expireDate, tokenId, quantity)
      ).to.be.revertedWith(Minted1155ErrorMsg.INVALID_QUANTITY);
    });

    it("should not allow to edit sell if expire date is invalid", async function () {
      const tokenId = await landRockerERC1155Instance
        .connect(approvedContract)
        .callStatic.safeMint(owner.address, 10);

      await landRockerERC1155Instance
        .connect(approvedContract)
        .safeMint(owner.address, 10);

      const price = ethers.utils.parseUnits("1");
      const expireDate = await time.latest();
      const quantity = 2;
      await expect(
        minted1155MarketplaceInstance
          .connect(owner)
          .editSell(0, price, expireDate, tokenId, quantity)
      ).to.be.revertedWith(MarketplaceErrorMsg.INVALID_EXPIRE_DATE);
    });

    it("should not allow to edit sell if sell has not valid status", async function () {
      const tokenId = await landRockerERC1155Instance
        .connect(approvedContract)
        .callStatic.safeMint(owner.address, 10);

      await landRockerERC1155Instance
        .connect(approvedContract)
        .safeMint(owner.address, 10);

      const price = ethers.utils.parseUnits("1");
      const expireDate =
        (await time.latest()) + (await Helper.convertToSeconds("weeks", 1));
      const quantity = 2;
      await landRockerERC1155Instance
        .connect(owner)
        .setApprovalForAll(minted1155MarketplaceInstance.address, true);

      await minted1155MarketplaceInstance
        .connect(owner)
        .createSell(price, expireDate, tokenId, quantity);

      await lrtInstance
        .connect(distributor)
        .transferToken(addr2.address, ethers.utils.parseUnits("500"));

      await lrtInstance
        .connect(addr2)
        .approve(minted1155MarketplaceInstance.address, price);

      await minted1155MarketplaceInstance.connect(addr2).buyItem(0);

      await expect(
        minted1155MarketplaceInstance
          .connect(owner)
          .editSell(0, price, expireDate, tokenId, quantity)
      ).to.be.revertedWith(Minted1155ErrorMsg.SOLD_NFT);
    });
  });
  describe("test buy NFT", function () {
    it("should allow to buy minted erc1155 token", async function () {
      const tokenId = await landRockerERC1155Instance
        .connect(approvedContract)
        .callStatic.safeMint(owner.address, 10);

      await landRockerERC1155Instance
        .connect(approvedContract)
        .safeMint(owner.address, 10);

      const price = ethers.utils.parseUnits("3");
      const expireDate =
        (await time.latest()) + (await Helper.convertToSeconds("weeks", 1));
      const quantity = 2;
      //const royaltyPercentage = 1000;
      //const systemFee = await landRockerInstance.systemFee();
     // console.log(systemFee,".............................");
      const treasury1155 = await landRockerInstance.treasury1155();

      await landRockerERC1155Instance
        .connect(owner)
        .setApprovalForAll(minted1155MarketplaceInstance.address, true);

      await minted1155MarketplaceInstance
        .connect(owner)
        .createSell(price, expireDate, tokenId, quantity);

      await lrtInstance
        .connect(distributor)
        .transferToken(addr2.address, ethers.utils.parseUnits("500"));

      await lrtInstance
        .connect(addr2)
        .approve(minted1155MarketplaceInstance.address, price);

      //before buy
      const oldBuyerBalance = await lrtInstance.balanceOf(addr2.address);
      //console.log(ethers.utils.formatUnits(await lrtInstance.balanceOf(addr2.address)),"adrrrrrrrr1");
      const oldSellerBalance = await lrtInstance.balanceOf(owner.address);
      //console.log(ethers.utils.formatUnits(await lrtInstance.balanceOf(owner.address)),"ownerrrrrrrr1");
      const oldSystemBalance = await lrtInstance.balanceOf(
        minted1155MarketplaceInstance.address
      );
      //console.log(ethers.utils.formatUnits(await lrtInstance.balanceOf(landRockerERC1155Instance.address)),"landRockerERC1155Instance1");

      const tx = await minted1155MarketplaceInstance.connect(addr2).buyItem(0);

      await expect(tx)
        .to.emit(minted1155MarketplaceInstance, "ItemBoughtMinted1155")
        .withArgs(
          0,
          addr2.address,
          owner.address,
          landRockerERC1155Instance.address,
          0,
          quantity
        );

      const newBuyerBalance = await lrtInstance.balanceOf(addr2.address);
      const newSellerBalance = await lrtInstance.balanceOf(owner.address);
      const newSystemBalance = await lrtInstance.balanceOf(
        minted1155MarketplaceInstance.address
      );

      //let systemPortion = Math.Big(systemFee).mul(price).div(10000);
      //let totalPay = Math.Big(price).sub(systemPortion);
      //let royaltyAmount = Math.Big(totalPay).mul(royaltyPercentage).div(10000);

      const sell = await minted1155MarketplaceInstance.minted1155Sells(0);
      expect(
        await landRockerERC1155Instance.balanceOf(addr2.address, 0)
      ).to.equal(2);
      expect(sell.sellData.status).to.equal(1);
      expect(Number(newBuyerBalance)).to.equal(
        Number(Math.Big(oldBuyerBalance).sub(price))
      );
      // expect(Number(newSellerBalance)).to.equal(
      //   Number(Math.Big(oldSeller).add(Math.Big(totalPay).sub(royaltyAmount)))
      // );
      expect(Number(newSellerBalance)).to.equal(
        Number(Math.Big(oldSellerBalance).add((price)))
      );
      // expect(Number(newSystemBalance)).to.equal(
      //   Number(Math.Big(oldSystemBalance).add(systemPortion))
      // );
      expect(Number(newSystemBalance)).to.equal(
        Number(Math.Big(oldSystemBalance))
      );
    });

    it("should not allow to buy minted erc1155 token when sale has expired", async function () {
      const tokenId = await landRockerERC1155Instance
        .connect(approvedContract)
        .callStatic.safeMint(owner.address, 10);

      await landRockerERC1155Instance
        .connect(approvedContract)
        .safeMint(owner.address, 10);

      const price = ethers.utils.parseUnits("1");
      const expireDate =
        (await time.latest()) + (await Helper.convertToSeconds("weeks", 1));
      const quantity = 2;

      await landRockerERC1155Instance
        .connect(owner)
        .setApprovalForAll(minted1155MarketplaceInstance.address, true);
      await minted1155MarketplaceInstance
        .connect(owner)
        .createSell(price, expireDate, tokenId, quantity);

      await lrtInstance
        .connect(distributor)
        .transferToken(addr2.address, ethers.utils.parseUnits("500"));

      const elapsedTime = await Helper.convertToSeconds("weeks", 2);

      await network.provider.send("evm_increaseTime", [elapsedTime]);
      await network.provider.send("evm_mine");

      await lrtInstance
        .connect(addr2)
        .approve(minted1155MarketplaceInstance.address, price);

      await expect(
        minted1155MarketplaceInstance.connect(addr2).buyItem(0)
      ).to.be.revertedWith(MarketplaceErrorMsg.SALE_HAS_EXPIRED);
    });

    it("should not allow to buy minted erc1155 token when status of listed NFTs is not be valid", async function () {
      const tokenId = await landRockerERC1155Instance
        .connect(approvedContract)
        .callStatic.safeMint(owner.address, 10);

      await landRockerERC1155Instance
        .connect(approvedContract)
        .safeMint(owner.address, 10);

      const price = ethers.utils.parseUnits("1");
      const expireDate = 0;
      const quantity = 2;

      await landRockerERC1155Instance
        .connect(owner)
        .setApprovalForAll(minted1155MarketplaceInstance.address, true);

      await minted1155MarketplaceInstance
        .connect(owner)
        .createSell(price, expireDate, tokenId, quantity);

      await landRockerERC1155Instance
        .connect(owner)
        .setApprovalForAll(minted1155MarketplaceInstance.address, false);

      await minted1155MarketplaceInstance.connect(owner).cancelSell(0);

      await lrtInstance
        .connect(distributor)
        .transferToken(addr2.address, ethers.utils.parseUnits("500"));

      await lrtInstance
        .connect(addr2)
        .approve(minted1155MarketplaceInstance.address, price);

      await expect(
        minted1155MarketplaceInstance.connect(addr2).buyItem(0)
      ).to.be.revertedWith(Minted1155ErrorMsg.INVALID_STATUS_TO_SELL);
    });

    it("should not allow to buy non minted erc1155 token when has allowance error", async function () {
      const tokenId = await landRockerERC1155Instance
        .connect(approvedContract)
        .callStatic.safeMint(owner.address, 10);

      await landRockerERC1155Instance
        .connect(approvedContract)
        .safeMint(owner.address, 10);

      const price = ethers.utils.parseUnits("1");
      const expireDate = 0;
      const quantity = 2;

      await landRockerERC1155Instance
        .connect(owner)
        .setApprovalForAll(minted1155MarketplaceInstance.address, true);

      await minted1155MarketplaceInstance
        .connect(owner)
        .createSell(price, expireDate, tokenId, quantity);

      await lrtInstance
        .connect(distributor)
        .transferToken(addr2.address, ethers.utils.parseUnits("500"));

      await lrtInstance
        .connect(addr2)
        .approve(minted1155MarketplaceInstance.address, 0);

      await expect(
        minted1155MarketplaceInstance.connect(addr2).buyItem(0)
      ).to.be.revertedWith(MarketplaceErrorMsg.ALLOWANCE);
    });

   
    it("should set debt to buy minted erc1155 token when user has not sufficient balance", async function () {
      const tokenId = await landRockerERC1155Instance
        .connect(approvedContract)
        .callStatic.safeMint(owner.address, 10);

      await landRockerERC1155Instance
        .connect(approvedContract)
        .safeMint(owner.address, 10);

      const price = ethers.utils.parseUnits("10");
      const expireDate = (await time.latest()) + (await Helper.convertToSeconds("weeks", 1));
      const quantity = 2;
      //const royaltyPercentage = 1000;
      //const systemFee = await landRockerInstance.systemFee();
     // console.log(systemFee,".............................");
      const treasury1155 = await landRockerInstance.treasury1155();

      await landRockerERC1155Instance
        .connect(owner)
        .setApprovalForAll(minted1155MarketplaceInstance.address, true);

      await minted1155MarketplaceInstance
        .connect(owner)
        .createSell(price, expireDate, tokenId, quantity);

        //console.log(Number(await lrtInstance.balanceOf(lrtInstance.address)),"lrtbalance");
      
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
        .approve(minted1155MarketplaceInstance.address, price);

        //before buy
      const oldBuyerBalance = await lrtInstance.balanceOf(addr2.address);
      //console.log(await lrtInstance.balanceOf(addr2.address),"adrrrrrrrr2");
      const oldSeller = await lrtInstance.balanceOf(owner.address);
     // console.log(ethers.utils.formatUnits(await lrtInstance.balanceOf(owner.address)),"ownerrrrrr");
      const oldSystemBalance = await lrtInstance.balanceOf(
        minted1155MarketplaceInstance.address
      );
      //console.log(ethers.utils.formatUnits(await lrtInstance.balanceOf(minted1155MarketplaceInstance.address)),"minted");
      
       const tx = await minted1155MarketplaceInstance.connect(addr2).buyItem(0);
      await expect(tx)
        .to.emit(minted1155MarketplaceInstance, "ItemBoughtMinted1155")
        .withArgs(
          0,
          addr2.address,
          owner.address,
          landRockerERC1155Instance.address,
          0,
          quantity
        );

      const newBuyerBalance = await lrtInstance.balanceOf(addr2.address);
      //console.log(Number(newBuyerBalance),"newBuyerBalance");
      const newSellerBalance = await lrtInstance.balanceOf(owner.address);
     // console.log(Number(newSellerBalance),"newSellerBalance");
      const newSystemBalance = await lrtInstance.balanceOf(
        minted1155MarketplaceInstance.address
      );

      //console.log(Number(newSystemBalance),"newSystemBalance");

      // let systemPortion = Math.Big(systemFee).mul(price).div(10000);
      // let totalPay = Math.Big(price).sub(systemPortion);
      // let royaltyAmount = Math.Big(totalPay).mul(royaltyPercentage).div(10000);
      const sell = await minted1155MarketplaceInstance.minted1155Sells(0);
     
      // console.log(ethers.utils.formatUnits(await landRockerERC1155Instance.balanceOf(addr2.address,0)),"addr2Balance");
      
      expect(
        await landRockerERC1155Instance.balanceOf(addr2.address, 0)
      ).to.equal(2);

      expect(sell.sellData.status).to.equal(1);
      expect(Number(newBuyerBalance)).to.equal(
        Number(Math.Big(oldBuyerBalance))
      );
      
      const vestingStat = await lrtVestingInstance.holdersStat(addr2.address);
      expect(vestingStat.claimedAmount).to.equal(price);

      await expect(tx)
        .to.emit(lrtVestingInstance, "DebtCreated")
        .withArgs(price, addr2.address);
    });
  });

  describe("test cancel sell", function () {
    beforeEach(async function () {
      const tokenId = await landRockerERC1155Instance
        .connect(approvedContract)
        .callStatic.safeMint(owner.address, 10);

      await landRockerERC1155Instance
        .connect(approvedContract)
        .safeMint(owner.address, 10);

      const price = ethers.utils.parseUnits("1");
      const expireDate =
        (await time.latest()) + (await Helper.convertToSeconds("weeks", 1));
      const quantity = 2;

      await landRockerERC1155Instance
        .connect(owner)
        .setApprovalForAll(minted1155MarketplaceInstance.address, true);

      await minted1155MarketplaceInstance
        .connect(owner)
        .createSell(price, expireDate, tokenId, quantity);
    });

    it("should allow to cancel sell", async function () {
      await landRockerERC1155Instance
        .connect(owner)
        .setApprovalForAll(minted1155MarketplaceInstance.address, false);

      const tx = await minted1155MarketplaceInstance
        .connect(owner)
        .cancelSell(0);

      await expect(tx)
        .to.emit(minted1155MarketplaceInstance, "SellCanceled")
        .withArgs(0);

      const sell = await minted1155MarketplaceInstance.minted1155Sells(0);

      // Check that the sell has the correct details
      expect(sell.sellData.status).to.equal(2);
      expect(
        await landRockerERC1155Instance.balanceOf(owner.address, 0)
      ).to.equal(10);
      expect(
        await landRockerERC1155Instance.isApprovedForAll(
          owner.address,
          minted1155MarketplaceInstance.address
        )
      ).to.equal(false);
    });

    it("should not allow a creator to cancel when a sell has not revoked", async function () {
      await expect(
        minted1155MarketplaceInstance.connect(owner).cancelSell(0)
      ).to.be.revertedWith(Minted1155ErrorMsg.NOT_REVOKED);
    });

    it("should not allow a creator to cancel an erc1155 offer when your not owner ", async function () {
      await expect(
        minted1155MarketplaceInstance.connect(addr1).cancelSell(0)
      ).to.be.revertedWith(Minted1155ErrorMsg.NOT_OWNER_CANCEL);
    });

    it("should not allow a creator to cancel an erc1155 sell when has cancel before ", async function () {
      await lrtInstance
        .connect(distributor)
        .transferToken(addr2.address, ethers.utils.parseUnits("500"));

      await lrtInstance
        .connect(addr2)
        .approve(minted1155MarketplaceInstance.address, ethers.utils.parseUnits("1"));

      await minted1155MarketplaceInstance.connect(addr2).buyItem(0);

      await expect(
        minted1155MarketplaceInstance.connect(owner).cancelSell(0)
      ).to.be.revertedWith(Minted1155ErrorMsg.SOLD_SELL);
    });
  });

  //Upgradeability testing
  describe("Contract Version 1 test", function () {
    it("Should return the greeting after deployment", async function () {
      const Minted1155Marketplace = await ethers.getContractFactory("Minted1155Marketplace");
  
      const contract = await upgrades.deployProxy(Minted1155Marketplace, [landRockerERC1155Instance.address,
        arInstance.address,
        lrtInstance.address,
        landRockerInstance.address,
        lrtVestingInstance.address], { initializer: '__Minted1155Marketplace_init', kind: 'uups'});
      await contract.deployed();
  
      expect(await contract.greeting()).to.equal("Hello, upgradeable world!");
    });
  });
  
  describe("Contract Version 2 test", function () {
    let oldContract, upgradedContract, owner, addr1;
    beforeEach(async function () {
      [owner, addr1] = await ethers.getSigners(2);
      const Minted1155Marketplace = await ethers.getContractFactory("Minted1155Marketplace");
      const Minted1155MarketplaceUpgraded = await ethers.getContractFactory("Minted1155MarketplaceUpgraded");
  
      oldContract = await upgrades.deployProxy(Minted1155Marketplace, [landRockerERC1155Instance.address,
        arInstance.address,
        lrtInstance.address,
        landRockerInstance.address,
        lrtVestingInstance.address], { initializer: '__Minted1155Marketplace_init', kind: 'uups'});
  
      await oldContract.deployed();  

      upgradedContract = await upgrades.upgradeProxy(oldContract, Minted1155MarketplaceUpgraded,
         {call: {fn: '__Minted1155MarketplaceUpgraded_init', args:[landRockerERC1155Instance.address,
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
