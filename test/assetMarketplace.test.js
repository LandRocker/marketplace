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
      const assetType = 0;
      const expireDate =
        (await time.latest()) + (await Helper.convertToSeconds("weeks", 1));
      const quantity = 2;

      await assetMarketplaceInstance
        .connect(admin)
        .createSell(price, assetType, expireDate, quantity);

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
        .to.emit(assetMarketplaceInstance, "Withdrawed")
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
      const assetType = 0; // fuel
      const expireDate =
        (await time.latest()) + (await Helper.convertToSeconds("weeks", 1));
      const quantity = 2;

      const tx = await assetMarketplaceInstance
        .connect(admin)
        .createSell(price, assetType, expireDate, quantity);

      await expect(tx)
        .to.emit(assetMarketplaceInstance, "SellCreated")
        .withArgs(0, assetType, expireDate, price, quantity);

      const sell = await assetMarketplaceInstance.assetSells(0);

      // Check that the sell has the correct details
      expect(sell.price).to.equal(price);
      expect(sell.status).to.equal(0);

      expect(sell.expireDate).to.equal(expireDate);
      expect(sell.assetType).to.equal(assetType);
      expect(sell.quantity).to.equal(2);
    });
    it("should not allow to create sell if quantity is invalid", async function () {
      const price = ethers.utils.parseUnits("1");
      const assetType = 0; // fuel
      const expireDate =
        (await time.latest()) + (await Helper.convertToSeconds("weeks", 1));
      const quantity = 0;

      await expect(
        assetMarketplaceInstance
          .connect(admin)
          .createSell(price, assetType, expireDate, quantity)
      ).to.be.revertedWith(AssetMarketplaceErrorMsg.INVALID_QUANTITY);
    });

    it("should not allow to create sell if caller is not admin", async function () {
      const price = ethers.utils.parseUnits("1");
      const assetType = 0; // fuel
      const expireDate =
        (await time.latest()) + (await Helper.convertToSeconds("weeks", 1));
      const quantity = 2;

      await expect(
        assetMarketplaceInstance
          .connect(owner)
          .createSell(price, assetType, expireDate, quantity)
      ).to.be.revertedWith(AccessErrorMsg.CALLER_NOT_ADMIN);
    });

    it("should not allow to create sell if expire date is invalid", async function () {
      const price = ethers.utils.parseUnits("1");
      const assetType = 0;
      const expireDate = await time.latest();
      const quantity = 100;

      await expect(
        assetMarketplaceInstance
          .connect(admin)
          .createSell(price, assetType, expireDate, quantity)
      ).to.be.revertedWith(AssetMarketplaceErrorMsg.INVALID_EXPIRE_DATE);
    });
  });

  describe("test edit sell", function () {
    it("should allow to edit sell", async function () {
      // Create an sell
      const price = ethers.utils.parseUnits("1");
      const assetType = 0;
      const expireDate =
        (await time.latest()) + (await Helper.convertToSeconds("weeks", 1));
      const quantity = 2;

      await assetMarketplaceInstance
        .connect(admin)
        .createSell(price, assetType, expireDate, quantity);

      const price2 = ethers.utils.parseUnits("2");
      const assetType2 = 1;

      const expireDate2 =
        (await time.latest()) + (await Helper.convertToSeconds("weeks", 2));
      const quantity2 = 3;

      const tx = await assetMarketplaceInstance
        .connect(admin)
        .editSell(0, price2, assetType2, expireDate2, quantity2);

      await expect(tx)
        .to.emit(assetMarketplaceInstance, "SellUpdated")
        .withArgs(0, assetType2, expireDate2, price2, quantity2);

      const sell = await assetMarketplaceInstance.assetSells(0);

      // Check that the sell has the correct details
      expect(sell.price).to.equal(price2);
      expect(sell.status).to.equal(0);
      expect(sell.assetType).to.equal(assetType2);
      expect(sell.expireDate).to.equal(expireDate2);
      expect(sell.quantity).to.equal(quantity2);
    });

    it("should not allow to edit sell if caller is not admin", async function () {
      const price = ethers.utils.parseUnits("1");
      const assetType = 0; // fuel
      const expireDate =
        (await time.latest()) + (await Helper.convertToSeconds("weeks", 1));
      const quantity = 2;

      await expect(
        assetMarketplaceInstance
          .connect(owner)
          .editSell(0, price, assetType, expireDate, quantity)
      ).to.be.revertedWith(AccessErrorMsg.CALLER_NOT_ADMIN);
    });

    it("should not allow to edit sell if quantity Amount is too low", async function () {
      const price = ethers.utils.parseUnits("1");
      const expireDate =
        (await time.latest()) + (await Helper.convertToSeconds("weeks", 1));
      const quantity = 0;
      const assetType = 0;

      await expect(
        assetMarketplaceInstance
          .connect(admin)
          .editSell(0, price, assetType, expireDate, quantity)
      ).to.be.revertedWith(AssetMarketplaceErrorMsg.INVALID_QUANTITY);
    });

    it("should not allow to edit sell if expire date is invalid", async function () {
      const price = ethers.utils.parseUnits("1");
      const expireDate = await time.latest();
      const quantity = 0;
      const assetType = 0;

      await expect(
        assetMarketplaceInstance
          .connect(admin)
          .editSell(0, price, assetType, expireDate, quantity)
      ).to.be.revertedWith(AssetMarketplaceErrorMsg.INVALID_EXPIRE_DATE);
    });

    it("should not allow to edit sell if sell has not valid status", async function () {
      const price = ethers.utils.parseUnits("1");
      const assetType = 0;
      const expireDate =
        (await time.latest()) + (await Helper.convertToSeconds("weeks", 1));
      const quantity = 2;

      await assetMarketplaceInstance
        .connect(admin)
        .createSell(price, assetType, expireDate, quantity);

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
          .editSell(0, price, assetType, expireDate, quantity)
      ).to.be.revertedWith(AssetMarketplaceErrorMsg.SOLD_ASSET);
    });
  });

  describe("test buy assets", function () {
    it("should allow to buy off-chain assets", async function () {
      const price = ethers.utils.parseUnits("1");
      const assetType = 0;
      const expireDate =
        (await time.latest()) + (await Helper.convertToSeconds("weeks", 1));
      const quantity = 2;

      await assetMarketplaceInstance
        .connect(admin)
        .createSell(price, assetType, expireDate, quantity);

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
        .to.emit(assetMarketplaceInstance, "OffChainItemBought")
        .withArgs(0, assetType, addr2.address, quantity, price);

      const newBuyerBalance = await lrtInstance.balanceOf(addr2.address);
      const newSellerBalance = await lrtInstance.balanceOf(owner.address);
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
      const startDate1 = await time.latest();
      const cliff1 = await Helper.convertToSeconds("months", 3); // 3 month cliff
      const duration1 = await Helper.convertToSeconds("months", 48); // 48 month vesting period
      const revocable1 = true;
      const poolName = ethers.utils.formatBytes32String("PreSale");
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
        (await time.latest()) + (await Helper.convertToSeconds("days", 1)); // Start date 1 day from now
      await lrtVestingInstance
        .connect(admin)
        .createVesting(
          addr1.address,
          vestingStartDate1,
          vestingAmount1,
          planId1
        );
      const price = ethers.utils.parseUnits("1");
      const assetType = 0;
      const expireDate =
        (await time.latest()) + (await Helper.convertToSeconds("weeks", 1));
      const quantity = 2;

      await assetMarketplaceInstance
        .connect(admin)
        .createSell(price, assetType, expireDate, quantity);

      await lrtInstance
        .connect(addr1)
        .approve(assetMarketplaceInstance.address, price);

      const tx = await assetMarketplaceInstance.connect(addr1).buyItem(0);

      await expect(tx)
        .to.emit(assetMarketplaceInstance, "OffChainItemBought")
        .withArgs(0, assetType, addr1.address, quantity, price);

      const sell = await assetMarketplaceInstance.assetSells(0);
      const vestingStat = await lrtVestingInstance.holdersStat(addr1.address);
      expect(vestingStat.claimedAmount).to.equal(price);
      expect(sell.status).to.equal(1);
    });

    it("should not allow to buy off-chain assets token when sale has expired", async function () {
      const price = ethers.utils.parseUnits("1");
      const assetType = 0;
      const expireDate =
        (await time.latest()) + (await Helper.convertToSeconds("weeks", 1));
      const quantity = 2;

      await assetMarketplaceInstance
        .connect(admin)
        .createSell(price, assetType, expireDate, quantity);

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
      const assetType = 0;
      const expireDate =
        (await time.latest()) + (await Helper.convertToSeconds("weeks", 1));
      const quantity = 2;

      await assetMarketplaceInstance
        .connect(admin)
        .createSell(price, assetType, expireDate, quantity);

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

    it("should not allow to buy off-chain assets token when has allowance error", async function () {
      const price = ethers.utils.parseUnits("1");
      const assetType = 0;
      const expireDate =
        (await time.latest()) + (await Helper.convertToSeconds("weeks", 1));
      const quantity = 2;

      await assetMarketplaceInstance
        .connect(admin)
        .createSell(price, assetType, expireDate, quantity);

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
      const assetType = 0;
      const expireDate =
        (await time.latest()) + (await Helper.convertToSeconds("weeks", 1));
      const quantity = 2;

      await assetMarketplaceInstance
        .connect(admin)
        .createSell(price, assetType, expireDate, quantity);

      await lrtInstance
        .connect(addr2)
        .approve(assetMarketplaceInstance.address, price);

      await expect(
        assetMarketplaceInstance.connect(addr2).buyItem(0)
      ).to.be.revertedWith(AssetMarketplaceErrorMsg.INSUFFICIENT_BALANCE);
    });
  });

  describe("test cancel sell", function () {
    beforeEach(async function () {
      const price = ethers.utils.parseUnits("1");
      const assetType = 0;
      const expireDate =
        (await time.latest()) + (await Helper.convertToSeconds("weeks", 1));
      const quantity = 2;

      await assetMarketplaceInstance
        .connect(admin)
        .createSell(price, assetType, expireDate, quantity);
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
      const price = 1;
      const assetType = 0;
      const expireDate = 0;
      const quantity = 2;
      const status = 0;
      const seller = addr1.address;
      const buyer = addr2.address;
      const orderId = 0;
      const orderIdHash = ethers.utils.keccak256(Buffer.from("0"));
  
      const privateKey = Uint8Array.from(
        Buffer.from(
          "dbda1821b80551c9d65939329250298aa3472ba22feea921c0cf5d620ea67b97",
          "hex"
        )
      );

      // console.log(
      //   privateKey,
      //   "..............................................."
      // );

      // console.log(assetMarketplaceInstance.address);
      let sign1 = await createMsgWithSig(
        assetMarketplaceInstance,
        privateKey,
        orderIdHash,
        status,
        assetType,
        expireDate,
        price,
        quantity
      );

      // console.log(sign1.v.toString(), "sign1 v");
      // console.log(sign1.r.toString(), "sign1 r");
      // console.log(sign1.s.toString(), "sign1 s");

      const domain = {
        name: "AssetMarketplace",
        version: "1",
        chainId: 31337,
        verifyingContract: assetMarketplaceInstance.address,
      };

      const types = {
        fullFillOrder: [
          { name: "orderIdHash", type: "bytes32" },
          { name: "status", type: "uint32" },
          { name: "assetType", type: "uint8" },
          { name: "expireDate", type: "uint64" },
          { name: "price", type: "uint256" },
          { name: "quantity", type: "uint256" },
        ],
      };

      const value = {
        orderIdHash: orderIdHash,
        status: 0,
        assetType: 0,
        expireDate: 0,
        price: ethers.utils.parseUnits("10"),
        quantity: 2,
      };

      // // set the provider with the desired port
      const provider = new ethers.providers.JsonRpcProvider(
        `http://localhost:8545`
      );

      const signer = new ethers.Wallet(privateKey, provider);
      const signature1 = await signer._signTypedData(domain, types, value);
      const signParams1 = ethers.utils.splitSignature(signature1);

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

      //console.log("xxxxxx", signParams1.v, signParams1.r, signParams1.s);
      const tx = await assetMarketplaceInstance
        .connect(addr2)
        .fulfillOrder(
          orderIdHash,
          seller,
          status,
          assetType,
          expireDate,
          price,
          quantity,
          sign1.v,
          sign1.r,
          sign1.s
        );

      await expect(tx)
        .to.emit(assetMarketplaceInstance, "UserOffChainItemBought")
        .withArgs(orderIdHash, assetType, addr2.address, quantity, price);

      const newBuyerBalance = await lrtInstance.balanceOf(buyer);
      const newSystemBalance = await lrtInstance.balanceOf(
        assetMarketplaceInstance.address
      );
     
      expect(
        await assetMarketplaceInstance.orderFulfilled(orderIdHash)
      ).to.equal(true);
      expect(Number(newBuyerBalance)).to.equal(
        Number(Math.Big(oldBuyerBalance).sub(price))
      );

      expect(Number(newSystemBalance)).to.equal(
        Number(Math.Big(oldSystemBalance).add(price))
      );
    });

    it("should allow to buy user off-chain assets with vested funds", async function () {
      const price = 1;
      const assetType = 0;
      const expireDate =
        (await time.latest()) + (await Helper.convertToSeconds("weeks", 1));
      const quantity = 2;
      const status = 0;
      const seller = addr1.address;
      const buyer = addr2.address;
      const orderId = 0;
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
        orderIdHash,
        status,
        assetType,
        expireDate,
        price,
        quantity
      );

      const domain = {
        name: "AssetMarketplace",
        version: "1",
        chainId: 31337,
        verifyingContract: assetMarketplaceInstance.address,
      };

      const types = {
        fullFillOrder: [
          { name: "orderIdHash", type: "bytes32" },
          { name: "status", type: "uint32" },
          { name: "assetType", type: "uint8" },
          { name: "expireDate", type: "uint64" },
          { name: "price", type: "uint256" },
          { name: "quantity", type: "uint256" },
        ],
      };

      const value = {
        orderIdHash: orderIdHash,
        status: 0,
        assetType: 0,
        expireDate: 0,
        price: ethers.utils.parseUnits("10"),
        quantity: 2,
      };

      // set the provider with the desired port
      const provider = new ethers.providers.JsonRpcProvider(
        `http://localhost:8545`
      );

      const signer = new ethers.Wallet(privateKey, provider);
      const signature1 = await signer._signTypedData(domain, types, value);
      const signParams1 = ethers.utils.splitSignature(signature1);

      //create vesting plan
      const startDate1 = await time.latest();
      const cliff1 = await Helper.convertToSeconds("months", 3); // 3 month cliff
      const duration1 = await Helper.convertToSeconds("months", 48); // 48 month vesting period
      const revocable1 = true;
      const poolName = ethers.utils.formatBytes32String("PreSale");
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
        (await time.latest()) + (await Helper.convertToSeconds("days", 1)); // Start date 1 day from now
      await lrtVestingInstance
        .connect(admin)
        .createVesting(buyer, vestingStartDate1, vestingAmount1, planId1);

      await lrtInstance
        .connect(addr2)
        .approve(assetMarketplaceInstance.address, price);
      
      const tx = await assetMarketplaceInstance
        .connect(addr2)
        .fulfillOrder(
          orderIdHash,
          seller,
          status,
          assetType,
          expireDate,
          price,
          quantity,
          sign1.v,
          sign1.r,
          sign1.s
        );

      await expect(tx)
        .to.emit(assetMarketplaceInstance, "UserOffChainItemBought")
        .withArgs(orderIdHash, assetType, addr2.address, quantity, price);
      
      expect(
        await assetMarketplaceInstance.orderFulfilled(orderIdHash)
      ).to.equal(true);
      const vestingStat = await lrtVestingInstance.holdersStat(buyer);
      expect(vestingStat.claimedAmount).to.equal(price);  
    });

    it("should not allow to buy user off-chain assets token when sale has expired", async function () {
      const price = 1;
      const assetType = 0;
      const expireDate =
        (await time.latest()) + (await Helper.convertToSeconds("weeks", 1));
      const quantity = 2;
      const status = 0;
      const seller = addr1.address;
      const buyer = addr2.address;
      const orderId = 0;
      const orderIdHash = ethers.utils.keccak256(Buffer.from("0"));
      console.log(orderIdHash, "orderIdHash");
      const privateKey = Uint8Array.from(
        Buffer.from(
          "dbda1821b80551c9d65939329250298aa3472ba22feea921c0cf5d620ea67b97",
          "hex"
        )
      );

      let sign1 = await createMsgWithSig(
        assetMarketplaceInstance,
        privateKey,
        orderIdHash,
        status,
        assetType,
        expireDate,
        price,
        quantity
      );    

      const domain = {
        name: "AssetMarketplace",
        version: "1",
        chainId: 31337,
        verifyingContract: assetMarketplaceInstance.address,
      };

      const types = {
        fullFillOrder: [
          { name: "orderIdHash", type: "bytes32" },
          { name: "status", type: "uint32" },
          { name: "assetType", type: "uint8" },
          { name: "expireDate", type: "uint64" },
          { name: "price", type: "uint256" },
          { name: "quantity", type: "uint256" },
        ],
      };

      const value = {
        orderIdHash: orderIdHash,
        status: 0,
        assetType: 0,
        expireDate: 0,
        price: ethers.utils.parseUnits("10"),
        quantity: 2,
      };

      // // set the provider with the desired port
      const provider = new ethers.providers.JsonRpcProvider(
        `http://localhost:8545`
      );

      const signer = new ethers.Wallet(privateKey, provider);
      const signature1 = await signer._signTypedData(domain, types, value);
      const signParams1 = ethers.utils.splitSignature(signature1);

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
            assetType,
            expireDate,
            price,
            quantity,
            sign1.v,
            sign1.r,
            sign1.s
          )
      ).to.be.revertedWith(AssetMarketplaceErrorMsg.HAS_EXPIRED);
    });

    it("should not allow to buy user off-chain assets token when status of listed NFTs is not be valid", async function () {
      const price = 1;
      const assetType = 0;
      const expireDate = 0;
      const quantity = 2;
      const status = 2;
      const seller = addr1.address;
      const buyer = addr2.address;
      const orderId = 0;
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
        orderIdHash,
        status,
        assetType,
        expireDate,
        price,
        quantity
      );


      const domain = {
        name: "AssetMarketplace",
        version: "1",
        chainId: 31337,
        verifyingContract: assetMarketplaceInstance.address,
      };

      const types = {
        fullFillOrder: [
          { name: "orderIdHash", type: "bytes32" },
          { name: "status", type: "uint32" },
          { name: "assetType", type: "uint8" },
          { name: "expireDate", type: "uint64" },
          { name: "price", type: "uint256" },
          { name: "quantity", type: "uint256" },
        ],
      };

      const value = {
        orderIdHash: orderIdHash,
        status: 0,
        assetType: 0,
        expireDate: 0,
        price: ethers.utils.parseUnits("10"),
        quantity: 2,
      };

      // // set the provider with the desired port
      const provider = new ethers.providers.JsonRpcProvider(
        `http://localhost:8545`
      );

      const signer = new ethers.Wallet(privateKey, provider);
      const signature1 = await signer._signTypedData(domain, types, value);
      const signParams1 = ethers.utils.splitSignature(signature1);

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
    
      await expect(
        assetMarketplaceInstance
          .connect(addr2)
          .fulfillOrder(
            orderIdHash,
            seller,
            status,
            assetType,
            expireDate,
            price,
            quantity,
            sign1.v,
            sign1.r,
            sign1.s
          )
      ).to.be.revertedWith(AssetMarketplaceErrorMsg.INVALID_STATUS);
    });

    it("should not allow to buy user off-chain assets token when has allowance error", async function () {
      const price = 1;
      const assetType = 0;
      const expireDate = 0;
      const quantity = 2;
      const status = 0;
      const seller = addr1.address;
      const buyer = addr2.address;
      const orderId = 0;
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
        orderIdHash,
        status,
        assetType,
        expireDate,
        price,
        quantity
      );    

      const domain = {
        name: "AssetMarketplace",
        version: "1",
        chainId: 31337,
        verifyingContract: assetMarketplaceInstance.address,
      };

      const types = {
        fullFillOrder: [
          { name: "orderIdHash", type: "bytes32" },
          { name: "status", type: "uint32" },
          { name: "assetType", type: "uint8" },
          { name: "expireDate", type: "uint64" },
          { name: "price", type: "uint256" },
          { name: "quantity", type: "uint256" },
        ],
      };

      const value = {
        orderIdHash: orderIdHash,
        status: 0,
        assetType: 0,
        expireDate: 0,
        price: ethers.utils.parseUnits("10"),
        quantity: 2,
      };

      // // set the provider with the desired port
      const provider = new ethers.providers.JsonRpcProvider(
        `http://localhost:8545`
      );

      const signer = new ethers.Wallet(privateKey, provider);
      const signature1 = await signer._signTypedData(domain, types, value);
      const signParams1 = ethers.utils.splitSignature(signature1);

      await lrtInstance
        .connect(distributor)
        .transferToken(buyer, ethers.utils.parseUnits("500"));

      await lrtInstance
        .connect(addr2)
        .approve(assetMarketplaceInstance.address, 0); //addr1.address

      const oldBuyerBalance = await lrtInstance.balanceOf(buyer);
      const oldSystemBalance = await lrtInstance.balanceOf(
        assetMarketplaceInstance.address
      );
   
      await expect(
        assetMarketplaceInstance
          .connect(addr2)
          .fulfillOrder(
            orderIdHash,
            seller,
            status,
            assetType,
            expireDate,
            price,
            quantity,
            sign1.v,
            sign1.r,
            sign1.s
          )
      ).to.be.revertedWith(AssetMarketplaceErrorMsg.ALLOWANCE);
    });

    it("should not allow to buy user off-chain assets token when user has not sufficient vesting balance", async function () {
      const price = 1;
      const assetType = 0;
      const expireDate = 0;
      const quantity = 2;
      const status = 0;
      const seller = addr1.address;
      const buyer = addr2.address;
      const orderId = 0;
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
        orderIdHash,
        status,
        assetType,
        expireDate,
        price,
        quantity
      );

      const domain = {
        name: "AssetMarketplace",
        version: "1",
        chainId: 31337,
        verifyingContract: assetMarketplaceInstance.address,
      };

      const types = {
        fullFillOrder: [
          { name: "orderIdHash", type: "bytes32" },
          { name: "status", type: "uint32" },
          { name: "assetType", type: "uint8" },
          { name: "expireDate", type: "uint64" },
          { name: "price", type: "uint256" },
          { name: "quantity", type: "uint256" },
        ],
      };

      const value = {
        orderIdHash: orderIdHash,
        status: 0,
        assetType: 0,
        expireDate: 0,
        price: ethers.utils.parseUnits("10"),
        quantity: 2,
      };

      // // set the provider with the desired port
      const provider = new ethers.providers.JsonRpcProvider(
        `http://localhost:8545`
      );

      const signer = new ethers.Wallet(privateKey, provider);
      const signature1 = await signer._signTypedData(domain, types, value);
      const signParams1 = ethers.utils.splitSignature(signature1);

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
            assetType,
            expireDate,
            price,
            quantity,
            sign1.v,
            sign1.r,
            sign1.s
          )
      ).to.be.revertedWith(AssetMarketplaceErrorMsg.INSUFFICIENT_BALANCE);
    });
  });

  //Upgradeability testing
  describe("Contract Version 1 test", function () {
    it("Should return the greeting after deployment", async function () {
      const AssetMarketplace = await ethers.getContractFactory(
        "AssetMarketplace"
      );

      const contract = await upgrades.deployProxy(
        AssetMarketplace,
        [
          arInstance.address,
          lrtInstance.address,
          landRockerInstance.address,
          lrtVestingInstance.address,
        ],
        { initializer: "__AssetMarketplace_init", kind: "uups" }
      );
      await contract.deployed();

      expect(await contract.greeting()).to.equal("Hello, upgradeable world!");
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
        { initializer: "__AssetMarketplace_init", kind: "uups" }
      );

      await oldContract.deployed();

      upgradedContract = await upgrades.upgradeProxy(
        oldContract,
        AssetMarketplaceUpgraded,
        {
          call: {
            fn: "__AssetMarketplaceUpgraded_init",
            args: [
              arInstance.address,
              lrtInstance.address,
              landRockerInstance.address,
              lrtVestingInstance.address,
            ],
          },
        }
      );
    });

    it("Old contract should return old greeting", async function () {
      expect(await oldContract.greeting()).to.equal(
        "Hello, upgradeable world!"
      );
    });

    it("Old contract cannot mint NFTs", async function () {
      try {
        oldContract.greetingNew();
      } catch (error) {
        expect(error.message === "oldContract.greetingNew is not a function");
      }
    });

    it("New Contract Should return the old & new greeting and token name after deployment", async function () {
      expect(await upgradedContract.greeting()).to.equal(
        "Hello, upgradeable world!"
      );
      expect(await upgradedContract.greetingNew()).to.equal(
        "New Upgradeable World!"
      );
    });
  });
});
