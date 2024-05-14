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
  BlueprintMarketplaceErrorMsg,
} = require("./messages");
const { ethers, network, upgrades } = require("hardhat");

const Math = require("./helper/math");
const {
  blueprintMarketplaceFixture,
} = require("./fixture/blueprintMarketplace.fixture");
const Helper = require("./helper");
const { createBlueprintMsgWithSig } = require("./helper/signature");
const ether = require("@openzeppelin/test-helpers/src/ether");

const zeroAddress = "0x0000000000000000000000000000000000000000";

describe("Blueprint Marketplace contract", function () {
  let blueprintMarketplaceInstance,
    landRockerInstance,
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
      blueprintMarketplaceInstance,
      landRockerInstance,
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
    } = await loadFixture(blueprintMarketplaceFixture));
  });

  describe("test withdraw", function () {
    beforeEach(async function () {
      const price = ethers.utils.parseUnits("10");
      const blueprintId = 5;
      const expireDate = 0;
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

      let sign1 = await createBlueprintMsgWithSig(
        blueprintMarketplaceInstance,
        privateKey,
        orderIdHash,
        status,
        blueprintId,
        expireDate,
        price
      );

      await lrtInstance
        .connect(distributor)
        .transferToken(buyer, ethers.utils.parseUnits("500"));

      await lrtInstance
        .connect(addr2)
        .approve(blueprintMarketplaceInstance.address, price);
      const tx = await blueprintMarketplaceInstance
        .connect(addr2)
        .fulfillOrder(
          orderIdHash,
          seller,
          status,
          blueprintId,
          expireDate,
          price,
          sign1.v,
          sign1.r,
          sign1.s
        );
    });

    it("should allow to withdraw contract balance", async function () {
      const amount = ethers.utils.parseUnits("0.002", 18);

      const treasuryAddress = await landRockerInstance.treasury();
      const oldTreasury = await lrtInstance.balanceOf(treasuryAddress);
      const oldSystemBalance = await lrtInstance.balanceOf(
        blueprintMarketplaceInstance.address
      );

      const tx = await blueprintMarketplaceInstance
        .connect(admin)
        .withdraw(amount);

      await expect(tx)
        .to.emit(blueprintMarketplaceInstance, "Withdrawn")
        .withArgs(amount, treasuryAddress);

      const newTreasury = await lrtInstance.balanceOf(treasuryAddress);
      const newSystemBalance = await lrtInstance.balanceOf(
        blueprintMarketplaceInstance.address
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
        blueprintMarketplaceInstance.connect(addr1).withdraw(amount)
      ).to.be.revertedWith(AccessErrorMsg.CALLER_NOT_ADMIN);
    });

    it("should not allow to withdraw sell if amount is too low", async function () {
      const amount = ethers.utils.parseUnits("0", 18);

      await expect(
        blueprintMarketplaceInstance.connect(admin).withdraw(amount)
      ).to.be.revertedWith(BlueprintMarketplaceErrorMsg.LOW_AMOUNT);
    });

    it("should not allow to withdraw sell if balance insufficient", async function () {
      const amount = ethers.utils.parseUnits("5", 18);

      await expect(
        blueprintMarketplaceInstance.connect(admin).withdraw(amount)
      ).to.be.revertedWith(BlueprintMarketplaceErrorMsg.NO_BALANCE);
    });
  });

  //user off-chain blueprints buying
  describe("test user off-chain blueprints buying", function () {
    it("should allow to buy off-chain blueprints", async function () {
      const price = ethers.utils.parseUnits("10");
      const blueprintId = 5;
      const expireDate = 0;
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

      let sign1 = await createBlueprintMsgWithSig(
        blueprintMarketplaceInstance,
        privateKey,
        orderIdHash,
        status,
        blueprintId,
        expireDate,
        price
      );

      await lrtInstance
        .connect(distributor)
        .transferToken(buyer, ethers.utils.parseUnits("500"));

      await lrtInstance
        .connect(addr2)
        .approve(blueprintMarketplaceInstance.address, price); //addr1.address

      const oldBuyerBalance = await lrtInstance.balanceOf(buyer);
      const oldSystemBalance = await lrtInstance.balanceOf(
        blueprintMarketplaceInstance.address
      );
      const oldSellerBalance = await lrtInstance.balanceOf(seller);

      const tx = await blueprintMarketplaceInstance
        .connect(addr2)
        .fulfillOrder(
          orderIdHash,
          seller,
          status,
          blueprintId,
          expireDate,
          price,
          sign1.v,
          sign1.r,
          sign1.s
        );

      let systemPortion = Math.Big(systemFee).mul(price).div(10000);
      let totalPay = Math.Big(price).sub(systemPortion);

      await expect(tx)
        .to.emit(blueprintMarketplaceInstance, "FulFilledOrder")
        .withArgs(
          orderIdHash,
          blueprintId,
          seller,
          addr2.address,
          BigInt(totalPay)
        );

      const newBuyerBalance = await lrtInstance.balanceOf(buyer);
      const newSystemBalance = await lrtInstance.balanceOf(
        blueprintMarketplaceInstance.address
      );
      const newSellerBalance = await lrtInstance.balanceOf(seller);

      expect(
        await blueprintMarketplaceInstance.orderFulfilled(orderIdHash)
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

    it("should not allow to buy user off-chain blueprints token when sale has expired", async function () {
      const price = ethers.utils.parseUnits("10");
      const blueprintId = 5;
      const expireDate =
        (await time.latest()) + (await Helper.convertToSeconds("weeks", 1));
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

      let sign1 = await createBlueprintMsgWithSig(
        blueprintMarketplaceInstance,
        privateKey,
        orderIdHash,
        status,
        blueprintId,
        expireDate,
        price
      );

      await lrtInstance
        .connect(distributor)
        .transferToken(buyer, ethers.utils.parseUnits("500"));

      const elapsedTime = await Helper.convertToSeconds("weeks", 2);

      await network.provider.send("evm_increaseTime", [elapsedTime]);
      await network.provider.send("evm_mine");

      await lrtInstance
        .connect(addr2)
        .approve(blueprintMarketplaceInstance.address, price);

      await expect(
        blueprintMarketplaceInstance
          .connect(addr2)
          .fulfillOrder(
            orderIdHash,
            seller,
            status,
            blueprintId,
            expireDate,
            price,
            sign1.v,
            sign1.r,
            sign1.s
          )
      ).to.be.revertedWith(BlueprintMarketplaceErrorMsg.HAS_EXPIRED);
    });

    it("should not allow to buy user off-chain blueprints token when status of listed blueprint is not be valid", async function () {
      const price = ethers.utils.parseUnits("10");
      const blueprintId = 5;
      const expireDate = 0;
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

      let sign1 = await createBlueprintMsgWithSig(
        blueprintMarketplaceInstance,
        privateKey,
        orderIdHash,
        status,
        blueprintId,
        expireDate,
        price
      );

      await lrtInstance
        .connect(distributor)
        .transferToken(buyer, ethers.utils.parseUnits("500"));

      await lrtInstance
        .connect(addr2)
        .approve(blueprintMarketplaceInstance.address, price); //addr1.address

      await expect(
        blueprintMarketplaceInstance
          .connect(addr2)
          .fulfillOrder(
            orderIdHash,
            seller,
            status,
            blueprintId,
            expireDate,
            price,
            sign1.v,
            sign1.r,
            sign1.s
          )
      ).to.be.revertedWith(BlueprintMarketplaceErrorMsg.INVALID_STATUS);
    });

    it("should not allow to buy user off-chain blueprints token when has allowance error", async function () {
      const price = ethers.utils.parseUnits("10");
      const blueprintId = 5;
      const expireDate = 0;
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

      let sign1 = await createBlueprintMsgWithSig(
        blueprintMarketplaceInstance,
        privateKey,
        orderIdHash,
        status,
        blueprintId,
        expireDate,
        price
      );

      await lrtInstance
        .connect(distributor)
        .transferToken(buyer, ethers.utils.parseUnits("500"));

      await lrtInstance
        .connect(addr2)
        .approve(blueprintMarketplaceInstance.address, 0); //addr1.address

      await expect(
        blueprintMarketplaceInstance
          .connect(addr2)
          .fulfillOrder(
            orderIdHash,
            seller,
            status,
            blueprintId,
            expireDate,
            price,
            sign1.v,
            sign1.r,
            sign1.s
          )
      ).to.be.revertedWith(BlueprintMarketplaceErrorMsg.ALLOWANCE);
    });

    it("should not allow to buy user off-chain blueprints token when user has not sufficient balance", async function () {
      const price = ethers.utils.parseUnits("10");
      const blueprintId = 5;
      const expireDate = 0;
      const status = 0;
      const seller = addr1.address;
      const orderIdHash = ethers.utils.keccak256(Buffer.from("0"));
      const privateKey = Uint8Array.from(
        Buffer.from(
          "dbda1821b80551c9d65939329250298aa3472ba22feea921c0cf5d620ea67b97",
          "hex"
        )
      );

      let sign1 = await createBlueprintMsgWithSig(
        blueprintMarketplaceInstance,
        privateKey,
        orderIdHash,
        status,
        blueprintId,
        expireDate,
        price
      );

      await lrtInstance
        .connect(addr2)
        .approve(blueprintMarketplaceInstance.address, price); //addr1.address

      await expect(
        blueprintMarketplaceInstance
          .connect(addr2)
          .fulfillOrder(
            orderIdHash,
            seller,
            status,
            blueprintId,
            expireDate,
            price,
            sign1.v,
            sign1.r,
            sign1.s
          )
      ).to.be.revertedWith(
        BlueprintMarketplaceErrorMsg.INSUFFICIENT_LRT_BALANCE
      );
    });

    it("should not allow to buy user off-chain blueprints token when user wants to buy twice", async function () {
      const price = ethers.utils.parseUnits("10");
      const blueprintId = 5;
      const expireDate = 0;
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

      let sign1 = await createBlueprintMsgWithSig(
        blueprintMarketplaceInstance,
        privateKey,
        orderIdHash,
        status,
        blueprintId,
        expireDate,
        price
      );

      await lrtInstance
        .connect(distributor)
        .transferToken(buyer, ethers.utils.parseUnits("500"));

      await lrtInstance
        .connect(addr2)
        .approve(blueprintMarketplaceInstance.address, price); //addr1.address

      await blueprintMarketplaceInstance
        .connect(addr2)
        .fulfillOrder(
          orderIdHash,
          seller,
          status,
          blueprintId,
          expireDate,
          price,
          sign1.v,
          sign1.r,
          sign1.s
        );

      await expect(
        blueprintMarketplaceInstance
          .connect(addr2)
          .fulfillOrder(
            orderIdHash,
            seller,
            status,
            blueprintId,
            expireDate,
            price,
            sign1.v,
            sign1.r,
            sign1.s
          )
      ).to.be.revertedWith(
        BlueprintMarketplaceErrorMsg.ORDER_ALREADY_FUL_FILLED
      );
    });
  });

  describe("Contract Version 2 test", function () {
    let oldContract, upgradedContract, owner, addr1;
    beforeEach(async function () {
      [owner, addr1] = await ethers.getSigners(2);
      const BlueprintMarketplace = await ethers.getContractFactory(
        "BlueprintMarketplace"
      );
      const BlueprintMarketplaceUpgraded = await ethers.getContractFactory(
        "BlueprintMarketplaceUpgraded"
      );

      oldContract = await upgrades.deployProxy(
        BlueprintMarketplace,
        [arInstance.address, lrtInstance.address, landRockerInstance.address],
        { initializer: "initializeBlueprintMarketplace", kind: "uups" }
      );

      await oldContract.deployed();

      upgradedContract = await upgrades.upgradeProxy(
        oldContract,
        BlueprintMarketplaceUpgraded,
        {
          call: {
            fn: "initializeBlueprintMarketplace",
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
