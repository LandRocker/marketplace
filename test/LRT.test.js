const { expect } = require("chai");
const {
  time,
  loadFixture,
} = require("@nomicfoundation/hardhat-network-helpers");
const { lrtFixture } = require("./fixture");
const { AccessErrorMsg, LRTErrorMsg } = require("./messages");

describe("LRT contract", function () {
  let lrtInstance, arInstance, owner, distributor, addr1;
  const zeroAddress = "0x0000000000000000000000000000000000000000";

  beforeEach(async function () {
    ({ lrtInstance, arInstance, owner, distributor, addr1 } = await loadFixture(
      lrtFixture
    ));
  });

  describe("transfer token", function () {
    it("should allow to transfer token", async function () {
      const tx = await lrtInstance
        .connect(distributor)
        .transferToken(addr1.address, 100);
      expect(await lrtInstance.balanceOf(addr1.address)).to.equal(100);

      await expect(tx)
        .to.emit(lrtInstance, "Transfer")
        .withArgs(lrtInstance.address, addr1.address, 100);
    });

    it("should not allow to transfer token when caller is not distributor", async function () {
      await expect(
        lrtInstance.connect(addr1).transferToken(addr1.address, 100)
      ).to.be.revertedWith(AccessErrorMsg.CALLER_NOT_DISTRIBUTOR);
    });

    it("should not allow to transfer token when caller is not distributor", async function () {
      await expect(
        lrtInstance.connect(distributor).transferToken(owner.address, 100)
      ).to.be.revertedWith(LRTErrorMsg.INVALID_DEST);
    });

    it("should not allow to transfer tokens with zero amount", async function () {
      await expect(
        lrtInstance.connect(distributor).transferToken(addr1.address, 0)
      ).to.be.revertedWith(LRTErrorMsg.LRT_TOO_LOW_AMOUNT);
    });

    it("should not allow to transfer more tokens than max supply", async function () {
      const maxSupply = await lrtInstance.SUPPLY();
      await lrtInstance
        .connect(distributor)
        .transferToken(addr1.address, maxSupply);

      await expect(
        lrtInstance.connect(distributor).transferToken(addr1.address, 10)
      ).to.be.revertedWith(LRTErrorMsg.INSUFFICIENT_BALANCE);
    });
  });
});
