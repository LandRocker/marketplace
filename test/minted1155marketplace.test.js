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
const {
  minted1155MarketplaceFixture,
} = require("./fixture/minted1155Marketplace.fixture");
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
    lrtVestingInstance,
    collection_one,
    collection_two;
  let baseURI =
    "https://srvs20.landrocker.io/game_service/bc/get/uniq/token/data?token_id=";
  let baseURI2 =
    "https://srvs20.landrocker.io/game_service/bc/get/token/data?token_id=";
    let category = ethers.utils.keccak256(
      ethers.utils.toUtf8Bytes("MARKETPLACE_1155")
    );

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
      collection_one,
      collection_two,
    } = await loadFixture(minted1155MarketplaceFixture));
  });

  describe("test withdraw", function () {
    beforeEach(async function () {
      const cloneContract = await ethers.getContractFactory(
        "LandRockerERC1155"
      );
      const clone1 = cloneContract.attach(collection_one);
      const tokenId = await clone1
        .connect(approvedContract)
        .callStatic.safeMint(owner.address, 10,category);

      await clone1.connect(approvedContract).safeMint(owner.address, 10,category);

      const price = ethers.utils.parseUnits("1");
      const expireDate =
        (await time.latest()) + (await Helper.convertToSeconds("weeks", 1));
      const quantity = 2;

      await clone1
        .connect(owner)
        .setApprovalForAll(minted1155MarketplaceInstance.address, true);

      await minted1155MarketplaceInstance
        .connect(owner)
        .createSell(price, collection_one, expireDate, tokenId, quantity);

      await lrtInstance
        .connect(distributor)
        .transferToken(addr2.address, ethers.utils.parseUnits("500"));

      await lrtInstance
        .connect(addr2)
        .approve(minted1155MarketplaceInstance.address, price);

      await minted1155MarketplaceInstance.connect(addr2).buyItem(0);
      await lrtInstance
        .connect(distributor)
        .transferToken(
          minted1155MarketplaceInstance.address,
          ethers.utils.parseUnits("500")
        );
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
        .to.emit(minted1155MarketplaceInstance, "Withdrawn")
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
      const cloneContract = await ethers.getContractFactory(
        "LandRockerERC1155"
      );
      const clone1 = cloneContract.attach(collection_one);
      const tokenId = await clone1
        .connect(approvedContract)
        .callStatic.safeMint(owner.address, 10,category);

      await clone1.connect(approvedContract).safeMint(owner.address, 10,category);

      const price = ethers.utils.parseUnits("1");
      const expireDate =
        (await time.latest()) + (await Helper.convertToSeconds("weeks", 1));
      const quantity = 2;
      await clone1
        .connect(owner)
        .setApprovalForAll(minted1155MarketplaceInstance.address, true);

      const tx = await minted1155MarketplaceInstance
        .connect(owner)
        .createSell(price, collection_one, expireDate, tokenId, quantity);

      await expect(tx)
        .to.emit(minted1155MarketplaceInstance, "SellCreated")
        .withArgs(
          0,
          owner.address,
          collection_one,
          price,
          expireDate,
          tokenId,
          quantity
        );

      const sell = await minted1155MarketplaceInstance.minted1155Sells(0);

      // Check that the sell has the correct details
      expect(sell.sellData.price).to.equal(price);
      expect(sell.sellData.status).to.equal(0);
      expect(sell.sellData.collection).to.equal(collection_one);
      expect(sell.sellData.expireDate).to.equal(expireDate);
      expect(sell.tokenId).to.equal(tokenId);
      expect(sell.quantity).to.equal(2);
    });
    it("should not allow to create sell if quantity is invalid", async function () {
      // Mint some 1155 NFT Tokens
      const cloneContract = await ethers.getContractFactory(
        "LandRockerERC1155"
      );
      const clone1 = cloneContract.attach(collection_one);
      const tokenId = await clone1
        .connect(approvedContract)
        .callStatic.safeMint(owner.address, 10,category);

      await clone1.connect(approvedContract).safeMint(owner.address, 10,category);

      const price = ethers.utils.parseUnits("1");
      const expireDate =
        (await time.latest()) + (await Helper.convertToSeconds("weeks", 1));
      const quantity = 0;
      await clone1
        .connect(owner)
        .setApprovalForAll(minted1155MarketplaceInstance.address, true);

      await expect(
        minted1155MarketplaceInstance
          .connect(owner)
          .createSell(price, collection_one, expireDate, tokenId, quantity)
      ).to.be.revertedWith(Minted1155ErrorMsg.INVALID_QUANTITY);
    });

    it("should not allow to create sell if price is less than floor price", async function () {
      // Mint some 1155 NFT Tokens
      const cloneContract = await ethers.getContractFactory(
        "LandRockerERC1155"
      );
      const clone1 = cloneContract.attach(collection_one);
      const tokenId = await clone1
        .connect(approvedContract)
        .callStatic.safeMint(owner.address, 10,category);

      await clone1.connect(approvedContract).safeMint(owner.address, 10,category);

      const floorPriceTx = await clone1
        .connect(approvedContract)
        .setFloorPrice(tokenId, ethers.utils.parseUnits("5"));

      const price = ethers.utils.parseUnits("1");
      const expireDate =
        (await time.latest()) + (await Helper.convertToSeconds("weeks", 1));
      const quantity = 5;
      await clone1
        .connect(owner)
        .setApprovalForAll(minted1155MarketplaceInstance.address, true);

      await expect(
        minted1155MarketplaceInstance
          .connect(owner)
          .createSell(price, collection_one, expireDate, tokenId, quantity)
      ).to.be.revertedWith(Minted1155ErrorMsg.INVALID_PRICE);
    });

    it("should not allow to create sell if seller has not enough balance", async function () {
      // Mint some 1155 NFT Tokens
      const cloneContract = await ethers.getContractFactory(
        "LandRockerERC1155"
      );
      const clone1 = cloneContract.attach(collection_one);
      const tokenId = await clone1
        .connect(approvedContract)
        .callStatic.safeMint(owner.address, 10,category);

      await clone1.connect(approvedContract).safeMint(owner.address, 10,category);

      const price = ethers.utils.parseUnits("1");
      const expireDate =
        (await time.latest()) + (await Helper.convertToSeconds("weeks", 1));
      const quantity = 100;
      await clone1
        .connect(owner)
        .setApprovalForAll(minted1155MarketplaceInstance.address, true);
      await expect(
        minted1155MarketplaceInstance
          .connect(owner)
          .createSell(price, collection_one, expireDate, tokenId, quantity)
      ).to.be.revertedWith(Minted1155ErrorMsg.INSUFFICIENT_BALANCE);
    });

    it("should not allow to create sell if seller doesn't give access to marketplace", async function () {
      const cloneContract = await ethers.getContractFactory(
        "LandRockerERC1155"
      );
      const clone1 = cloneContract.attach(collection_one);
      const tokenId = await clone1
        .connect(approvedContract)
        .callStatic.safeMint(owner.address, 10,category);

      await clone1.connect(approvedContract).safeMint(owner.address, 10,category);

      const price = ethers.utils.parseUnits("1");
      const expireDate =
        (await time.latest()) + (await Helper.convertToSeconds("weeks", 1));
      const quantity = 2;

      await expect(
        minted1155MarketplaceInstance
          .connect(owner)
          .createSell(price, collection_one, expireDate, tokenId, quantity)
      ).to.be.revertedWith(Minted1155ErrorMsg.HAS_NOT_ACCESS);
    });

    it("should not allow to create sell if expire date is invalid", async function () {
      const cloneContract = await ethers.getContractFactory(
        "LandRockerERC1155"
      );
      const clone1 = cloneContract.attach(collection_one);
      const tokenId = await clone1
        .connect(approvedContract)
        .callStatic.safeMint(owner.address, 10,category);

      await clone1.connect(approvedContract).safeMint(owner.address, 10,category);

      const price = ethers.utils.parseUnits("1");
      const expireDate = await time.latest();
      const quantity = 100;
      await clone1
        .connect(owner)
        .setApprovalForAll(minted1155MarketplaceInstance.address, true);
      await expect(
        minted1155MarketplaceInstance
          .connect(owner)
          .createSell(price, collection_one, expireDate, tokenId, quantity)
      ).to.be.revertedWith(MarketplaceErrorMsg.INVALID_EXPIRE_DATE);
    });
  });

  describe("test edit sell", function () {
    it("should not allow to edit sell when The sell does not exist", async function () {
      // Create an sell
      const cloneContract = await ethers.getContractFactory(
        "LandRockerERC1155"
      );
      const clone1 = cloneContract.attach(collection_one);
      const tokenId = await clone1
        .connect(approvedContract)
        .callStatic.safeMint(owner.address, 10,category);

      await clone1.connect(approvedContract).safeMint(owner.address, 10,category);

      const price = ethers.utils.parseUnits("1");
      const expireDate =
        (await time.latest()) + (await Helper.convertToSeconds("weeks", 1));
      const quantity = 2;

      await clone1
        .connect(owner)
        .setApprovalForAll(minted1155MarketplaceInstance.address, true);

      await expect(
        minted1155MarketplaceInstance
          .connect(owner)
          .editSell(0, price, collection_one, expireDate, tokenId, quantity)
      ).to.be.revertedWith(Minted1155ErrorMsg.INVALID_SELL);
    });

    it("should not allow to edit sell if price is less than floor price", async function () {
      // Mint some 1155 NFT Tokens
      const cloneContract = await ethers.getContractFactory(
        "LandRockerERC1155"
      );
      const clone1 = cloneContract.attach(collection_one);
      const tokenId = await clone1
        .connect(approvedContract)
        .callStatic.safeMint(owner.address, 10,category);

      await clone1.connect(approvedContract).safeMint(owner.address, 10,category);

      await clone1.connect(approvedContract).mint(owner.address,0, 10,category);

      const floorPriceTx = await clone1
        .connect(approvedContract)
        .setFloorPrice(tokenId, ethers.utils.parseUnits("1"));

      const price = ethers.utils.parseUnits("1");
      const expireDate =
        (await time.latest()) + (await Helper.convertToSeconds("weeks", 1));
      const quantity = 5;

      await clone1
        .connect(owner)
        .setApprovalForAll(minted1155MarketplaceInstance.address, true);

      await minted1155MarketplaceInstance
        .connect(owner)
        .createSell(price, collection_one, expireDate, tokenId, quantity);

      await landRockerERC1155Instance
        .connect(owner)
        .setApprovalForAll(minted1155MarketplaceInstance.address, true);

      const floorPriceChangingTx = await clone1
        .connect(approvedContract)
        .setFloorPrice(tokenId, ethers.utils.parseUnits("5"));

      await expect(
        minted1155MarketplaceInstance
          .connect(owner)
          .editSell(0, price, collection_one, expireDate, tokenId, quantity)
      ).to.be.revertedWith(Minted1155ErrorMsg.INVALID_PRICE);
    });

    it("should allow to edit sell", async function () {
      // Create an sell
      const cloneContract = await ethers.getContractFactory(
        "LandRockerERC1155"
      );
      const clone1 = cloneContract.attach(collection_one);
      const tokenId = await clone1
        .connect(approvedContract)
        .callStatic.safeMint(owner.address, 10,category);

      await clone1.connect(approvedContract).safeMint(owner.address, 10,category);

      const price = ethers.utils.parseUnits("1");
      const expireDate =
        (await time.latest()) + (await Helper.convertToSeconds("weeks", 1));
      const quantity = 2;
      await clone1
        .connect(owner)
        .setApprovalForAll(minted1155MarketplaceInstance.address, true);

      await minted1155MarketplaceInstance
        .connect(owner)
        .createSell(price, collection_one, expireDate, tokenId, quantity);

      await clone1
        .connect(owner)
        .setApprovalForAll(minted1155MarketplaceInstance.address, false);

      await minted1155MarketplaceInstance.connect(owner).cancelSell(0);

      await clone1
        .connect(owner)
        .setApprovalForAll(minted1155MarketplaceInstance.address, true);

      //new values
      const price2 = ethers.utils.parseUnits("2");
      const expireDate2 =
        (await time.latest()) + (await Helper.convertToSeconds("weeks", 2));
      const quantity2 = 3;

      const tx = await minted1155MarketplaceInstance
        .connect(owner)
        .editSell(0, price2, collection_one, expireDate2, tokenId, quantity2);

      await expect(tx)
        .to.emit(minted1155MarketplaceInstance, "SellUpdated")
        .withArgs(
          0,
          owner.address,
          collection_one,
          expireDate2,
          price2,
          tokenId,
          quantity2
        );

      const sell = await minted1155MarketplaceInstance.minted1155Sells(0);
      // Check that the sell has the correct details
      expect(sell.sellData.price).to.equal(price2);
      expect(sell.sellData.status).to.equal(0);
      expect(sell.sellData.collection).to.equal(collection_one);
      expect(sell.sellData.expireDate).to.equal(expireDate2);
      expect(sell.tokenId).to.equal(tokenId);
      expect(sell.quantity).to.equal(quantity2);
    });

    it("should not allow to edit sell if caller is not NFT owner", async function () {
      // Create an sell
      const cloneContract = await ethers.getContractFactory(
        "LandRockerERC1155"
      );
      const clone1 = cloneContract.attach(collection_one);
      const tokenId = await clone1
        .connect(approvedContract)
        .callStatic.safeMint(owner.address, 10,category);

      await clone1.connect(approvedContract).safeMint(owner.address, 10,category);

      await clone1.connect(approvedContract).mint(addr2.address, tokenId,10,category);

      const price = ethers.utils.parseUnits("1");
      const expireDate =
        (await time.latest()) + (await Helper.convertToSeconds("weeks", 1));
      const quantity = 2;

      await clone1
        .connect(owner)
        .setApprovalForAll(minted1155MarketplaceInstance.address, true);

      await minted1155MarketplaceInstance
        .connect(owner)
        .createSell(price, collection_one, expireDate, tokenId, quantity);

      await clone1
        .connect(owner)
        .setApprovalForAll(minted1155MarketplaceInstance.address, false);

      await minted1155MarketplaceInstance.connect(owner).cancelSell(0);

      await clone1
        .connect(owner)
        .setApprovalForAll(minted1155MarketplaceInstance.address, true);

      await clone1
        .connect(addr2)
        .setApprovalForAll(minted1155MarketplaceInstance.address, true);

      await expect(
        minted1155MarketplaceInstance
          .connect(addr2)
          .editSell(0, price, collection_one, expireDate, tokenId, quantity)
      ).to.be.revertedWith(Minted1155ErrorMsg.NOT_NFT_OWNER);
    });

    it("should not allow to edit sell if quantity Amount is too low", async function () {
      const cloneContract = await ethers.getContractFactory(
        "LandRockerERC1155"
      );
      const clone1 = cloneContract.attach(collection_one);
      const tokenId = await clone1
        .connect(approvedContract)
        .callStatic.safeMint(owner.address, 10,category);

      await clone1.connect(approvedContract).safeMint(owner.address, 10,category);

      await clone1.connect(approvedContract).mint(owner.address, tokenId,10,category);

      const price = ethers.utils.parseUnits("1");
      const expireDate =
        (await time.latest()) + (await Helper.convertToSeconds("weeks", 1));
      const quantity = 2;

      await clone1
        .connect(owner)
        .setApprovalForAll(minted1155MarketplaceInstance.address, true);

      await minted1155MarketplaceInstance
        .connect(owner)
        .createSell(price, collection_one, expireDate, tokenId, quantity);

      const price2 = ethers.utils.parseUnits("1");
      const expireDate2 =
        (await time.latest()) + (await Helper.convertToSeconds("weeks", 1));
      const quantity2 = 0;

      await clone1
        .connect(owner)
        .setApprovalForAll(minted1155MarketplaceInstance.address, true);

      await expect(
        minted1155MarketplaceInstance
          .connect(owner)
          .editSell(0, price2, collection_one, expireDate2, tokenId, quantity2)
      ).to.be.revertedWith(Minted1155ErrorMsg.INVALID_QUANTITY);
    });

    it("should not allow to edit sell if expire date is invalid", async function () {
      const cloneContract = await ethers.getContractFactory(
        "LandRockerERC1155"
      );
      const clone1 = cloneContract.attach(collection_one);
      const tokenId = await clone1
        .connect(approvedContract)
        .callStatic.safeMint(owner.address, 10,category);

      await clone1.connect(approvedContract).safeMint(owner.address, 10,category);

      const price = ethers.utils.parseUnits("1");
      const expireDate = await time.latest();
      const quantity = 2;
      await expect(
        minted1155MarketplaceInstance
          .connect(owner)
          .editSell(0, price, collection_one, expireDate, tokenId, quantity)
      ).to.be.revertedWith(MarketplaceErrorMsg.INVALID_EXPIRE_DATE);
    });

    it("should not allow to edit sell if sell has not valid status", async function () {
      const cloneContract = await ethers.getContractFactory(
        "LandRockerERC1155"
      );
      const clone1 = cloneContract.attach(collection_one);
      const tokenId = await clone1
        .connect(approvedContract)
        .callStatic.safeMint(owner.address, 10,category);

      await clone1.connect(approvedContract).safeMint(owner.address, 10,category);

      const price = ethers.utils.parseUnits("1");
      const expireDate =
        (await time.latest()) + (await Helper.convertToSeconds("weeks", 1));
      const quantity = 2;
      await clone1
        .connect(owner)
        .setApprovalForAll(minted1155MarketplaceInstance.address, true);

      await minted1155MarketplaceInstance
        .connect(owner)
        .createSell(price, collection_one, expireDate, tokenId, quantity);

      await expect(
        minted1155MarketplaceInstance
          .connect(owner)
          .editSell(0, price, collection_one, expireDate, tokenId, quantity)
      ).to.be.revertedWith(Minted1155ErrorMsg.CAN_NOT_EDIT);
    });
  });
  describe("test buy NFT", function () {
    it("should not allow to buy minted erc1155 token when The sell does not exist", async function () {
      const cloneContract = await ethers.getContractFactory(
        "LandRockerERC1155"
      );
      const clone1 = cloneContract.attach(collection_one);
      const tokenId = await clone1
        .connect(approvedContract)
        .callStatic.safeMint(owner.address, 10,category);

      await clone1.connect(approvedContract).safeMint(owner.address, 10,category);

      const price = ethers.utils.parseUnits("1");
      const expireDate = 0;
      const quantity = 2;

      await clone1
        .connect(owner)
        .setApprovalForAll(minted1155MarketplaceInstance.address, true);

      await lrtInstance
        .connect(distributor)
        .transferToken(addr2.address, ethers.utils.parseUnits("500"));

      await lrtInstance
        .connect(addr2)
        .approve(minted1155MarketplaceInstance.address, price);

      await expect(
        minted1155MarketplaceInstance.connect(addr2).buyItem(0)
      ).to.be.revertedWith(Minted1155ErrorMsg.INVALID_SELL);
    });

    it("should allow to buy minted erc1155 token", async function () {
      const cloneContract = await ethers.getContractFactory(
        "LandRockerERC1155"
      );
      const clone1 = cloneContract.attach(collection_one);
      const tokenId = await clone1
        .connect(approvedContract)
        .callStatic.safeMint(owner.address, 10,category);

      await clone1.connect(approvedContract).safeMint(owner.address, 10,category);

      const price = ethers.utils.parseUnits("3");
      const expireDate =
        (await time.latest()) + (await Helper.convertToSeconds("weeks", 1));
      const quantity = 2;
      const royaltyPercentage = 200;
      const systemFee = await landRockerInstance.systemFee();
      const treasury1155 = await landRockerInstance.treasury1155();

      await clone1
        .connect(owner)
        .setApprovalForAll(minted1155MarketplaceInstance.address, true);

      await minted1155MarketplaceInstance
        .connect(owner)
        .createSell(price, collection_one, expireDate, tokenId, quantity);

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

      const newBuyerBalance = await lrtInstance.balanceOf(addr2.address);
      const newSellerBalance = await lrtInstance.balanceOf(owner.address);
      const newSystemBalance = await lrtInstance.balanceOf(
        minted1155MarketplaceInstance.address
      );

      let systemPortion = Math.Big(systemFee).mul(price).div(10000);
      let totalPay = Math.Big(price).sub(systemPortion);
      let royaltyAmount = Math.Big(totalPay).mul(royaltyPercentage).div(10000);

      await expect(tx)
        .to.emit(minted1155MarketplaceInstance, "UserAssetBought1155")
        .withArgs(
          0,
          addr2.address,
          owner.address,
          collection_one,
          0,
          quantity,
          price
        );

      const sell = await minted1155MarketplaceInstance.minted1155Sells(0);
      expect(await clone1.balanceOf(addr2.address, 0)).to.equal(2);
      expect(sell.sellData.status).to.equal(1);
      expect(Number(newBuyerBalance)).to.equal(
        Number(Math.Big(oldBuyerBalance).sub(price))
      );
      expect(Number(newSellerBalance)).to.equal(
        Number(
          Math.Big(oldSellerBalance).add(Math.Big(totalPay).sub(royaltyAmount))
        )
      );
      expect(Number(newSystemBalance)).to.equal(
        Number(Math.Big(oldSystemBalance).add(systemPortion))
      );
    });

    it("should allow to buy minted erc1155 token with zero royalty amount", async function () {
      const cloneContract = await ethers.getContractFactory(
        "LandRockerERC1155"
      );
      const clone1 = cloneContract.attach(collection_one);
      const tokenId = await clone1
        .connect(approvedContract)
        .callStatic.safeMint(owner.address, 10,category);

      await clone1.connect(approvedContract).safeMint(owner.address, 10,category);

      const price = ethers.utils.parseUnits("3");
      const expireDate =
        (await time.latest()) + (await Helper.convertToSeconds("weeks", 1));
      const quantity = 2;
      const royaltyPercentage = 0;
      const systemFee = await landRockerInstance.systemFee();
      const treasury1155 = await landRockerInstance.treasury1155();

      await clone1
        .connect(owner)
        .setApprovalForAll(minted1155MarketplaceInstance.address, true);

      await minted1155MarketplaceInstance
        .connect(owner)
        .createSell(price, collection_one, expireDate, tokenId, quantity);

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

      await clone1.connect(admin).deleteDefaultRoyalty();

      const tx = await minted1155MarketplaceInstance.connect(addr2).buyItem(0);

      const newBuyerBalance = await lrtInstance.balanceOf(addr2.address);
      const newSellerBalance = await lrtInstance.balanceOf(owner.address);
      const newSystemBalance = await lrtInstance.balanceOf(
        minted1155MarketplaceInstance.address
      );

      let systemPortion = Math.Big(systemFee).mul(price).div(10000);
      let totalPay = Math.Big(price).sub(systemPortion);
      let royaltyAmount = Math.Big(totalPay).mul(royaltyPercentage).div(10000);

      const sell = await minted1155MarketplaceInstance.minted1155Sells(0);
      expect(await clone1.balanceOf(addr2.address, 0)).to.equal(2);
      expect(sell.sellData.status).to.equal(1);
      expect(Number(newBuyerBalance)).to.equal(
        Number(Math.Big(oldBuyerBalance).sub(price))
      );
      expect(Number(newSellerBalance)).to.equal(
        Number(Math.Big(oldSellerBalance).add(Math.Big(totalPay)))
      );
      expect(Number(newSystemBalance)).to.equal(
        Number(Math.Big(oldSystemBalance).add(systemPortion))
      );
      expect(Number(newSellerBalance)).to.equal(
        Number(Math.Big(oldSellerBalance).add(Math.Big(totalPay)))
      );
    });

    it("should not allow to buy minted erc1155 token when sale has expired", async function () {
      const cloneContract = await ethers.getContractFactory(
        "LandRockerERC1155"
      );
      const clone1 = cloneContract.attach(collection_one);
      const tokenId = await clone1
        .connect(approvedContract)
        .callStatic.safeMint(owner.address, 10,category);

      await clone1.connect(approvedContract).safeMint(owner.address, 10,category);

      const price = ethers.utils.parseUnits("1");
      const expireDate =
        (await time.latest()) + (await Helper.convertToSeconds("weeks", 1));
      const quantity = 2;

      await clone1
        .connect(owner)
        .setApprovalForAll(minted1155MarketplaceInstance.address, true);
      await minted1155MarketplaceInstance
        .connect(owner)
        .createSell(price, collection_one, expireDate, tokenId, quantity);

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
      const cloneContract = await ethers.getContractFactory(
        "LandRockerERC1155"
      );
      const clone1 = cloneContract.attach(collection_one);
      const tokenId = await clone1
        .connect(approvedContract)
        .callStatic.safeMint(owner.address, 10,category);

      await clone1.connect(approvedContract).safeMint(owner.address, 10,category);

      const price = ethers.utils.parseUnits("1");
      const expireDate = 0;
      const quantity = 2;

      await clone1
        .connect(owner)
        .setApprovalForAll(minted1155MarketplaceInstance.address, true);

      await minted1155MarketplaceInstance
        .connect(owner)
        .createSell(price, collection_one, expireDate, tokenId, quantity);

      await clone1
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
      const cloneContract = await ethers.getContractFactory(
        "LandRockerERC1155"
      );
      const clone1 = cloneContract.attach(collection_one);
      const tokenId = await clone1
        .connect(approvedContract)
        .callStatic.safeMint(owner.address, 10,category);

      await clone1.connect(approvedContract).safeMint(owner.address, 10,category);

      const price = ethers.utils.parseUnits("1");
      const expireDate = 0;
      const quantity = 2;

      await clone1
        .connect(owner)
        .setApprovalForAll(minted1155MarketplaceInstance.address, true);

      await minted1155MarketplaceInstance
        .connect(owner)
        .createSell(price, collection_one, expireDate, tokenId, quantity);

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
  });

  describe("test cancel sell", function () {
    beforeEach(async function () {
      const cloneContract = await ethers.getContractFactory(
        "LandRockerERC1155"
      );
      const clone1 = cloneContract.attach(collection_one);
      const tokenId = await clone1
        .connect(approvedContract)
        .callStatic.safeMint(owner.address, 10,category);

      await clone1.connect(approvedContract).safeMint(owner.address, 10,category);

      const price = ethers.utils.parseUnits("1");
      const expireDate =
        (await time.latest()) + (await Helper.convertToSeconds("weeks", 1));
      const quantity = 2;

      await clone1
        .connect(owner)
        .setApprovalForAll(minted1155MarketplaceInstance.address, true);

      await minted1155MarketplaceInstance
        .connect(owner)
        .createSell(price, collection_one, expireDate, tokenId, quantity);
    });

    it("should not allow a creator to cancel an erc1155 offer when The sell does not exist ", async function () {
      await expect(
        minted1155MarketplaceInstance.connect(addr1).cancelSell(1)
      ).to.be.revertedWith(Minted1155ErrorMsg.INVALID_SELL);
    });

    it("should allow to cancel sell", async function () {
      const cloneContract = await ethers.getContractFactory(
        "LandRockerERC1155"
      );
      const clone1 = cloneContract.attach(collection_one);
      const tokenId = await clone1
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
      expect(await clone1.balanceOf(owner.address, 0)).to.equal(10);
      expect(
        await clone1.isApprovedForAll(
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
        .approve(
          minted1155MarketplaceInstance.address,
          ethers.utils.parseUnits("1")
        );

      await minted1155MarketplaceInstance.connect(addr2).buyItem(0);

      await expect(
        minted1155MarketplaceInstance.connect(owner).cancelSell(0)
      ).to.be.revertedWith(Minted1155ErrorMsg.SOLD_SELL);
    });
  });

  describe("Contract Version 2 test", function () {
    let oldContract, upgradedContract, owner, addr1;
    beforeEach(async function () {
      [owner, addr1] = await ethers.getSigners(2);

      const Minted1155MarketplaceUpgraded = await ethers.getContractFactory(
        "Minted1155MarketplaceUpgraded"
      );

      upgradedContract = await upgrades.upgradeProxy(
        minted1155MarketplaceInstance,
        Minted1155MarketplaceUpgraded,
        {
          call: {
            fn: "initializeMinted1155MarketplaceUpgraded",
            args: [
              arInstance.address,
              lrtInstance.address,
              landRockerInstance.address,
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
