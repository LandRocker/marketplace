const { expect, util } = require("chai");
const {
  time,
  loadFixture,
} = require("@nomicfoundation/hardhat-network-helpers");

const {
  MarketplaceErrorMsg,
  AccessErrorMsg,
  NonMinted721ErrorMsg,
} = require("./messages");
const { ethers, network } = require("hardhat");

const Math = require("./helper/math");

const {
  nonMinted721MarketplaceFixture,
} = require("./fixture/nonMinted721Marketplace.fixture");
const Helper = require("./helper");

const zeroAddress = "0x0000000000000000000000000000000000000000";

describe("NonMinted721 Marketplace contract", function () {
  let nft721PoolInstance,
    nonMinted721MarketplaceInstance,
    landRockerERC721FactoryInstance,
    landRockerInstance,
    landRockerERC721Instance,
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
    lrtVestingInstance,
    collection_one,
    collection_two;
  let baseURI =
    "https://srvs20.landrocker.io/game_service/bc/get/uniq/token/data?token_id=";
  let baseURI2 =
    "https://srvs20.landrocker.io/game_service/bc/get/token/data?token_id=";

  const cap = ethers.utils.parseUnits("100");
  const discountPercentage = 1000;
  let usecase = ethers.utils.keccak256(
    ethers.utils.toUtf8Bytes("MARKETPLACE_721")
  );
  let usecase2 = ethers.utils.keccak256(
    ethers.utils.toUtf8Bytes("MARKETPLACE_1155")
  );

  beforeEach(async function () {
    ({
      nonMinted721MarketplaceInstance,
      landRockerERC721FactoryInstance,
      landRockerInstance,
      landRockerERC721Instance,
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
      lrtVestingInstance,
      collection_one,
      collection_two
    } = await loadFixture(nonMinted721MarketplaceFixture));

    discountExpireDate =
      (await time.latest()) + (await Helper.convertToSeconds("weeks", 1));


  });

  describe("test setUserDiscount", function () {

    it("should allow to set UserDiscount", async function () {
      const tx = await nonMinted721MarketplaceInstance
        .connect(script)
        .setUserDiscount(
          addr2.address,
          discountPercentage,
          discountExpireDate,
          5,
          cap
        );

      console.log(usecase);
      console.log(usecase2);


      await expect(tx)
        .to.emit(nonMinted721MarketplaceInstance, "UserDiscountSet")
        .withArgs(
          addr2.address,
          discountPercentage,
          discountExpireDate,
          5,
          cap
        );

      const userDiscount = await nonMinted721MarketplaceInstance.userDiscounts(
        addr2.address
      );

      expect(Number(userDiscount.discountRate)).to.equal(discountPercentage);
      expect(Number(userDiscount.expireDate)).to.equal(discountExpireDate);
      expect(userDiscount.usageLimit).to.equal(5);
      expect(Number(userDiscount.discountCap)).to.equal(Number(Math.Big(cap)));
    });

    it("should not allow to set UserDiscount when caller is not admin", async function () {
      await expect(
        nonMinted721MarketplaceInstance
          .connect(addr2)
          .setUserDiscount(
            addr2.address,
            discountPercentage,
            discountExpireDate,
            5,
            cap
          )
      ).to.be.revertedWith(AccessErrorMsg.CALLER_NOT_SCRIPT);
    });

    it("should not allow to set UserDiscount when user address is not valid", async function () {
      await expect(
        nonMinted721MarketplaceInstance
          .connect(script)
          .setUserDiscount(
            zeroAddress,
            discountPercentage,
            discountExpireDate,
            5,
            cap
          )
      ).to.be.revertedWith(NonMinted721ErrorMsg.NOT_VALID_ADDRESS);
    });

    it("should not allow to set UserDiscount when expiration date is not valid", async function () {
      await expect(
        nonMinted721MarketplaceInstance
          .connect(script)
          .setUserDiscount(
            addr2.address,
            discountPercentage,
            (await time.latest()) - (await Helper.convertToSeconds("weeks", 1)),
            5,
            cap
          )
      ).to.be.revertedWith(MarketplaceErrorMsg.INVALID_EXPIRE_DATE);
    });

    it("should not allow to set UserDiscount when cap is not valid", async function () {
      await expect(
        nonMinted721MarketplaceInstance
          .connect(script)
          .setUserDiscount(
            addr2.address,
            discountPercentage,
            discountExpireDate,
            5,
            0
          )
      ).to.be.revertedWith(NonMinted721ErrorMsg.NOT_VALID_DISCOUNT_CAP);
    });

    it("should not allow to set UserDiscount when count is less than user usedDiscount", async function () {
      const price = ethers.utils.parseUnits("5");
      const floorPrice = ethers.utils.parseUnits("1");
      const expireDate = 0;

      await nonMinted721MarketplaceInstance
        .connect(admin)
        .createSell(price, collection_one, expireDate);

      await lrtInstance
        .connect(distributor)
        .transferToken(addr2.address, ethers.utils.parseUnits("500"));

      await lrtInstance
        .connect(addr2)
        .approve(nonMinted721MarketplaceInstance.address, price);

      const tx_first_time = await nonMinted721MarketplaceInstance
        .connect(script)
        .setUserDiscount(addr2.address, 1000, discountExpireDate, 1, cap);

      await nonMinted721MarketplaceInstance.connect(addr2).buyItem(0);

      await expect(
        nonMinted721MarketplaceInstance
          .connect(script)
          .setUserDiscount(
            addr2.address,
            discountPercentage,
            discountExpireDate,
            0,
            cap
          )
      ).to.be.revertedWith(NonMinted721ErrorMsg.NOT_VALID_DISCOUNT_USAGE_LIMIT);
    });
  });

  // describe("test setLandRockerCollection", function () {
  //   it("should allow to set LandRockerCollection", async function () {
  //     const tx = await nonMinted721MarketplaceInstance
  //       .connect(admin)
  //       .setLandRockerCollection(collection_one, true);

  //     await expect(tx)
  //       .to.emit(nonMinted721MarketplaceInstance, "CollectionAdded")
  //       .withArgs(collection_one, true);

  //     expect(
  //       await nonMinted721MarketplaceInstance
  //         .connect(admin)
  //         .landrocker721Collections(collection_one)
  //     ).to.be.true;
  //   });

  //   it("should not allow to set LandRockerCollection when caller is not admin", async function () {
  //     await expect(
  //       nonMinted721MarketplaceInstance
  //         .connect(addr2)
  //         .setLandRockerCollection(collection_one, true)
  //     ).to.be.revertedWith(AccessErrorMsg.CALLER_NOT_ADMIN);
  //   });

  //   it("should not allow to set LandRockerCollection when collection is not valid", async function () {
  //     await expect(
  //       nonMinted721MarketplaceInstance
  //         .connect(admin)
  //         .setLandRockerCollection(zeroAddress, true)
  //     ).to.be.revertedWith(NonMinted721ErrorMsg.NOT_VALID_ADDRESS);
  //   });
  // });

  describe("test withdraw", function () {
    beforeEach(async function () {
      
      const price = ethers.utils.parseUnits("5");
      const floorPrice = ethers.utils.parseUnits("1");
      const itemId = 0;
      const expireDate = 0;
      const royaltyPercentage = 200;
      const systemFee = await landRockerInstance.systemFee();
      const treasury721 = await landRockerInstance.treasury721();

      await nonMinted721MarketplaceInstance
        .connect(admin)
        .createSell(price, collection_one, expireDate);

      await lrtInstance
        .connect(distributor)
        .transferToken(addr2.address, ethers.utils.parseUnits("500"));

      await lrtInstance
        .connect(addr2)
        .approve(nonMinted721MarketplaceInstance.address, price);

      const tx = await nonMinted721MarketplaceInstance
        .connect(script)
        .setUserDiscount(addr2.address, 1000, discountExpireDate, 5, cap);

      await nonMinted721MarketplaceInstance.connect(addr2).buyItem(0);
    });

    it("should allow to withdraw contract balance", async function () {
      const amount = ethers.utils.parseUnits("0.002", 18);
      const treasuryAddress = await landRockerInstance.treasury();
      const oldTreasury = await lrtInstance.balanceOf(treasuryAddress);
      const oldSystemBalance = await lrtInstance.balanceOf(
        nonMinted721MarketplaceInstance.address
      );

      ethers.utils.formatUnits(
        await lrtInstance.balanceOf(nonMinted721MarketplaceInstance.address)
      ),
        "after buy";

      const tx = await nonMinted721MarketplaceInstance
        .connect(admin)
        .withdraw(amount);

      await expect(tx)
        .to.emit(nonMinted721MarketplaceInstance, "Withdrawn")
        .withArgs(amount, treasuryAddress);

      const newTreasury = await lrtInstance.balanceOf(treasuryAddress);
      const newSystemBalance = await lrtInstance.balanceOf(
        nonMinted721MarketplaceInstance.address
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
        nonMinted721MarketplaceInstance.connect(addr1).withdraw(amount)
      ).to.be.revertedWith(AccessErrorMsg.CALLER_NOT_ADMIN);
    });

    it("should not allow to withdraw sell if amount is too low", async function () {
      const amount = ethers.utils.parseUnits("0", 18);

      await expect(
        nonMinted721MarketplaceInstance.connect(admin).withdraw(amount)
      ).to.be.revertedWith(MarketplaceErrorMsg.TOO_LOW_AMOUNT);
    });

    it("should not allow to withdraw sell if balance insufficient", async function () {
      const amount = ethers.utils.parseUnits("1000", 18);

      await expect(
        nonMinted721MarketplaceInstance.connect(admin).withdraw(amount)
      ).to.be.revertedWith(MarketplaceErrorMsg.NO_BALANCE_WITHDRAW);
    });
  });

  describe("test create Sell", function () {
    // beforeEach(async function () {
    //   // Create an pool
    //   const usecase = ethers.utils.keccak256(
    //     ethers.utils.toUtf8Bytes("MARKETPLACE_1155")
    //   );
    //   // ethers.utils.formatBytes32String("MARKETPLACE");
    //   const startTokenId = 0;
    //   const endTokenId = 100;

    //   const txcreatePool = await nft721PoolInstance
    //     .connect(admin)
    //     .createPool(usecase, collection_one, startTokenId, endTokenId);

    //   const txAddSupply = await nft721PoolInstance
    //     .connect(admin)
    //     .addSupply(0, usecase, collection_one);

    //   const supply = await nft721PoolInstance
    //     .connect(admin)
    //     .usecaseSupplies(usecase, collection_one, 0);

    //   const tx = await nonMinted721MarketplaceInstance
    //     .connect(script)
    //     .setUserDiscount(addr2.address, 1000, discountExpireDate, 5, cap);
    // });

    it("should allow to create sell", async function () {
      // Create an sell
      const itemId = 0;
      const price = ethers.utils.parseUnits("1");
      const floorPrice = ethers.utils.parseUnits("1");
      const expireDate =
        (await time.latest()) + (await Helper.convertToSeconds("weeks", 1));

      const tx = await nonMinted721MarketplaceInstance
        .connect(admin)
        .createSell(price, collection_one, expireDate);

      const sell = await nonMinted721MarketplaceInstance.nonMinted721Sells(0);
      await expect(tx)
        .to.emit(nonMinted721MarketplaceInstance, "SellCreated")
        .withArgs(0, nonMinted721MarketplaceInstance.address, collection_one, expireDate, price);

      // Check that the sell has the correct details
      expect(sell.sellData.price).to.equal(price);
      expect(sell.sellData.status).to.equal(0);
      expect(sell.sellData.collection).to.equal(collection_one);
      expect(sell.sellData.expireDate).to.equal(expireDate);
      expect(sell.tokenId).to.equal(itemId);
    });

    it("should not allow to create sell if caller is not admin", async function () {
      const itemId = 0;
      const price = ethers.utils.parseUnits("1");
      const floorPrice = ethers.utils.parseUnits("1");
      const expireDate =
        (await time.latest()) + (await Helper.convertToSeconds("weeks", 1));
      await expect(
        nonMinted721MarketplaceInstance
          .connect(addr2)
          .createSell(price, collection_one, expireDate)
      ).to.be.revertedWith(AccessErrorMsg.CALLER_NOT_ADMIN);
    });

    // it("should not allow to create sell when price is less than floor price", async function () {
    //   const itemId = 0;
    //   const price = ethers.utils.parseUnits("1");
    //   const floorPrice = ethers.utils.parseUnits("5");
    //   const expireDate =
    //     (await time.latest()) + (await Helper.convertToSeconds("weeks", 1));
    //   await expect(
    //     nonMinted721MarketplaceInstance
    //       .connect(admin)
    //       .createSell(price, collection_one, expireDate)
    //   ).to.be.revertedWith(NonMinted721ErrorMsg.INVALID_PRICE);
    // });

    // it("should not allow to create sell if collection is false", async function () {
    //   const price = ethers.utils.parseUnits("1");
    //   const floorPrice = ethers.utils.parseUnits("1");
    //   const itemId = 0;

    //   const expireDate =
    //     (await time.latest()) + (await Helper.convertToSeconds("weeks", 1));

    //   let falseCollection = await nonMinted721MarketplaceInstance
    //     .connect(admin)
    //     .setLandRockerCollection(collection_one, false);

    //   await expect(
    //     nonMinted721MarketplaceInstance
    //       .connect(admin)
    //       .createSell(price, collection_one, expireDate)
    //   ).to.be.revertedWith(NonMinted721ErrorMsg.INVALID_TOKEN);
    // });

    it("should not allow to create sell if expire date is invalid", async function () {
      const price = ethers.utils.parseUnits("1");
      const floorPrice = ethers.utils.parseUnits("1");
      const expireDate = await time.latest();
      const itemId = 0;

      await expect(
        nonMinted721MarketplaceInstance
          .connect(admin)
          .createSell(price, collection_one, expireDate)
      ).to.be.revertedWith(MarketplaceErrorMsg.INVALID_EXPIRE_DATE);
    });

    it("should not allow to create sell if sell has not valid status", async function () {
      const price = ethers.utils.parseUnits("1");
      const floorPrice = ethers.utils.parseUnits("1");
      const expireDate = 0;
      const itemId = 0;

      const cloneContract = await ethers.getContractFactory("LandRockerERC721");
      const clone1 = cloneContract.attach(collection_one);

      const tx = await nonMinted721MarketplaceInstance
        .connect(admin)
        .createSell(price, collection_one, expireDate);

      await expect(tx)
        .to.emit(nonMinted721MarketplaceInstance, "SellCreated")
        .withArgs(0, nonMinted721MarketplaceInstance.address, collection_one, expireDate, price);

      await lrtInstance
        .connect(distributor)
        .transferToken(addr2.address, ethers.utils.parseUnits("500"));

      await lrtInstance
        .connect(addr2)
        .approve(nonMinted721MarketplaceInstance.address, price);

      await nonMinted721MarketplaceInstance.connect(addr2).buyItem(0);
      const sell = await nonMinted721MarketplaceInstance.nonMinted721Sells(0);
      expect(sell.sellData.status).to.equal(1);

      //buying a collection after sold
      // await expect(
      //   nonMinted721MarketplaceInstance
      //     .connect(admin)
      //     .createSell(itemId,price, collection_one, 0, expireDate)
      // ).to.be.revertedWith(NonMinted721ErrorMsg.SOLD_NFT);
    });
  });

  describe("test edit sell", function () {
    // beforeEach(async function () {
    //   // Create an pool
    //   const usecase = ethers.utils.keccak256(
    //     ethers.utils.toUtf8Bytes("MARKETPLACE_1155")
    //   );
    //   // ethers.utils.formatBytes32String("MARKETPLACE");
    //   const startTokenId = 0;
    //   const endTokenId = 100;

    //   const txcreatePool = await nft721PoolInstance
    //     .connect(admin)
    //     .createPool(usecase, collection_one, startTokenId, endTokenId);

    //   const txAddSupply = await nft721PoolInstance
    //     .connect(admin)
    //     .addSupply(0, usecase, collection_one);

    //   const supply = await nft721PoolInstance
    //     .connect(admin)
    //     .usecaseSupplies(usecase, collection_one, 0);

    //   const tx = await nonMinted721MarketplaceInstance
    //     .connect(script)
    //     .setUserDiscount(addr2.address, 1000, discountExpireDate, 5, cap);
    // });

    it("should not allow to edit sell when The sell does not exist", async function () {
      const price = ethers.utils.parseUnits("1");
      const itemId = 0;
      const expireDate =
        (await time.latest()) + (await Helper.convertToSeconds("weeks", 1));
      await expect(
        nonMinted721MarketplaceInstance
          .connect(admin)
          .editSell(0, price, zeroAddress, expireDate)
      ).to.be.revertedWith(NonMinted721ErrorMsg.NOT_ACTIVE_COLLECTION);
    });

    it("should allow to edit sell", async function () {
      // Create an sell
      const price1 = ethers.utils.parseUnits("1");
      const floorPrice1 = ethers.utils.parseUnits("1");
      const itemId = 0;

      const expireDate1 =
        (await time.latest()) + (await Helper.convertToSeconds("weeks", 1));

      const tx1 = await nonMinted721MarketplaceInstance
        .connect(admin)
        .createSell(price1, collection_one, expireDate1);

      await expect(tx1)
        .to.emit(nonMinted721MarketplaceInstance, "SellCreated")
        .withArgs(
          0,
          nonMinted721MarketplaceInstance.address,
          collection_one,
          expireDate1,
          price1
          
        );

      //Edit the sell
      const price2 = ethers.utils.parseUnits("1");
      const expireDate2 =
        (await time.latest()) + (await Helper.convertToSeconds("weeks", 1));

      const tx2 = await nonMinted721MarketplaceInstance
        .connect(admin)
        .editSell(0, price2, collection_one, expireDate2);

      const sell = await nonMinted721MarketplaceInstance.nonMinted721Sells(0);
      await expect(tx2)
        .to.emit(nonMinted721MarketplaceInstance, "SellUpdated")
        .withArgs(0, collection_one, expireDate2, price2);

      // Check that the sell has the correct details
      expect(sell.sellData.price).to.equal(price2);
      expect(sell.sellData.status).to.equal(0);
      expect(sell.sellData.collection).to.equal(collection_one);
      expect(sell.sellData.expireDate).to.equal(expireDate2);
    });

    it("should not allow to edit sell if caller is not admin", async function () {
      const price = ethers.utils.parseUnits("1");
      const itemId = 0;
      const expireDate =
        (await time.latest()) + (await Helper.convertToSeconds("weeks", 1));
      await expect(
        nonMinted721MarketplaceInstance
          .connect(addr2)
          .editSell(0, price, collection_one, expireDate)
      ).to.be.revertedWith(AccessErrorMsg.CALLER_NOT_ADMIN);
    });

    // it("should not allow to edit sell if price is less than floor price", async function () {
    //   const price = ethers.utils.parseUnits("1");
    //   const floorPrice = ethers.utils.parseUnits("1");
    //   const itemId = 0;
    //   const expireDate =
    //     (await time.latest()) + (await Helper.convertToSeconds("weeks", 1));

    //   const tx = await nonMinted721MarketplaceInstance
    //     .connect(admin)
    //     .createSell(price, collection_one, expireDate);

    //   await expect(
    //     nonMinted721MarketplaceInstance
    //       .connect(admin)
    //       .editSell(0, 0, collection_one, expireDate)
    //   ).to.be.revertedWith(NonMinted721ErrorMsg.INVALID_PRICE);
    // });

    // it("should not allow to edit sell if collection is false", async function () {
    //   const price = ethers.utils.parseUnits("1");
    //   const itemId = 0;
    //   const expireDate =
    //     (await time.latest()) + (await Helper.convertToSeconds("weeks", 1));

    //   let falseCollection = await nonMinted721MarketplaceInstance
    //     .connect(admin)
    //     .setLandRockerCollection(collection_one, false);

    //   await expect(
    //     nonMinted721MarketplaceInstance
    //       .connect(admin)
    //       .editSell(0, price, collection_one, expireDate)
    //   ).to.be.revertedWith(NonMinted721ErrorMsg.INVALID_TOKEN);
    // });

    it("should not allow to edit sell if expire date is invalid", async function () {
      const price = ethers.utils.parseUnits("1");
      const expireDate = await time.latest();
      const itemId = 0;

      await expect(
        nonMinted721MarketplaceInstance
          .connect(admin)
          .editSell(0, price, collection_one, expireDate)
      ).to.be.revertedWith(MarketplaceErrorMsg.INVALID_EXPIRE_DATE);
    });

    it("should not allow to edit sell if sell has not valid status", async function () {
      const price = ethers.utils.parseUnits("1");
      const floorPrice = ethers.utils.parseUnits("1");
      const expireDate = 0;
      const itemId = 0;

      await nonMinted721MarketplaceInstance
        .connect(admin)
        .createSell(price, collection_one, expireDate);

      await lrtInstance
        .connect(distributor)
        .transferToken(addr2.address, ethers.utils.parseUnits("500"));

      await lrtInstance
        .connect(addr2)
        .approve(nonMinted721MarketplaceInstance.address, price);

      await nonMinted721MarketplaceInstance.connect(addr2).buyItem(0);

      await expect(
        nonMinted721MarketplaceInstance
          .connect(admin)
          .editSell(0, price, collection_one, expireDate)
      ).to.be.revertedWith(NonMinted721ErrorMsg.SOLD_NFT);
    });
  });

  describe("test buy NFT", function () {
    beforeEach(async function () {
      // Create an pool
      // const usecase = ethers.utils.keccak256(
      //   ethers.utils.toUtf8Bytes("MARKETPLACE_1155")
      // );
      // // ethers.utils.formatBytes32String("MARKETPLACE");
      // const startTokenId = 0;
      // const endTokenId = 100;

      // const txcreatePool = await nft721PoolInstance
      //   .connect(admin)
      //   .createPool(usecase, collection_one, startTokenId, endTokenId);

      // const txAddSupply = await nft721PoolInstance
      //   .connect(admin)
      //   .addSupply(0, usecase, collection_one);

      // const supply = await nft721PoolInstance
      //   .connect(admin)
      //   .usecaseSupplies(usecase, collection_one, 0);

      const tx = await nonMinted721MarketplaceInstance
        .connect(script)
        .setUserDiscount(addr2.address, 1000, discountExpireDate, 5, cap);
    });

    it("should not allow to buy non minted erc721 token when The sell does not exist", async function () {
      const price = ethers.utils.parseUnits("1");
      const expireDate = 0;
      const itemId = 0;

      await lrtInstance
        .connect(distributor)
        .transferToken(addr2.address, ethers.utils.parseUnits("500"));

      await lrtInstance
        .connect(addr2)
        .approve(nonMinted721MarketplaceInstance.address, price);

      await expect(
        nonMinted721MarketplaceInstance.connect(addr2).buyItem(0)
      ).to.be.revertedWith(NonMinted721ErrorMsg.INVALID_TOKEN);
    });

    it("should allow to buy non minted erc721 token", async function () {
      const price = ethers.utils.parseUnits("1");
      const floorPrice = ethers.utils.parseUnits("1");
      const expireDate = 0;
      const royaltyPercentage = 200;
      const systemFee = await landRockerInstance.systemFee();
      const treasury721 = await landRockerInstance.treasury721();
      const itemId = 0;

      const cloneContract = await ethers.getContractFactory("LandRockerERC721");
      const clone1 = cloneContract.attach(collection_one);

      await nonMinted721MarketplaceInstance
        .connect(admin)
        .createSell(price, collection_one, expireDate);

      await lrtInstance
        .connect(distributor)
        .transferToken(addr2.address, ethers.utils.parseUnits("500"));

      await lrtInstance
        .connect(addr2)
        .approve(nonMinted721MarketplaceInstance.address, price);

      //before buy
      const oldBuyerBalance = await lrtInstance.balanceOf(addr2.address);
      const oldTreasury721 = await lrtInstance.balanceOf(treasury721);
      const oldSystemBalance = await lrtInstance.balanceOf(
        nonMinted721MarketplaceInstance.address
      );

      const tx = await nonMinted721MarketplaceInstance
        .connect(addr2)
        .buyItem(0);

      const newBuyerBalance = await lrtInstance.balanceOf(addr2.address);
      const newTreasury721 = await lrtInstance.balanceOf(treasury721);
      const newSystemBalance = await lrtInstance.balanceOf(
        nonMinted721MarketplaceInstance.address
      );

      let totalPayment = 0;
      const discountAmount = Math.Big(discountPercentage).mul(price).div(10000);

      if (Number(discountAmount) > Number(cap)) {
        totalPayment = Math.Big(price).sub(cap);
      } else {
        totalPayment = Math.Big(price).sub(discountAmount);
      }

      let systemPortion = Math.Big(systemFee).mul(totalPayment).div(10000);
      let totalPay = Math.Big(totalPayment).sub(systemPortion);
      let royaltyAmount = Math.Big(totalPay).mul(royaltyPercentage).div(10000);

      const sell = await nonMinted721MarketplaceInstance.nonMinted721Sells(0);

      await expect(tx)
        .to.emit(nonMinted721MarketplaceInstance, "AssetBought721WithBalance")
        .withArgs(
          0,
          addr2.address,
          sell.sellData.collection,
          price,
          totalPayment.toString(),
          0
        );

      expect(await clone1.ownerOf(0)).to.equal(addr2.address);
      expect(sell.sellData.status).to.equal(1);
      expect(Number(newBuyerBalance)).to.equal(
        Number(Math.Big(oldBuyerBalance).sub(totalPayment))
      );

      expect(Number(newSystemBalance)).to.equal(
        Number(Math.Big(oldSystemBalance).add(systemPortion))
      );
      expect(Number(newTreasury721)).to.equal(
        Number(
          Math.Big(oldTreasury721).add(Math.Big(totalPay).sub(royaltyAmount))
        )
      );
    });

    it("should allow to buy non minted erc721 token with zero royalty amount", async function () {
      const price = ethers.utils.parseUnits("1");
      const floorPrice = ethers.utils.parseUnits("1");
      const expireDate = 0;
      const royaltyPercentage = 200;
      const systemFee = await landRockerInstance.systemFee();
      const treasury721 = await landRockerInstance.treasury721();
      const itemId = 0;

      const cloneContract = await ethers.getContractFactory("LandRockerERC721");
      const clone1 = cloneContract.attach(collection_one);

      await nonMinted721MarketplaceInstance
        .connect(admin)
        .createSell(price, collection_one, expireDate);

      await lrtInstance
        .connect(distributor)
        .transferToken(addr2.address, ethers.utils.parseUnits("500"));

      await lrtInstance
        .connect(addr2)
        .approve(nonMinted721MarketplaceInstance.address, price);

      //before buy
      const oldBuyerBalance = await lrtInstance.balanceOf(addr2.address);
      const oldTreasury721 = await lrtInstance.balanceOf(treasury721);
      const oldSystemBalance = await lrtInstance.balanceOf(
        nonMinted721MarketplaceInstance.address
      );

      await clone1.connect(admin).deleteDefaultRoyalty();

      const tx = await nonMinted721MarketplaceInstance
        .connect(addr2)
        .buyItem(0);

      const newBuyerBalance = await lrtInstance.balanceOf(addr2.address);
      const newTreasury721 = await lrtInstance.balanceOf(treasury721);
      const newSystemBalance = await lrtInstance.balanceOf(
        nonMinted721MarketplaceInstance.address
      );

      let totalPayment = 0;
      const discountAmount = Math.Big(discountPercentage).mul(price).div(10000);

      if (Number(discountAmount) > Number(cap)) {
        totalPayment = Math.Big(price).sub(cap);
      } else {
        totalPayment = Math.Big(price).sub(discountAmount);
      }

      let systemPortion = Math.Big(systemFee).mul(totalPayment).div(10000);
      let totalPay = Math.Big(totalPayment).sub(systemPortion);
      let royaltyAmount = Math.Big(totalPay).mul(royaltyPercentage).div(10000);

      const sell = await nonMinted721MarketplaceInstance.nonMinted721Sells(0);

      expect(await clone1.ownerOf(0)).to.equal(addr2.address);
      expect(sell.sellData.status).to.equal(1);
      expect(Number(newBuyerBalance)).to.equal(
        Number(Math.Big(oldBuyerBalance).sub(totalPayment))
      );

      expect(Number(newSystemBalance)).to.equal(
        Number(Math.Big(oldSystemBalance).add(systemPortion))
      );
      expect(Number(newTreasury721)).to.equal(
        Number(Math.Big(oldTreasury721).add(Math.Big(totalPay)))
      );
    });

    it("should not allow to buy non minted erc721 token when sale has expired", async function () {
      const price = ethers.utils.parseUnits("1");
      const floorPrice = ethers.utils.parseUnits("1");
      const expireDate =
        (await time.latest()) + (await Helper.convertToSeconds("weeks", 1));
      const itemId = 0;

      await nonMinted721MarketplaceInstance
        .connect(admin)
        .createSell(price, collection_one, expireDate);

      await lrtInstance
        .connect(distributor)
        .transferToken(addr2.address, ethers.utils.parseUnits("500"));
      await lrtInstance
        .connect(addr2)
        .approve(nonMinted721MarketplaceInstance.address, price);

      const elapsedTime = await Helper.convertToSeconds("weeks", 2);

      await network.provider.send("evm_increaseTime", [elapsedTime]);
      await network.provider.send("evm_mine");

      await expect(
        nonMinted721MarketplaceInstance.connect(addr2).buyItem(0)
      ).to.be.revertedWith(MarketplaceErrorMsg.SALE_HAS_EXPIRED);
    });

    it("should not allow to buy non minted erc721 token when status of NFT is not be valid", async function () {
      const price = ethers.utils.parseUnits("1");
      const floorPrice = ethers.utils.parseUnits("1");
      const expireDate = 0;
      const itemId = 0;

      await nonMinted721MarketplaceInstance
        .connect(admin)
        .createSell(price, collection_one, expireDate);

      await nonMinted721MarketplaceInstance.connect(admin).cancelSell(0);

      await lrtInstance
        .connect(distributor)
        .transferToken(addr2.address, ethers.utils.parseUnits("500"));

      await lrtInstance
        .connect(addr2)
        .approve(nonMinted721MarketplaceInstance.address, price);

      await expect(
        nonMinted721MarketplaceInstance.connect(addr2).buyItem(0)
      ).to.be.revertedWith(NonMinted721ErrorMsg.INVALID_STATUS_TO_SELL);
    });

    it("should set debt to buy non minted erc721 token when user has not sufficient balance", async function () {
      const price = ethers.utils.parseUnits("10");
      const floorPrice = ethers.utils.parseUnits("1");
      const expireDate = 0;
      const royaltyPercentage = 200;
      const systemFee = await landRockerInstance.systemFee();
      const treasury721 = await landRockerInstance.treasury721();
      const itemId = 0;

      const cloneContract = await ethers.getContractFactory("LandRockerERC721");
      const clone1 = cloneContract.attach(collection_one);

      await nonMinted721MarketplaceInstance
        .connect(admin)
        .createSell(price, collection_one, expireDate);

      await lrtInstance
        .connect(distributor)
        .transferToken(addr2.address, ethers.utils.parseUnits("5"));

      // set up the vesting plan parameters
      const startDate =
        (await time.latest()) + (await Helper.convertToSeconds("days", 1));
      const cliff = await Helper.convertToSeconds("days", 1); // 1 day cliff86400;
      const duration = await Helper.convertToSeconds("weeks", 1); // 1 week vesting period
      const revocable = true;
      const poolName = ethers.utils.formatBytes32String("Sale");
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
        (await time.latest()) + (await Helper.convertToSeconds("days", 2)); // Start date 1 day from now
      await lrtVestingInstance
        .connect(admin)
        .createVesting(addr2.address, vestingStartDate, vestingAmount, planId);

      await lrtInstance
        .connect(addr2)
        .approve(nonMinted721MarketplaceInstance.address, price);

      //before buy
      const oldBuyerBalance = await lrtInstance.balanceOf(addr2.address);
      const oldTreasury721 = await lrtInstance.balanceOf(treasury721);
      const oldSystemBalance = await lrtInstance.balanceOf(
        nonMinted721MarketplaceInstance.address
      );

      const tx = await nonMinted721MarketplaceInstance
        .connect(addr2)
        .buyItem(0);

      const newBuyerBalance = await lrtInstance.balanceOf(addr2.address);
      const newTreasury721 = await lrtInstance.balanceOf(treasury721);
      const newSystemBalance = await lrtInstance.balanceOf(
        nonMinted721MarketplaceInstance.address
      );

      let totalPayment = 0;
      const discountAmount = Math.Big(discountPercentage).mul(price).div(10000);

      if (Number(discountAmount) > Number(cap)) {
        totalPayment = Math.Big(price).sub(cap);
      } else {
        totalPayment = Math.Big(price).sub(discountAmount);
      }

      let systemPortion = Math.Big(systemFee).mul(totalPayment).div(10000);
      let totalPay = Math.Big(totalPayment).sub(systemPortion);
      let royaltyAmount = Math.Big(totalPay).mul(royaltyPercentage).div(10000);

      const sell = await nonMinted721MarketplaceInstance.nonMinted721Sells(0);

      await expect(tx)
        .to.emit(nonMinted721MarketplaceInstance, "AssetBought721WithVesting")
        .withArgs(
          0,
          addr2.address,
          sell.sellData.collection,
          price,
          totalPayment.toString(),
          0
        );

      expect(await clone1.ownerOf(0)).to.equal(addr2.address);
      expect(sell.sellData.status).to.equal(1);
      expect(Number(newBuyerBalance)).to.equal(
        Number(Math.Big(oldBuyerBalance))
      );
      expect(Number(newTreasury721)).to.equal(Number(Math.Big(oldTreasury721)));
      expect(Number(newSystemBalance)).to.equal(
        Number(Math.Big(oldSystemBalance))
      );

      const vestingStat = await lrtVestingInstance.holdersStat(addr2.address);
      expect(Number(vestingStat.claimedAmount)).to.equal(
        Number(Math.Big(totalPayment))
      );

      await expect(tx)
        .to.emit(lrtVestingInstance, "DebtCreated")
        .withArgs(totalPayment.toString(), addr2.address);
    });

    it("should not allow to buy non minted erc721 token when has allowance error", async function () {
      const price = ethers.utils.parseUnits("1");
      const floorPrice = ethers.utils.parseUnits("1");
      const expireDate = 0;
      const itemId = 0;

      await nonMinted721MarketplaceInstance
        .connect(admin)
        .createSell(price, collection_one, expireDate);

      await lrtInstance
        .connect(distributor)
        .transferToken(addr2.address, ethers.utils.parseUnits("500"));

      await lrtInstance
        .connect(addr2)
        .approve(nonMinted721MarketplaceInstance.address, 0);

      await expect(
        nonMinted721MarketplaceInstance.connect(addr2).buyItem(0)
      ).to.be.revertedWith(MarketplaceErrorMsg.ALLOWANCE);
    });

    it("should not allow to buy non minted erc721 token when has not sufficient vesting balance", async function () {
      const price = ethers.utils.parseUnits("5");
      const floorPrice = ethers.utils.parseUnits("1");
      const expireDate = 0;
      const itemId = 0;

      await nonMinted721MarketplaceInstance
        .connect(admin)
        .createSell(price, collection_one, expireDate);

      await lrtInstance
        .connect(distributor)
        .transferToken(addr2.address, ethers.utils.parseUnits("1"));

      await lrtInstance
        .connect(addr2)
        .approve(nonMinted721MarketplaceInstance.address, price);

      await expect(
        nonMinted721MarketplaceInstance.connect(addr2).buyItem(0)
      ).to.be.revertedWith(NonMinted721ErrorMsg.INSUFFICIENT_VESTED_BALANCE);
    });
  });

  describe("test canceling a sell", function () {
    beforeEach(async function () {
      // Create an pool
      // const usecase = ethers.utils.keccak256(
      //   ethers.utils.toUtf8Bytes("MARKETPLACE_1155")
      // );
      // // ethers.utils.formatBytes32String("MARKETPLACE");
      // const startTokenId = 0;
      // const endTokenId = 100;

      // const txcreatePool = await nft721PoolInstance
      //   .connect(admin)
      //   .createPool(usecase, collection_one, startTokenId, endTokenId);

      // const txAddSupply = await nft721PoolInstance
      //   .connect(admin)
      //   .addSupply(0, usecase, collection_one);

      // const supply = await nft721PoolInstance
      //   .connect(admin)
      //   .usecaseSupplies(usecase, collection_one, 0);
      const tx = await nonMinted721MarketplaceInstance
        .connect(script)
        .setUserDiscount(addr2.address, 1000, discountExpireDate, 5, cap);
    });

    it("should not allow to cancel non minted erc721 token when The sell does not exist", async function () {
      await expect(
        nonMinted721MarketplaceInstance.connect(admin).cancelSell(0)
      ).to.be.revertedWith(NonMinted721ErrorMsg.INVALID_SELL);
    });

    it("should allow to cancel non minted erc721 token", async function () {
      const price = ethers.utils.parseUnits("1");
      const floorPrice = ethers.utils.parseUnits("1");
      const expireDate = 0;
      const itemId = 0;

      await nonMinted721MarketplaceInstance
        .connect(admin)
        .createSell(price, collection_one, expireDate);

      const tx = await nonMinted721MarketplaceInstance
        .connect(admin)
        .cancelSell(0);

      await expect(tx)
        .to.emit(nonMinted721MarketplaceInstance, "SellCanceled")
        .withArgs(0);

      const sell = await nonMinted721MarketplaceInstance.nonMinted721Sells(0);

      // Check that the sell has the correct details
      expect(sell.sellData.status).to.equal(2);
    });

    it("should not allow to cancel non minted erc721 token when the sell order is active", async function () {
      const price = ethers.utils.parseUnits("1");
      const floorPrice = ethers.utils.parseUnits("1");
      const expireDate = 0;
      const itemId = 0;

      await nonMinted721MarketplaceInstance
        .connect(admin)
        .createSell(price, collection_one, expireDate);

      await lrtInstance
        .connect(distributor)
        .transferToken(addr2.address, ethers.utils.parseUnits("500"));

      await lrtInstance
        .connect(addr2)
        .approve(nonMinted721MarketplaceInstance.address, price);

      await nonMinted721MarketplaceInstance.connect(addr2).buyItem(0);

      await expect(
        nonMinted721MarketplaceInstance.connect(admin).cancelSell(0)
      ).to.be.revertedWith(NonMinted721ErrorMsg.ACTIVE_ORDER);
    });

    it("should not allow to cancel non minted erc721 token when the caller is not admin", async function () {
      const price = ethers.utils.parseUnits("1");
      const floorPrice = ethers.utils.parseUnits("1");
      const expireDate = 0;
      const itemId = 0;
      await nonMinted721MarketplaceInstance
        .connect(admin)
        .createSell(price, collection_one, expireDate);

      await lrtInstance
        .connect(distributor)
        .transferToken(addr2.address, ethers.utils.parseUnits("500"));

      await lrtInstance
        .connect(addr2)
        .approve(nonMinted721MarketplaceInstance.address, price);

      await nonMinted721MarketplaceInstance.connect(addr2).buyItem(0);

      await expect(
        nonMinted721MarketplaceInstance.connect(addr1).cancelSell(0)
      ).to.be.revertedWith(AccessErrorMsg.CALLER_NOT_ADMIN);
    });
  });

  // //Upgradeability testing
  // describe("Contract Version 2 test", function () {
  //   let oldContract, upgradedContract, owner, addr1;
  //   beforeEach(async function () {
  //     [owner, addr1] = await ethers.getSigners(2);

  //     const NonMinted721MarketplaceUpgraded = await ethers.getContractFactory(
  //       "NonMinted721MarketplaceUpgraded"
  //     );

  //     upgradedContract = await upgrades.upgradeProxy(
  //       nonMinted721MarketplaceInstance,
  //       NonMinted721MarketplaceUpgraded,
  //       {
  //         call: {
  //           fn: "initializeNonMinted721Marketplace",
  //           args: [
  //             arInstance.address,
  //             lrtInstance.address,
  //             landRockerInstance.address,
  //             lrtVestingInstance.address,
  //             nft721PoolInstance.address,
  //             "hi I'm upgraded",
  //           ],
  //         },
  //       }
  //     );
  //   });

  //   it("New Contract Should return the old & new greeting and token name after deployment", async function () {
  //     expect(await upgradedContract.greeting()).to.equal("hi I'm upgraded");
  //   });
  // });
});
