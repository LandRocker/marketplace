const { expect } = require("chai");
const { ethers } = require("hardhat");
const { landRockerFixture } = require("./fixture/landRocker.fixture");
const {
  loadFixture,
  time,
} = require("@nomicfoundation/hardhat-network-helpers");
const { AccessErrorMsg, LRMessage } = require("./messages");

describe("LandRocker", function () {
  let  landRockerInstance,
  arInstance,
  owner,
  admin,
  minter,
  approvedContract,
  script,
  addr1,
  addr2,
  treasury,
  royaltyRecipient;

  systemFee = 1300;
  const zeroAddress = "0x0000000000000000000000000000000000000000";

  before(async function () {
    ({
        landRockerInstance,
        arInstance,
        owner,
        admin,
        minter,
        approvedContract,
        script,
        addr1,
        addr2,
        treasury,
        royaltyRecipient
    } = await loadFixture(landRockerFixture));
  });

  it("should set the system fee", async function () {
    const tx = await landRockerInstance
      .connect(admin)
      .setSystemFee(systemFee);
    expect(await landRockerInstance.systemFee()).to.equal(1300);
    await expect(tx)
      .to.emit(landRockerInstance, "SystemFeeUpdated")
      .withArgs(systemFee);
});

  it("should set the treasury address", async function () {
    const tx = await landRockerInstance
      .connect(admin)
      .setTreasuryAddress(treasury.address);
   
    await expect(tx)
      .to.emit(landRockerInstance, "TreasuryAddressUpdated")
      .withArgs(treasury.address);
});

it("should set the treasury address721", async function () {
    const tx = await landRockerInstance
      .connect(admin)
      .setTreasuryAddress721(treasury.address);
    
    await expect(tx)
      .to.emit(landRockerInstance, "TreasuryAddress721Updated")
      .withArgs(treasury.address);
});

it("should set the treasury address1155", async function () {
    const tx = await landRockerInstance
      .connect(admin)
      .setTreasuryAddress1155(treasury.address);
    
    await expect(tx)
      .to.emit(landRockerInstance, "TreasuryAddress1155Updated")
      .withArgs(treasury.address);
});

it("should revert set the system fee when caller is not admin", async function () {
    await expect(
        landRockerInstance.connect(owner).setSystemFee(systemFee)
      ).to.be.revertedWith(AccessErrorMsg.CALLER_NOT_ADMIN);
  });

  it("should revert set the system fee when the system fee is not be valid", async function () {
    await expect(
        landRockerInstance.connect(admin).setSystemFee(1700)
      ).to.be.revertedWith(LRMessage.INVALID_SYSTEM_FEE);
  });

  it("should revert set the treasury address when caller is not admin", async function () {
    await expect(
        landRockerInstance.connect(owner).setTreasuryAddress(treasury.address)
      ).to.be.revertedWith(AccessErrorMsg.CALLER_NOT_ADMIN);
  });

  it("should revert set the treasury address when the treasury address is not be valid", async function () {
    await expect(
        landRockerInstance.connect(admin).setTreasuryAddress(zeroAddress)
      ).to.be.revertedWith(LRMessage.INVALID_Address);
  });

  it("should revert set the treasury address721 when caller is not admin", async function () {
    await expect(
        landRockerInstance.connect(owner).setTreasuryAddress721(treasury.address)
      ).to.be.revertedWith(AccessErrorMsg.CALLER_NOT_ADMIN);
  });

  it("should revert set the treasury address when the treasury address721 is not be valid", async function () {
    await expect(
        landRockerInstance.connect(admin).setTreasuryAddress721(zeroAddress)
      ).to.be.revertedWith(LRMessage.INVALID_Address);
  });

  it("should revert set the treasury address1155 when caller is not admin", async function () {
    await expect(
        landRockerInstance.connect(owner).setTreasuryAddress1155(treasury.address)
      ).to.be.revertedWith(AccessErrorMsg.CALLER_NOT_ADMIN);
   });

  it("should revert set the treasury address when the treasury address1155 is not be valid", async function () {
    await expect(
        landRockerInstance.connect(admin).setTreasuryAddress1155(zeroAddress)
      ).to.be.revertedWith(LRMessage.INVALID_Address);
  });
 
  
  // describe("Contract Version 2 test", function () {
  //   let oldContract, upgradedContract, owner, addr1;
  //   beforeEach(async function () {
  //     [owner, addr1] = await ethers.getSigners(2);
  //     const LandRockerUpgraded = await ethers.getContractFactory("LandRockerUpgraded");
  
  
  //     upgradedContract = await upgrades.upgradeProxy(
  //       landRockerInstance,
  //       LandRockerUpgraded,
  //       {
  //         call: {
  //           fn: "initializeLandRocker",
  //           args: [arInstance.address, "Hello, upgradeable world!"],
  //         },
  //       }
  //     );  
  //   });
  
   

  //   it("New Contract Should return the old & new greeting and token name after deployment", async function() {
  //     expect(await upgradedContract.greeting()).to.equal("Hello, upgradeable world!");
  //   });
   
  // });
});
