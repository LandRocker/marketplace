// Import necessary packages and libraries
const { expect } = require("chai");
const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");
const { accessRestrictionFixture } = require("./fixture");
const { AccessErrorMsg } = require("./messages");
describe("AccessRestriction", function () {
  let arInstance,
    owner,
    admin,
    distributor,
    wert,
    vesting_manager,
    approvedContract,
    script,
    addr1,
    addr2,
    treasury,
    royaltyRecipient;

  beforeEach(async function () {
    ({
      arInstance,
      owner,
      admin,
      distributor,
      wert,
      vesting_manager,
      approvedContract,
      script,
      addr1,
      addr2,
      treasury,
      royaltyRecipient,
    } = await loadFixture(accessRestrictionFixture));
  });

  // Test cases for each function in the AccessRestriction arInstance
  describe("pause", function () {
    it("should pause the arInstance when called by the owner", async function () {
      await arInstance.connect(owner).pause();
      expect(await arInstance.paused()).to.be.true;
    });

    it("should pause the arInstance when called by the non-owner", async function () {
      await expect(arInstance.connect(addr1).pause()).to.be.revertedWith(
        AccessErrorMsg.CALLER_NOT_OWNER
      );
    });

    it("should unpause the arInstance when called by the non-owner", async function () {
      await expect(arInstance.connect(addr1).unpause()).to.be.revertedWith(
        AccessErrorMsg.CALLER_NOT_OWNER
      );
    });

    it("should revert with message 'AR::Paused', if the  arInstance is paused", async () => {
      await arInstance.pause();
      await expect(arInstance.ifNotPaused()).to.be.revertedWith(
        AccessErrorMsg.PAUSEABLE_PAUSED
      );
    });

    it("should not revert if the  arInstance is not paused", async () => {
      await expect(arInstance.ifNotPaused()).to.not.be.reverted;
    });

    it("should revert with message 'AR::Not paused', if the arInstance is not paused", async () => {
      await expect(arInstance.ifPaused()).to.be.revertedWith(
        AccessErrorMsg.PAUSEABLE_NOT_PAUSED
      );
    });

    it("should not revert if the arInstance is paused", async () => {
      await arInstance.pause();
      await expect(arInstance.ifPaused()).to.not.be.reverted;
    });
  });

  describe("unpause", function () {
    it("should unpause the arInstance when called by the owner", async function () {
      await arInstance.connect(owner).pause();
      await arInstance.connect(owner).unpause();
      expect(await arInstance.paused()).to.be.false;
    });
  });

  describe("ifOwner", () => {
    it("should return true if caller is an owner", async () => {
      await arInstance.connect(owner).ifOwner(owner.address);
      const isOwner = await arInstance.isOwner(owner.address);
      expect(isOwner).to.be.true;
    });
    it("should revert if caller is not the owner", async () => {
      await expect(
        arInstance.connect(addr1).ifOwner(addr1.address)
      ).to.be.revertedWith(AccessErrorMsg.CALLER_NOT_OWNER);
    });
  });

  describe("isDistributor", () => {
    it("should return true if candidate address has distributor role", async () => {
      await arInstance.connect(owner).ifDistributor(distributor.address);
      const isDistributor = await arInstance.isDistributor(distributor.address);
      expect(isDistributor).to.be.true;
    });
    it("should revert if candidate address has not distributor role", async () => {
      await expect(
        arInstance.connect(addr1).ifDistributor(addr1.address)
      ).to.be.revertedWith(AccessErrorMsg.CALLER_NOT_DISTRIBUTOR);
    });
  });

  describe("isWert", () => {
    it("should return true if candidate address has wert role", async () => {
      await arInstance.connect(owner).ifWert(wert.address);
      const isWert = await arInstance.isWert(wert.address);
      expect(isWert).to.be.true;
    });
    it("should revert if candidate address has not wert role", async () => {
      await expect(
        arInstance.connect(owner).ifWert(treasury.address)
      ).to.be.revertedWith(AccessErrorMsg.CALLER_NOT_WERT);
    });
  });

  describe("isVestingManager", () => {
    it("should return true if candidate address has vesting manager role", async () => {
      await arInstance.connect(owner).ifVestingManager(vesting_manager.address);
      const isVestingManager = await arInstance.isVestingManager(vesting_manager.address);
      expect(isVestingManager).to.be.true;
    });
    it("should revert if candidate address has not minter role", async () => {
      await expect(
        arInstance.connect(addr1).ifVestingManager(addr1.address)
      ).to.be.revertedWith(AccessErrorMsg.CALLER_NOT_VESTING_MANAGER);
    });
  });
  
  describe("ifAdmin", () => {
    it("should return true if candidate address has admin role", async () => {
      await arInstance.connect(owner).ifAdmin(admin.address);
      const isAdmin = await arInstance.isAdmin(admin.address);
      expect(isAdmin).to.be.true;
    });
    it("should revert if candidate address has not minter role", async () => {
      await expect(
        arInstance.connect(addr1).ifAdmin(addr1.address)
      ).to.be.revertedWith(AccessErrorMsg.CALLER_NOT_ADMIN);
    });
  });

  describe("ifApprovedContract", () => {
    it("should return true if candidate address has approvedContract role", async () => {
      await arInstance
        .connect(owner)
        .ifApprovedContract(approvedContract.address);
      const isApprovedContract = await arInstance.isApprovedContract(
        approvedContract.address
      );
      expect(isApprovedContract).to.be.true;
    });
    it("should revert if candidate address has not approvedContract role", async () => {
      await expect(
        arInstance.connect(addr1).ifApprovedContract(addr1.address)
      ).to.be.revertedWith(AccessErrorMsg.CALLER_NOT_APPROVED_CONTRACT);
    });
  });

  describe("ifScript", () => {
    it("should return true if candidate address has script role", async () => {
      await arInstance.connect(owner).ifScript(script.address);
      const isScript = await arInstance.isScript(script.address);
      expect(isScript).to.be.true;
    });
    it("should revert if candidate address has not script role", async () => {
      await expect(
        arInstance.connect(addr1).ifScript(addr1.address)
      ).to.be.revertedWith(AccessErrorMsg.CALLER_NOT_SCRIPT);
    });
  });

  describe("check two roles", () => {
    it("should revert if candidate address has not admin or owner role", async () => {
      await expect(
        arInstance.connect(addr1).ifOwnerOrAdmin(addr1.address)
      ).to.be.revertedWith(AccessErrorMsg.CALLER_NOT_OWNER_OR_ADMIN);
    });

    it("should revert if candidate address has not admin or approvedContract role", async () => {
      await expect(
        arInstance.connect(addr1).ifAdminOrApprovedContract(addr1.address)
      ).to.be.revertedWith(
        AccessErrorMsg.CALLER_NOT_ADMIN_OR_APPROVED_CONTRACT
      );
    });

    it("should revert if candidate address has not admin or script role", async () => {
      await expect(
        arInstance.connect(addr1).ifAdminOrScript(addr1.address)
      ).to.be.revertedWith(AccessErrorMsg.CALLER_NOT_ADMIN_OR_SCRIPT);
    });
  });
});
