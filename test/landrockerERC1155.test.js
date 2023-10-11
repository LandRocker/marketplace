const { expect } = require("chai");
const { ethers } = require("hardhat");
const { landRockerERC1155Fixture } = require("./fixture/landRockerERC1155.fixture");
const {
  loadFixture,
  time,
} = require("@nomicfoundation/hardhat-network-helpers");
const { AccessErrorMsg, LR1155Message } = require("./messages");

describe("LandRockerERC1155", function () {
  let  landRockerERC1155Instance,
    arInstance,
    owner,
    admin,
    approvedContract,
    script,
    addr1,
    addr2,
    treasury,
    royaltyRecipient;
  let baseURI =
    "https://srvs20.landrocker.io/game_service/bc/get/token/data?token_id=";
  let baseURI2 =
    "https://srvs20.landrocker.io/game_service/bc/get/token/data?token_id=";

  let zeroAddress = "0x0000000000000000000000000000000000000000";

  before(async function () {
    ({
       landRockerERC1155Instance,
    arInstance,
    owner,
    admin,
    approvedContract,
    script,
    addr1,
    addr2,
    treasury,
    royaltyRecipient
    } = await loadFixture(landRockerERC1155Fixture));
  });

  it("should set the new base URI", async function () {
    const tx = await landRockerERC1155Instance
      .connect(admin)
      .setBaseURI(baseURI2);
    expect(await landRockerERC1155Instance.uri(0)).to.equal(`${baseURI2}0`);
    await expect(tx)
      .to.emit(landRockerERC1155Instance, "BaseUriSet")
      .withArgs(baseURI2);
  });

   it("should allow to set royalty", async function () {
    const royaltyTx = await landRockerERC1155Instance
      .connect(admin)
      .setDefaultRoyalty(royaltyRecipient.address, 250);
    const tokenId = await landRockerERC1155Instance
      .connect(approvedContract)
      .callStatic.safeMint(owner.address,10);

    const tx = await landRockerERC1155Instance
      .connect(approvedContract)
      .safeMint(owner.address,10);

    const res = await landRockerERC1155Instance.royaltyInfo(
      tokenId,
      ethers.utils.parseUnits("10", 18)
    );

    await expect(royaltyTx)
      .to.emit(landRockerERC1155Instance, "RoyaltySet")
      .withArgs(royaltyRecipient.address, 250);
    expect(res[0]).to.equal(royaltyRecipient.address);
    expect(res[1]).to.equal(ethers.utils.parseUnits("2.5", 17));

    await expect(
      landRockerERC1155Instance
        .connect(addr1)
        .setDefaultRoyalty(royaltyRecipient.address, 250)
    ).to.be.revertedWith(AccessErrorMsg.CALLER_NOT_ADMIN);
  });

  it("should revert set baseUri when caller is not admin", async function () {
    await expect(
      landRockerERC1155Instance.connect(owner).setBaseURI(baseURI2)
    ).to.be.revertedWith(AccessErrorMsg.CALLER_NOT_ADMIN);
  });

  it("should revert set baseUri when uri is not be valid", async function () {
    await expect(
      landRockerERC1155Instance.connect(admin).setBaseURI("")
    ).to.be.revertedWith(LR1155Message.INVALID_URI);
  });

  it("should safe mint a new token", async function () {
    const tokenId = await landRockerERC1155Instance
      .connect(approvedContract)
      .callStatic.safeMint(owner.address, 10);

    const tx = await landRockerERC1155Instance
      .connect(approvedContract)
      .safeMint(owner.address, 10);

    await expect(tx)
      .to.emit(landRockerERC1155Instance, "TransferSingle")
      .withArgs(
        approvedContract.address,
        zeroAddress,
        owner.address,
        tokenId,
        10
      );

    expect(await landRockerERC1155Instance.exists(tokenId)).to.be.true;
  });

  it("should revert safe mint when caller is not approvedContract", async function () {
    await expect(
      landRockerERC1155Instance.connect(treasury).safeMint(owner.address, 10)
    ).to.be.revertedWith(AccessErrorMsg.CALLER_NOT_APPROVED_CONTRACT);
  });

  it("should revert safe mint when dest address is zero address", async function () {
    await expect(
      landRockerERC1155Instance
        .connect(approvedContract)
        .safeMint(zeroAddress, 10)
    ).to.be.revertedWith(LR1155Message.NOT_VALID_ADDRESS);
  });

  it("should revert safe mint when amount is too low", async function () {
    await expect(
      landRockerERC1155Instance
        .connect(approvedContract)
        .safeMint(owner.address, 0)
    ).to.be.revertedWith(LR1155Message.LOW_AMOUNT);
  });
  
  it("should burn a token", async function () {
    const tokenId = await landRockerERC1155Instance
      .connect(approvedContract)
      .callStatic.safeMint(owner.address, 10);

    await landRockerERC1155Instance
      .connect(approvedContract)
      .safeMint(owner.address, 10);
    expect(await landRockerERC1155Instance.exists(tokenId)).to.be.true;

    console.log(ethers.utils.formatUnits(await landRockerERC1155Instance.balanceOf(owner.address, tokenId)),"burnnnnnn");
    const tx = await landRockerERC1155Instance
      .connect(approvedContract)
      .burn(owner.address, tokenId, 5);
    await expect(tx)
      .to.emit(landRockerERC1155Instance, "TransferSingle")
      .withArgs(
        approvedContract.address,
        owner.address,
        zeroAddress,
        tokenId,
        5
      );

    await expect(
      landRockerERC1155Instance.connect(addr2).burn(owner.address, tokenId, 5)
    ).to.be.revertedWith(AccessErrorMsg.CALLER_NOT_APPROVED_CONTRACT);
    
    expect(
      await landRockerERC1155Instance.balanceOf(owner.address, tokenId)
    ).to.equal(5);
  });

  it("should revert burn when source address is zero", async function () {
    const tokenId = await landRockerERC1155Instance
      .connect(approvedContract)
      .callStatic.safeMint(owner.address, 10);

    await landRockerERC1155Instance
      .connect(approvedContract)
      .safeMint(owner.address, 10);
    expect(await landRockerERC1155Instance.exists(tokenId)).to.be.true;

    await expect(
      landRockerERC1155Instance
        .connect(approvedContract)
        .burn(zeroAddress, tokenId, 5)
    ).to.be.revertedWith(LR1155Message.NOT_VALID_ADDRESS);
  });

  it("should revert burn amount is too low", async function () {
    const tokenId = await landRockerERC1155Instance
      .connect(approvedContract)
      .callStatic.safeMint(owner.address, 10);

    await landRockerERC1155Instance
      .connect(approvedContract)
      .safeMint(owner.address, 10);
    expect(await landRockerERC1155Instance.exists(tokenId)).to.be.true;

    await expect(
      landRockerERC1155Instance
        .connect(approvedContract)
        .burn(owner.address, tokenId, 0)
    ).to.be.revertedWith(LR1155Message.LOW_AMOUNT);
  });

  it("should revert burn amount is too much than owner balance", async function () {
    const tokenId = await landRockerERC1155Instance
      .connect(approvedContract)
      .callStatic.safeMint(owner.address, 10);

    await landRockerERC1155Instance
      .connect(approvedContract)
      .safeMint(owner.address, 10);
    expect(await landRockerERC1155Instance.exists(tokenId)).to.be.true;

    await expect(
      landRockerERC1155Instance
        .connect(approvedContract)
        .burn(owner.address, tokenId, 50)
    ).to.be.revertedWith(LR1155Message.INSUFFICIENT_BALANCE);
  });

  it("should return the correct URI", async function () {
    const tokenId = await landRockerERC1155Instance
      .connect(approvedContract)
      .callStatic.safeMint(owner.address, 10);

    await landRockerERC1155Instance
      .connect(approvedContract)
      .safeMint(owner.address, 10);

    const tokenURI = await landRockerERC1155Instance.uri(tokenId);
    expect(tokenURI).to.equal(`${baseURI}${tokenId}`);
  });

  ///////////////////////////////
  it("should mint a new token", async function () {
    const tokenId = await landRockerERC1155Instance
      .connect(approvedContract)
      .callStatic.safeMint(owner.address, 10);

    const tx = await landRockerERC1155Instance
      .connect(approvedContract)
      .mint(tokenId, owner.address, 10);

    await expect(tx)
      .to.emit(landRockerERC1155Instance, "TransferSingle")
      .withArgs(
        approvedContract.address,
        zeroAddress,
        owner.address,
        tokenId,
        10
      );

    expect(await landRockerERC1155Instance.exists(tokenId)).to.be.true;
  });

  it("should revert mint when caller is not approvedContract", async function () {
    const tokenId = await landRockerERC1155Instance
      .connect(approvedContract)
      .callStatic.safeMint(owner.address, 10);

    await expect(
      landRockerERC1155Instance.connect(treasury).mint(tokenId, owner.address, 10)
    ).to.be.revertedWith(AccessErrorMsg.CALLER_NOT_APPROVED_CONTRACT);
  });

  it("should revert mint when dest address is zero address", async function () {
    const tokenId = await landRockerERC1155Instance
      .connect(approvedContract)
      .callStatic.safeMint(owner.address, 10);

    await expect(
      landRockerERC1155Instance
        .connect(approvedContract)
        .mint(tokenId, zeroAddress, 10)
    ).to.be.revertedWith(LR1155Message.NOT_VALID_ADDRESS);
  });

  it("should revert mint when amount is too low", async function () {
    const tokenId = await landRockerERC1155Instance
      .connect(approvedContract)
      .callStatic.safeMint(owner.address, 10);

    await expect(
      landRockerERC1155Instance
        .connect(approvedContract)
        .mint(tokenId, owner.address, 0)
    ).to.be.revertedWith(LR1155Message.LOW_AMOUNT);
  });
  /////////////////////////////////
  // Add more tests as needed
});
