const { expect, util } = require("chai");
const {
  time,
  loadFixture,
} = require("@nomicfoundation/hardhat-network-helpers");

const {
  MarketplaceErrorMsg,
  PlanetStakeErrorMsg,
  AccessErrorMsg,
} = require("./messages");
const { ethers } = require("hardhat");

const Math = require("./helper/math");
const { stakeFixture } = require("./fixture/planetStake.fixture");
const Helper = require("./helper");

const nativeCoinAddress = "0x0000000000000000000000000000000000000001";
const zeroAddress = "0x0000000000000000000000000000000000000000";
describe("PlanetStake", function () {
  let    planetStakeInstance,
  landRockerERC1155Instance,
  lrtDistributorInstance,
  lrtInstance,
  arInstance,
  admin,
  script,
  addr1,
  addr2;

  before(async function () {
    ({
      planetStakeInstance,
    landRockerERC1155Instance,
    lrtDistributorInstance,
    lrtInstance,
    arInstance,
    admin,
    script,
    addr1,
    addr2,
    } = await loadFixture(stakeFixture));
    
  });

  it("should allow adding token ID to whitelist", async function () {
    // Assuming tokenType 0 is ERC721 and 1 is ERC1155
    const tx = await planetStakeInstance.connect(admin).setPlanetWhiteList(0);
    await expect(tx)
      .to.emit(planetStakeInstance, "PlanetWhiteListAdded")
      .withArgs(0); // Add token ID 1 to ERC721 whitelist
    await planetStakeInstance.connect(admin).setPlanetWhiteList(1);
    await planetStakeInstance.connect(admin).setPlanetWhiteList(1); // Add token ID 2 to ERC1155 whitelist
    // Add token ID 2 to ERC1155 whitelist
    expect(await planetStakeInstance.whiteList(0)).to.equal(true);
    expect(await planetStakeInstance.whiteList(1)).to.equal(true);

    await expect(
      planetStakeInstance.connect(addr2).setPlanetWhiteList(1)
    ).to.be.revertedWith(AccessErrorMsg.CALLER_NOT_ADMIN);
  });

  it("should allow to set mining capacity", async function () {
    const tx = await planetStakeInstance
      .connect(admin)
      .setPlanetMiningCapacity(0, 20);

    await expect(
      planetStakeInstance.connect(addr2).setPlanetMiningCapacity(0, 20)
    ).to.be.revertedWith(AccessErrorMsg.CALLER_NOT_ADMIN);

    await expect(
      planetStakeInstance.connect(admin).setPlanetMiningCapacity(0, 0)
    ).to.be.revertedWith(PlanetStakeErrorMsg.AMOUNT_TOO_LOW);

    await expect(tx)
      .to.emit(planetStakeInstance, "PlanetMiningCapacityUpdated")
      .withArgs(0, 20);

    const capacity = await planetStakeInstance.planetMiningCapacity(0);
    expect(capacity).to.equal(20);
  });

  describe("test stake", function () {
    it("should allow staking one ERC1155 token", async function () {
      await landRockerERC1155Instance
        .connect(addr2)
        .setApprovalForAll(planetStakeInstance.address, true);

      const tx = await planetStakeInstance.connect(addr2).stake(0);

      const stakeHistory = await planetStakeInstance.userStakes(
        addr2.address,
        landRockerERC1155Instance.address,
        0
      );

      await expect(tx)
        .to.emit(planetStakeInstance, "Staked")
        .withArgs(
          addr2.address,
          landRockerERC1155Instance.address,
          0,
          1,
          stakeHistory.stakeData.stakingDate
        );

      expect(
        await landRockerERC1155Instance.balanceOf(
          planetStakeInstance.address,
          0
        )
      ).to.equal(1);

      expect(stakeHistory.quantity).to.equal(1);
      expect(stakeHistory.tokenId).to.equal(0);
      expect(stakeHistory.stakeData.collection).to.equal(
        landRockerERC1155Instance.address
      );
    });

    // it("should not allow staking more than one ERC1155 token", async function () {
    //   await landRockerERC1155Instance
    //     .connect(addr2)
    //     .setApprovalForAll(planetStakeInstance.address, true);

    //   await expect(
    //     planetStakeInstance
    //       .connect(addr2)
    //       .stake(landRockerERC1155Instance.address, 0, 2)
    //   ).to.be.revertedWith(PlanetStakeErrorMsg.MAX_STAKE_COUNT);
    // });

    // it("should not allow staking when token address is invalid", async function () {
    //   await landRockerERC1155Instance
    //     .connect(addr2)
    //     .setApprovalForAll(planetStakeInstance.address, true);

    //   await expect(
    //     planetStakeInstance.connect(addr2).stake(owner.address, 0, 1)
    //   ).to.be.revertedWith(PlanetStakeErrorMsg.INVALID_TOKEN_ADDRESS);
    // });

    it("should not allow staking when tokenId is not white listed", async function () {
      await landRockerERC1155Instance
        .connect(addr2)
        .setApprovalForAll(planetStakeInstance.address, true);

      await expect(
        planetStakeInstance.connect(addr2).stake(5)
      ).to.be.revertedWith(PlanetStakeErrorMsg.IS_NOT_WHITE_LISTED);
    });

    it("should not allow staking when tokenId is not approved to transfer", async function () {
      await landRockerERC1155Instance
        .connect(addr2)
        .setApprovalForAll(planetStakeInstance.address, false);

      await expect(
        planetStakeInstance.connect(addr2).stake(0)
      ).to.be.revertedWith(PlanetStakeErrorMsg.APPROVED_ERROR);
    });

    it("should not allow staking when user has not sufficient balance", async function () {
      await landRockerERC1155Instance
        .connect(addr1)
        .setApprovalForAll(planetStakeInstance.address, true);

      await expect(
        planetStakeInstance.connect(addr1).stake(0)
      ).to.be.revertedWith(PlanetStakeErrorMsg.INSUFFICIENT_BALANCE);
    });
  });

  describe("test claim", function () {
    beforeEach(async function () {
      await landRockerERC1155Instance
        .connect(addr1)
        .setApprovalForAll(planetStakeInstance.address, true);

      await planetStakeInstance.connect(addr1).stake(1);
    });

    it("should allow claiming reward", async function () {
      // Assuming planetMiningCapacity[1] is set to 1

      const stakeHistory = await planetStakeInstance.userStakes(
        addr1.address,
        landRockerERC1155Instance.address,
        1
      );

      const oldStakingContractBalance =
        await landRockerERC1155Instance.balanceOf(
          planetStakeInstance.address,
          1
        );

      const oldUserStakeAmount = stakeHistory.quantity;

      const tx = await planetStakeInstance
        .connect(script)
        .claim(1, 5, addr1.address, 20);

      await expect(
        planetStakeInstance.connect(admin).claim(1, 5, addr1.address, 20)
      ).to.be.revertedWith(AccessErrorMsg.CALLER_NOT_SCRIPT);

      const stakeHistory2 = await planetStakeInstance.userStakes(
        addr1.address,
        landRockerERC1155Instance.address,
        1
      );

      const newUserStakeAmount = stakeHistory2.quantity;

      const newStakingContractBalance =
        await landRockerERC1155Instance.balanceOf(
          planetStakeInstance.address,
          1
        );

      await expect(tx)
        .to.emit(planetStakeInstance, "Claimed")
        .withArgs(
          addr1.address,
          landRockerERC1155Instance.address,
          1,
          5,
          stakeHistory2.stakeData.lastClaimedDate
        );

      expect(newStakingContractBalance).to.equal(
        oldStakingContractBalance.sub(1)
      );
      expect(newUserStakeAmount).to.equal(oldUserStakeAmount.sub(1));
      expect(stakeHistory.tokenId).to.equal(1);
      expect(stakeHistory.stakeData.collection).to.equal(
        landRockerERC1155Instance.address
      );
      const stakerBalance = await lrtInstance.balanceOf(addr1.address);
      expect(stakerBalance).to.equal(5);
    });

    it("should allow not claiming reward when there is any token to claim", async function () {
      await planetStakeInstance.connect(script).claim(1, 5, addr1.address, 20);

      await expect(
        planetStakeInstance.connect(script).claim(1, 5, addr1.address, 20)
      ).to.be.revertedWith(PlanetStakeErrorMsg.AMOUNT_EXCEED);
    });

    it("should allow not claiming reward mining capacity is still be remain", async function () {
      await expect(
        planetStakeInstance.connect(script).claim(1, 5, addr1.address, 15)
      ).to.be.revertedWith(PlanetStakeErrorMsg.CANT_CLAIMED);
    });
  });

  //Upgradeability testing
  describe("Contract Version 1 test", function () {
    it("Should return the greeting after deployment", async function () {
      const PlanetStake = await ethers.getContractFactory("PlanetStake");
  
      const contract = await upgrades.deployProxy(PlanetStake, [landRockerERC1155Instance.address,
        arInstance.address, 
        lrtDistributorInstance.address], { initializer: '__PlanetStake_init', kind: 'uups'});
      await contract.deployed();
  
      expect(await contract.greeting()).to.equal("Hello, upgradeable world!");
    });
  });
  
  describe("Contract Version 2 test", function () {
    let oldContract, upgradedContract, owner, addr1;
    beforeEach(async function () {
      [owner, addr1] = await ethers.getSigners(2);
      const PlanetStake = await ethers.getContractFactory("PlanetStake");
      const PlanetStakeUpgraded = await ethers.getContractFactory("PlanetStakeUpgraded");
  
      oldContract = await upgrades.deployProxy(PlanetStake, [landRockerERC1155Instance.address,
        arInstance.address, 
        lrtDistributorInstance.address], { initializer: '__PlanetStake_init', kind: 'uups'});
  
      await oldContract.deployed();  

      upgradedContract = await upgrades.upgradeProxy(oldContract, PlanetStakeUpgraded,
         {call: {fn: '__PlanetStakeUpgraded_init', args:[landRockerERC1155Instance.address,
          arInstance.address, 
          lrtDistributorInstance.address]}});  
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
