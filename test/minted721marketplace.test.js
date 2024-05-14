const { expect, util } = require("chai");
const {
  time,
  loadFixture,
} = require("@nomicfoundation/hardhat-network-helpers");

const {
  MarketplaceErrorMsg,
  AccessErrorMsg,
  Minted721ErrorMsg,
} = require("./messages");
const { ethers, network } = require("hardhat");

const Math = require("./helper/math");
const {
  minted721MarketplaceFixture,
} = require("./fixture/minted721Marketplace.fixture");
const Helper = require("./helper");

const zeroAddress = "0x0000000000000000000000000000000000000000";

describe("Minted721 Marketplace contract", function () {
  let minted721MarketplaceInstance,
    landRockerERC721FactoryInstance,
    landRockerInstance,
    landRockerERC721Instance,
    lrtInstance,
    arInstance,
    owner,
    admin,
    minter,
    distributor,
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
      ethers.utils.toUtf8Bytes("MARKETPLACE_721")
    );

  beforeEach(async function () {
    ({
      minted721MarketplaceInstance,
      landRockerERC721FactoryInstance,
      landRockerInstance,
      landRockerERC721Instance,
      lrtInstance,
      arInstance,
      owner,
      admin,
      minter,
      distributor,
      approvedContract,
      script,
      addr1,
      addr2,
      treasury,
      royaltyRecipient,
      factory,
      lrtVestingInstance,
      collection_one,
      collection_two,
    } = await loadFixture(minted721MarketplaceFixture));
  });

  describe("test withdraw", function () {
    beforeEach(async function () {
      const cloneContract = await ethers.getContractFactory("LandRockerERC721");
      const clone1 = cloneContract.attach(collection_one);

      const tokenId = await clone1
        .connect(approvedContract)
        .callStatic.safeMint(owner.address,category);

      await clone1.connect(approvedContract).safeMint(owner.address,category);

      const price = ethers.utils.parseUnits("1");
      const expireDate =
        (await time.latest()) + (await Helper.convertToSeconds("weeks", 1));

      await clone1
        .connect(owner)
        .approve(minted721MarketplaceInstance.address, tokenId);

      expect(await clone1.connect(owner).getApproved(tokenId)).to.equal(
        minted721MarketplaceInstance.address
      );

      await minted721MarketplaceInstance
        .connect(owner)
        .createSell(price, collection_one, expireDate, tokenId);

      await lrtInstance
        .connect(distributor)
        .transferToken(addr2.address, ethers.utils.parseUnits("500"));

      await lrtInstance
        .connect(addr2)
        .approve(minted721MarketplaceInstance.address, price);

      await lrtInstance
        .connect(distributor)
        .transferToken(
          minted721MarketplaceInstance.address,
          ethers.utils.parseUnits("500")
        );
    });

    it("should allow to withdraw contract balance", async function () {
      const amount = ethers.utils.parseUnits("0.002", 18);
      const treasuryAddress = await landRockerInstance.treasury();
      const oldTreasury = await lrtInstance.balanceOf(treasuryAddress);
      const oldSystemBalance = await lrtInstance.balanceOf(
        minted721MarketplaceInstance.address
      );

      const cloneContract = await ethers.getContractFactory("LandRockerERC721");
      const clone1 = cloneContract.attach(collection_one);

      const price = ethers.utils.parseUnits("1");
      const expireDate =
        (await time.latest()) + (await Helper.convertToSeconds("weeks", 1));

      const tx = await minted721MarketplaceInstance
        .connect(admin)
        .withdraw(amount);

      await expect(tx)
        .to.emit(minted721MarketplaceInstance, "Withdrawn")
        .withArgs(amount, treasuryAddress);
      const newTreasury = await lrtInstance.balanceOf(treasuryAddress);
      const newSystemBalance = await lrtInstance.balanceOf(
        minted721MarketplaceInstance.address
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
        minted721MarketplaceInstance.connect(addr1).withdraw(amount)
      ).to.be.revertedWith(AccessErrorMsg.CALLER_NOT_ADMIN);
    });

    it("should not allow to withdraw sell if amount is too low", async function () {
      const amount = ethers.utils.parseUnits("0", 18);

      await expect(
        minted721MarketplaceInstance.connect(admin).withdraw(amount)
      ).to.be.revertedWith(MarketplaceErrorMsg.TOO_LOW_AMOUNT);
    });

    it("should not allow to withdraw sell if balance insufficient", async function () {
      const amount = ethers.utils.parseUnits("1000", 18);

      await expect(
        minted721MarketplaceInstance.connect(admin).withdraw(amount)
      ).to.be.revertedWith(MarketplaceErrorMsg.NO_BALANCE_WITHDRAW);
    });
  });

  describe("test create Sell", function () {
    it("should allow to create sell", async function () {
      // Create an sell
      // Mint some 721 NFT Tokens
      const cloneContract = await ethers.getContractFactory("LandRockerERC721");
      const clone1 = cloneContract.attach(collection_one);

      const tokenId = await clone1
        .connect(approvedContract)
        .callStatic.safeMint(owner.address,category);

      await clone1.connect(approvedContract).safeMint(owner.address,category);

      const price = ethers.utils.parseUnits("1");
      const expireDate =
        (await time.latest()) + (await Helper.convertToSeconds("weeks", 1));

      await clone1
        .connect(owner)
        .approve(minted721MarketplaceInstance.address, tokenId);

      const tx = await minted721MarketplaceInstance
        .connect(owner)
        .createSell(price, collection_one, expireDate, tokenId);

      await expect(tx)
        .to.emit(minted721MarketplaceInstance, "SellCreated")
        .withArgs(0, owner.address, collection_one, expireDate, price, tokenId);

      const sell = await minted721MarketplaceInstance.minted721Sells(0);

      // Check that the sell has the correct details
      expect(sell.sellData.price).to.equal(price);
      expect(sell.sellData.status).to.equal(0);
      expect(sell.sellData.collection).to.equal(collection_one);
      expect(sell.sellData.expireDate).to.equal(expireDate);
      expect(sell.tokenId).to.equal(tokenId);
    });

    it("should not allow to create sell if seller is not the owner of token", async function () {
      // Mint some 721 NFT Tokens
      const cloneContract = await ethers.getContractFactory("LandRockerERC721");
      const clone1 = cloneContract.attach(collection_one);

      const tokenId = await clone1
        .connect(approvedContract)
        .callStatic.safeMint(owner.address,category);

      await clone1.connect(approvedContract).safeMint(owner.address,category);

      const price = ethers.utils.parseUnits("1");
      const expireDate =
        (await time.latest()) + (await Helper.convertToSeconds("weeks", 1));

      await clone1
        .connect(owner)
        .approve(minted721MarketplaceInstance.address, tokenId);

      await expect(
        minted721MarketplaceInstance
          .connect(addr2)
          .createSell(price, collection_one, expireDate, tokenId)
      ).to.be.revertedWith(Minted721ErrorMsg.NOT_NFT_OWNER);
    });

    it("should not allow to create sell if seller doesn't give access to marketplace", async function () {
      const cloneContract = await ethers.getContractFactory("LandRockerERC721");
      const clone1 = cloneContract.attach(collection_one);

      const tokenId = await clone1
        .connect(approvedContract)
        .callStatic.safeMint(owner.address,category);

      await clone1.connect(approvedContract).safeMint(owner.address,category);

      const price = ethers.utils.parseUnits("1");
      const expireDate =
        (await time.latest()) + (await Helper.convertToSeconds("weeks", 1));

      await expect(
        minted721MarketplaceInstance
          .connect(owner)
          .createSell(price, collection_one, expireDate, tokenId)
      ).to.be.revertedWith(Minted721ErrorMsg.HAS_NOT_ACCESS);
    });

    it("should not allow to create sell if price be lower than floor price", async function () {
      const cloneContract = await ethers.getContractFactory("LandRockerERC721");
      const clone1 = cloneContract.attach(collection_one);

      const tokenId = await clone1
        .connect(approvedContract)
        .callStatic.safeMint(owner.address,category);

      await clone1.connect(approvedContract).safeMint(owner.address,category);
      await clone1
        .connect(approvedContract)
        .setFloorPrice(tokenId, ethers.utils.parseUnits("500", 18));

      await clone1
        .connect(owner)
        .approve(minted721MarketplaceInstance.address, tokenId);

      const price = ethers.utils.parseUnits("1");
      const expireDate =
        (await time.latest()) + (await Helper.convertToSeconds("weeks", 1));

      await expect(
        minted721MarketplaceInstance
          .connect(owner)
          .createSell(price, collection_one, expireDate, tokenId)
      ).to.be.revertedWith(Minted721ErrorMsg.INVALID_PRICE);
    });

    it("should not allow to create sell if expire date is invalid", async function () {
      const cloneContract = await ethers.getContractFactory("LandRockerERC721");
      const clone1 = cloneContract.attach(collection_one);

      const tokenId = await clone1
        .connect(approvedContract)
        .callStatic.safeMint(owner.address,category);

      await clone1.connect(approvedContract).safeMint(owner.address,category);

      const price = ethers.utils.parseUnits("1");
      const expireDate = await time.latest();
      await clone1
        .connect(owner)
        .approve(minted721MarketplaceInstance.address, tokenId);

      await expect(
        minted721MarketplaceInstance
          .connect(owner)
          .createSell(price, collection_one, expireDate, tokenId)
      ).to.be.revertedWith(MarketplaceErrorMsg.INVALID_EXPIRE_DATE);
    });

    it("should not allow to create sell if collection is false", async function () {
      const cloneContract = await ethers.getContractFactory("LandRockerERC721");
      const clone1 = cloneContract.attach(collection_one);

      const tokenId = await clone1
        .connect(approvedContract)
        .callStatic.safeMint(owner.address,category);

      await clone1.connect(approvedContract).safeMint(owner.address,category);

      const price = ethers.utils.parseUnits("1");
      const expireDate =
        (await time.latest()) + (await Helper.convertToSeconds("weeks", 1));

      await clone1
        .connect(owner)
        .approve(minted721MarketplaceInstance.address, tokenId);

      let falseCollection = await minted721MarketplaceInstance
        .connect(admin)
        .setLandRockerCollection(collection_one, false);

      await expect(
        minted721MarketplaceInstance
          .connect(admin)
          .createSell(price, collection_one, expireDate, tokenId)
      ).to.be.revertedWith(Minted721ErrorMsg.INVALID_TOKEN);
    });
  });

  describe("test edit sell", function () {
    it("should not allow to edit sell when the sell is not exist", async function () {
      // Create an sell
      const cloneContract = await ethers.getContractFactory("LandRockerERC721");
      const clone1 = cloneContract.attach(collection_one);

      const tokenId = await clone1
        .connect(approvedContract)
        .callStatic.safeMint(owner.address,category);

      await clone1.connect(approvedContract).safeMint(owner.address,category);

      const price = ethers.utils.parseUnits("1");
      const expireDate =
        (await time.latest()) + (await Helper.convertToSeconds("weeks", 1));

      await expect(
        minted721MarketplaceInstance
          .connect(addr2)
          .editSell(0, price, collection_one, expireDate, tokenId)
      ).to.be.revertedWith(Minted721ErrorMsg.INVALID_SELL);
    });

    it("should allow to edit sell", async function () {
      // Create an sell
      const cloneContract = await ethers.getContractFactory("LandRockerERC721");
      const clone1 = cloneContract.attach(collection_one);
      const tokenId = await clone1
        .connect(approvedContract)
        .callStatic.safeMint(owner.address,category);

      await clone1.connect(approvedContract).safeMint(owner.address,category);

      const price = ethers.utils.parseUnits("1");
      const expireDate =
        (await time.latest()) + (await Helper.convertToSeconds("weeks", 1));

      await clone1
        .connect(owner)
        .approve(minted721MarketplaceInstance.address, tokenId);

      await minted721MarketplaceInstance
        .connect(owner)
        .createSell(price, collection_one, expireDate, tokenId);

      await clone1.connect(owner).approve(zeroAddress, 0); //tokenId = 0

      await minted721MarketplaceInstance.connect(owner).cancelSell(0);

      await clone1
        .connect(owner)
        .approve(minted721MarketplaceInstance.address, tokenId);
      //new values
      const price2 = ethers.utils.parseUnits("2");
      const expireDate2 =
        (await time.latest()) + (await Helper.convertToSeconds("weeks", 2));

      const tx = await minted721MarketplaceInstance
        .connect(owner)
        .editSell(0, price2, collection_one, expireDate2, tokenId);

      await expect(tx)
        .to.emit(minted721MarketplaceInstance, "SellUpdated")
        .withArgs(
          0,
          owner.address,
          collection_one,
          expireDate2,
          price2,
          tokenId
        );

      const sell = await minted721MarketplaceInstance.minted721Sells(0);

      // Check that the sell has the correct details
      expect(sell.sellData.price).to.equal(price2);
      expect(sell.sellData.status).to.equal(0);
      expect(sell.sellData.collection).to.equal(collection_one);
      expect(sell.sellData.expireDate).to.equal(expireDate2);
      expect(sell.tokenId).to.equal(tokenId);
    });

    it("should not allow to edit sell if caller is not NFT owner", async function () {
      // Create an sell
      const cloneContract = await ethers.getContractFactory("LandRockerERC721");
      const clone1 = cloneContract.attach(collection_one);

      const tokenId = await clone1
        .connect(approvedContract)
        .callStatic.safeMint(owner.address,category);

      await clone1.connect(approvedContract).safeMint(owner.address,category);

      const price = ethers.utils.parseUnits("1");
      const expireDate =
        (await time.latest()) + (await Helper.convertToSeconds("weeks", 1));

      await clone1
        .connect(owner)
        .approve(minted721MarketplaceInstance.address, tokenId);

      await minted721MarketplaceInstance
        .connect(owner)
        .createSell(price, collection_one, expireDate, tokenId);

      await clone1.connect(owner).approve(zeroAddress, 0); //tokenId = 0

      await minted721MarketplaceInstance.connect(owner).cancelSell(0);

      await clone1
        .connect(owner)
        .approve(minted721MarketplaceInstance.address, tokenId);

      await expect(
        minted721MarketplaceInstance
          .connect(addr2)
          .editSell(0, price, collection_one, expireDate, tokenId)
      ).to.be.revertedWith(Minted721ErrorMsg.NOT_NFT_OWNER);
    });

    it("should not allow to edit sell if price is less than floor price", async function () {
      // Create an sell
      const cloneContract = await ethers.getContractFactory("LandRockerERC721");
      const clone1 = cloneContract.attach(collection_one);

      const tokenId = await clone1
        .connect(approvedContract)
        .callStatic.safeMint(owner.address,category);

      await clone1.connect(approvedContract).safeMint(owner.address,category);

      const price = ethers.utils.parseUnits("1");
      const expireDate =
        (await time.latest()) + (await Helper.convertToSeconds("weeks", 1));

      await clone1
        .connect(owner)
        .approve(minted721MarketplaceInstance.address, tokenId);

      await minted721MarketplaceInstance
        .connect(owner)
        .createSell(price, collection_one, expireDate, tokenId);

      await clone1.connect(owner).approve(zeroAddress, 0); //tokenId = 0

      await minted721MarketplaceInstance.connect(owner).cancelSell(0);

      await clone1
        .connect(owner)
        .approve(minted721MarketplaceInstance.address, tokenId);

      await clone1
        .connect(approvedContract)
        .setFloorPrice(tokenId, ethers.utils.parseUnits("500", 18));

      await expect(
        minted721MarketplaceInstance
          .connect(owner)
          .editSell(0, price, collection_one, expireDate, tokenId)
      ).to.be.revertedWith(Minted721ErrorMsg.INVALID_PRICE);
    });

    it("should not allow to edit sell if collection is false", async function () {
      const price = ethers.utils.parseUnits("1");
      const expireDate =
        (await time.latest()) + (await Helper.convertToSeconds("weeks", 1));

      let falseCollection = await minted721MarketplaceInstance
        .connect(admin)
        .setLandRockerCollection(collection_one, false);

      await expect(
        minted721MarketplaceInstance
          .connect(admin)
          .editSell(0, price, collection_one, expireDate, 0)
      ).to.be.revertedWith(Minted721ErrorMsg.INVALID_TOKEN);
    });

    it("should not allow to edit sell if expire date is invalid", async function () {
      const cloneContract = await ethers.getContractFactory("LandRockerERC721");
      const clone1 = cloneContract.attach(collection_one);

      const tokenId = await clone1
        .connect(approvedContract)
        .callStatic.safeMint(owner.address,category);

      await clone1.connect(approvedContract).safeMint(owner.address,category);

      const price = ethers.utils.parseUnits("1");
      const expireDate = await time.latest();

      await expect(
        minted721MarketplaceInstance
          .connect(owner)
          .editSell(0, price, collection_one, expireDate, tokenId)
      ).to.be.revertedWith(MarketplaceErrorMsg.INVALID_EXPIRE_DATE);
    });

    it("should not allow to edit sell if sell has not valid status", async function () {
      const cloneContract = await ethers.getContractFactory("LandRockerERC721");
      const clone1 = cloneContract.attach(collection_one);

      const tokenId = await clone1
        .connect(approvedContract)
        .callStatic.safeMint(owner.address,category);

      await clone1.connect(approvedContract).safeMint(owner.address,category);

      const price = ethers.utils.parseUnits("1");
      const expireDate =
        (await time.latest()) + (await Helper.convertToSeconds("weeks", 1));

      await clone1
        .connect(owner)
        .approve(minted721MarketplaceInstance.address, tokenId);

      await minted721MarketplaceInstance
        .connect(owner)
        .createSell(price, collection_one, expireDate, tokenId);

      await expect(
        minted721MarketplaceInstance
          .connect(owner)
          .editSell(0, price, collection_one, expireDate, tokenId)
      ).to.be.revertedWith(Minted721ErrorMsg.CAN_NOT_EDIT);
    });
  });

  describe("test buy NFT", function () {
    it("should not allow to buy minted erc721 token when the sell is not exist", async function () {
      const cloneContract = await ethers.getContractFactory("LandRockerERC721");
      const clone1 = cloneContract.attach(collection_one);

      const tokenId = await clone1
        .connect(approvedContract)
        .callStatic.safeMint(owner.address,category);

      await clone1.connect(approvedContract).safeMint(owner.address,category);

      const price = ethers.utils.parseUnits("1");
      const expireDate = 0;

      await expect(
        minted721MarketplaceInstance.connect(addr2).buyItem(0)
      ).to.be.revertedWith(Minted721ErrorMsg.INVALID_SELL);
    });

    it("should allow to buy minted erc721 token", async function () {
      const cloneContract = await ethers.getContractFactory("LandRockerERC721");
      const clone1 = cloneContract.attach(collection_one);

      const tokenId = await clone1
        .connect(approvedContract)
        .callStatic.safeMint(owner.address,category);

      await clone1.connect(approvedContract).safeMint(owner.address,category);

      const price = ethers.utils.parseUnits("3");
      const expireDate =
        (await time.latest()) + (await Helper.convertToSeconds("weeks", 1));

      const royaltyPercentage = 200;
      const systemFee = await landRockerInstance.systemFee();
      const treasury721 = await landRockerInstance.treasury721();

      await clone1
        .connect(owner)
        .approve(minted721MarketplaceInstance.address, tokenId);
      await minted721MarketplaceInstance
        .connect(owner)
        .createSell(price, collection_one, expireDate, tokenId);

      await lrtInstance
        .connect(distributor)
        .transferToken(addr2.address, ethers.utils.parseUnits("500"));

      await lrtInstance
        .connect(addr2)
        .approve(minted721MarketplaceInstance.address, price);

      //before buy
      const oldBuyerBalance = await lrtInstance.balanceOf(addr2.address);
      const oldSellerBalance = await lrtInstance.balanceOf(owner.address);
      const oldSystemBalance = await lrtInstance.balanceOf(
        minted721MarketplaceInstance.address
      );

      const tx = await minted721MarketplaceInstance.connect(addr2).buyItem(0);

      const newBuyerBalance = await lrtInstance.balanceOf(addr2.address);
      const newSellerBalance = await lrtInstance.balanceOf(owner.address);
      const newSystemBalance = await lrtInstance.balanceOf(
        minted721MarketplaceInstance.address
      );

      let systemPortion = Math.Big(systemFee).mul(price).div(10000);
      let totalPay = Math.Big(price).sub(systemPortion);
      let royaltyAmount = Math.Big(totalPay).mul(royaltyPercentage).div(10000);

      await expect(tx)
        .to.emit(minted721MarketplaceInstance, "UserAssetBought721")
        .withArgs(
          0,
          addr2.address,
          owner.address,
          collection_one,
          0,
          price
        );

      const sell = await minted721MarketplaceInstance.minted721Sells(0);
      expect(await clone1.ownerOf(0), addr2.address);

      expect(sell.sellData.status).to.equal(1);
      expect(Number(newBuyerBalance)).to.equal(
        Number(Math.Big(oldBuyerBalance).sub(price))
      );

      expect(Number(newSellerBalance)).to.equal(
        Number(
          Math.Big(oldSellerBalance).add(Math.Big(totalPay).sub(royaltyAmount))
        )
      );
    });

    it("should allow to buy minted erc721 token with zero royalty amount", async function () {
      const cloneContract = await ethers.getContractFactory("LandRockerERC721");
      const clone1 = cloneContract.attach(collection_one);

      const tokenId = await clone1
        .connect(approvedContract)
        .callStatic.safeMint(owner.address,category);

      await clone1.connect(approvedContract).safeMint(owner.address,category);

      const price = ethers.utils.parseUnits("3");
      const expireDate =
        (await time.latest()) + (await Helper.convertToSeconds("weeks", 1));

      const royaltyPercentage = 200;
      const systemFee = await landRockerInstance.systemFee();
      const treasury721 = await landRockerInstance.treasury721();

      await clone1
        .connect(owner)
        .approve(minted721MarketplaceInstance.address, tokenId);
      await minted721MarketplaceInstance
        .connect(owner)
        .createSell(price, collection_one, expireDate, tokenId);

      await lrtInstance
        .connect(distributor)
        .transferToken(addr2.address, ethers.utils.parseUnits("500"));

      await lrtInstance
        .connect(addr2)
        .approve(minted721MarketplaceInstance.address, price);

      //before buy
      const oldBuyerBalance = await lrtInstance.balanceOf(addr2.address);
      //console.log(ethers.utils.formatUnits(await lrtInstance.balanceOf(addr2.address)),"adrrrrrrrr1");
      const oldSellerBalance = await lrtInstance.balanceOf(owner.address);
      //console.log(ethers.utils.formatUnits(await lrtInstance.balanceOf(owner.address)),"ownerrrrrrrr1");
      const oldSystemBalance = await lrtInstance.balanceOf(
        minted721MarketplaceInstance.address
      );

      await clone1.connect(admin).deleteDefaultRoyalty();

      const tx = await minted721MarketplaceInstance.connect(addr2).buyItem(0);

      const newBuyerBalance = await lrtInstance.balanceOf(addr2.address);
      const newSellerBalance = await lrtInstance.balanceOf(owner.address);
      const newSystemBalance = await lrtInstance.balanceOf(
        minted721MarketplaceInstance.address
      );

      let systemPortion = Math.Big(systemFee).mul(price).div(10000);
      let totalPay = Math.Big(price).sub(systemPortion);
      let royaltyAmount = Math.Big(totalPay).mul(royaltyPercentage).div(10000);

      await expect(tx)
        .to.emit(minted721MarketplaceInstance, "UserAssetBought721")
        .withArgs(
          0,
          addr2.address,
          owner.address,
          collection_one,
          0,
          price
        );

      const sell = await minted721MarketplaceInstance.minted721Sells(0);
      expect(await clone1.ownerOf(0), addr2.address);

      expect(sell.sellData.status).to.equal(1);
      expect(Number(newBuyerBalance)).to.equal(
        Number(Math.Big(oldBuyerBalance).sub(price))
      );

      expect(Number(newSellerBalance)).to.equal(
        Number(Math.Big(oldSellerBalance).add(Math.Big(totalPay)))
      );
    });

    it("should not allow to buy minted erc721 token when sale has expired", async function () {
      const cloneContract = await ethers.getContractFactory("LandRockerERC721");
      const clone1 = cloneContract.attach(collection_one);

      const tokenId = await clone1
        .connect(approvedContract)
        .callStatic.safeMint(owner.address,category);

      await clone1.connect(approvedContract).safeMint(owner.address,category);
      const price = ethers.utils.parseUnits("1");
      const expireDate =
        (await time.latest()) + (await Helper.convertToSeconds("weeks", 1));

      await clone1
        .connect(owner)
        .approve(minted721MarketplaceInstance.address, tokenId);
      await minted721MarketplaceInstance
        .connect(owner)
        .createSell(price, collection_one, expireDate, tokenId);

      await lrtInstance
        .connect(distributor)
        .transferToken(addr2.address, ethers.utils.parseUnits("500"));

      const elapsedTime = await Helper.convertToSeconds("weeks", 2);

      await network.provider.send("evm_increaseTime", [elapsedTime]);
      await network.provider.send("evm_mine");

      await lrtInstance
        .connect(addr2)
        .approve(minted721MarketplaceInstance.address, price);

      await expect(
        minted721MarketplaceInstance.connect(addr2).buyItem(0)
      ).to.be.revertedWith(MarketplaceErrorMsg.SALE_HAS_EXPIRED);
    });

    it("should not allow to buy minted erc721 token when status of listed NFTs is not be valid", async function () {
      const cloneContract = await ethers.getContractFactory("LandRockerERC721");
      const clone1 = cloneContract.attach(collection_one);

      const tokenId = await clone1
        .connect(approvedContract)
        .callStatic.safeMint(owner.address,category);

      await clone1.connect(approvedContract).safeMint(owner.address,category);

      const price = ethers.utils.parseUnits("1");
      const expireDate = 0;

      await clone1
        .connect(owner)
        .approve(minted721MarketplaceInstance.address, tokenId);

      await minted721MarketplaceInstance
        .connect(owner)
        .createSell(price, collection_one, expireDate, tokenId);

      await clone1.connect(owner).approve(zeroAddress, tokenId);

      await minted721MarketplaceInstance.connect(owner).cancelSell(0);

      await lrtInstance
        .connect(distributor)
        .transferToken(addr2.address, ethers.utils.parseUnits("500"));

      await lrtInstance
        .connect(addr2)
        .approve(minted721MarketplaceInstance.address, price);

      await expect(
        minted721MarketplaceInstance.connect(addr2).buyItem(0)
      ).to.be.revertedWith(Minted721ErrorMsg.INVALID_STATUS_TO_SELL);
    });

    it("should not allow to buy non minted erc721 token when has allowance error", async function () {
      const cloneContract = await ethers.getContractFactory("LandRockerERC721");
      const clone1 = cloneContract.attach(collection_one);

      const tokenId = await clone1
        .connect(approvedContract)
        .callStatic.safeMint(owner.address,category);

      await clone1.connect(approvedContract).safeMint(owner.address,category);

      const price = ethers.utils.parseUnits("1");
      const expireDate = 0;

      await clone1
        .connect(owner)
        .approve(minted721MarketplaceInstance.address, tokenId);

      await minted721MarketplaceInstance
        .connect(owner)
        .createSell(price, collection_one, expireDate, tokenId);

      await lrtInstance
        .connect(distributor)
        .transferToken(addr2.address, ethers.utils.parseUnits("500"));

      await lrtInstance
        .connect(addr2)
        .approve(minted721MarketplaceInstance.address, 0);

      await expect(
        minted721MarketplaceInstance.connect(addr2).buyItem(0)
      ).to.be.revertedWith(MarketplaceErrorMsg.ALLOWANCE);
    });
  });

  describe("test cancel sell", function () {
    beforeEach(async function () {
      const cloneContract = await ethers.getContractFactory("LandRockerERC721");
      const clone1 = cloneContract.attach(collection_one);
      const tokenId = await clone1
        .connect(approvedContract)
        .callStatic.safeMint(owner.address,category);
      await clone1.connect(approvedContract).safeMint(owner.address,category);
      const price = ethers.utils.parseUnits("1");
      const expireDate =
        (await time.latest()) + (await Helper.convertToSeconds("weeks", 1));
      await clone1
        .connect(owner)
        .approve(minted721MarketplaceInstance.address, tokenId);
      await minted721MarketplaceInstance
        .connect(owner)
        .createSell(price, collection_one, expireDate, tokenId);
    });

    it("should not allow a creator to cancel an erc721 offer when the sell does not exist", async function () {
      await expect(
        minted721MarketplaceInstance.connect(addr1).cancelSell(1)
      ).to.be.revertedWith(Minted721ErrorMsg.INVALID_SELL);
    });

    it("should allow to cancel sell", async function () {
      const cloneContract = await ethers.getContractFactory("LandRockerERC721");
      const clone1 = cloneContract.attach(collection_one);
      await clone1.connect(owner).approve(zeroAddress, 0); //tokenId = 0

      const tx = await minted721MarketplaceInstance
        .connect(owner)
        .cancelSell(0);

      await expect(tx)
        .to.emit(minted721MarketplaceInstance, "SellCanceled")
        .withArgs(0);

      const sell = await minted721MarketplaceInstance.minted721Sells(0);

      // Check that the sell has the correct details
      expect(sell.sellData.status).to.equal(2);
      expect(await clone1.ownerOf(0)).to.equal(owner.address);
      expect(await clone1.connect(owner).getApproved(0)).to.equal(
        //tokenId = 0
        zeroAddress
      );
    });

    it("should not allow a creator to cancel when a sell has not revoked", async function () {
      await expect(
        minted721MarketplaceInstance.connect(owner).cancelSell(0)
      ).to.be.revertedWith(Minted721ErrorMsg.NOT_REVOKED);
    });

    it("should not allow a creator to cancel an erc721 offer when your not owner ", async function () {
      await expect(
        minted721MarketplaceInstance.connect(addr1).cancelSell(0)
      ).to.be.revertedWith(Minted721ErrorMsg.NOT_NFT_OWNER);
    });

    it("should not allow a creator to cancel an erc721 sell when has sold before ", async function () {
      await lrtInstance
        .connect(distributor)
        .transferToken(addr2.address, ethers.utils.parseUnits("500"));

      await lrtInstance
        .connect(addr2)
        .approve(
          minted721MarketplaceInstance.address,
          ethers.utils.parseUnits("1")
        );

      await minted721MarketplaceInstance.connect(addr2).buyItem(0);

      await expect(
        minted721MarketplaceInstance.connect(owner).cancelSell(0)
      ).to.be.revertedWith(Minted721ErrorMsg.SOLD_SELL);
    });
  });

  describe("Contract Version 2 test", function () {
    let oldContract, upgradedContract, owner, addr1;
    beforeEach(async function () {
      [owner, addr1] = await ethers.getSigners(2);

      const Minted721MarketplaceUpgraded = await ethers.getContractFactory(
        "Minted721MarketplaceUpgraded"
      );

      upgradedContract = await upgrades.upgradeProxy(
        minted721MarketplaceInstance,
        Minted721MarketplaceUpgraded,
        {
          call: {
            fn: "initilizeMinted721Marketplace",
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

    it("New Contract Should return the old & new greeting and token name after deployment", async function () {
      expect(await upgradedContract.greeting()).to.equal("hi i am upgraded");
    });
  });
});
