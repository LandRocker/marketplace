const { expect } = require("chai");
const { ethers } = require("hardhat");

const {
  landRockerERC721Fixture,
} = require("./fixture/landRockerERC721.fixture");
const {
  landRockerERC721FactoryFixture,
} = require("./fixture/landRockerERC721Factory.fixture");
const {
  loadFixture,
  time,
} = require("@nomicfoundation/hardhat-network-helpers");
const { AccessErrorMsg, LR721Message } = require("./messages");

describe("LandRockerERC721", function () {
  let landRockerERC721Instance,
    arInstance,
    owner,
    admin,
    approvedContract,
    script,
    addr1,
    addr2,
    treasury,
    royaltyRecipient,
    factory;
  let baseURI =
    "https://srvs20.landrocker.io/game_service/bc/get/uniq/token/data?token_id=";
  let baseURI2 =
    "https://srvs20.landrocker.io/game_service/bc/get/uniq/token/data?token_id=";

  let zeroAddress = "0x0000000000000000000000000000000000000000";
  let category = ethers.utils.keccak256(
    ethers.utils.toUtf8Bytes("MARKETPLACE_721")
  );

  before(async function () {
    ({
      landRockerERC721Instance,
      //landRockerERC721FactoryInstance,
      arInstance,
      owner,
      admin,
      approvedContract,
      script,
      addr1,
      addr2,
      treasury,
      royaltyRecipient,
      factory,
    } = await loadFixture(landRockerERC721Fixture));
  });

  it("should have the correct name and symbol", async function () {
    expect(await landRockerERC721Instance.name()).to.equal("landRocker");
    expect(await landRockerERC721Instance.symbol()).to.equal("LR721");
  });

  it("should allow to set royalty", async function () {
    const royaltyTx = await landRockerERC721Instance
      .connect(admin)
      .setDefaultRoyalty(royaltyRecipient.address, 200);
    const tokenId = await landRockerERC721Instance
      .connect(approvedContract)
      .callStatic.safeMint(owner.address,category);

    const res = await landRockerERC721Instance.royaltyInfo(
      tokenId,
      ethers.utils.parseUnits("10", 18)
    );

    await expect(royaltyTx)
      .to.emit(landRockerERC721Instance, "RoyaltySet")
      .withArgs(royaltyRecipient.address, 200);
    expect(res[0]).to.equal(royaltyRecipient.address);
    expect(res[1]).to.equal(ethers.utils.parseUnits("2", 17));
  });

  it("should revert set royalty when caller is not admin", async function () {
    await expect(
      landRockerERC721Instance
        .connect(addr1)
        .setDefaultRoyalty(royaltyRecipient.address, 200)
    ).to.be.revertedWith(AccessErrorMsg.CALLER_NOT_ADMIN);
  });

  it("should revert if feeNumerator is less than or equal to 0", async function () {
    await expect(
      landRockerERC721Instance
        .connect(admin)
        .setDefaultRoyalty(royaltyRecipient.address, 0)
    ).to.be.revertedWith(LR721Message.IN_VALID_FEES);
  });

  it("should revert set royalty when reciver is zero address", async function () {
    await expect(
      landRockerERC721Instance
        .connect(admin)
        .setDefaultRoyalty(zeroAddress, 200)
    ).to.be.revertedWith(LR721Message.NOT_VALID_ADDRESS);
  });

  it("should revert set royalty when feeNumerator is greater than 10000", async function () {
    await expect(
      landRockerERC721Instance
        .connect(admin)
        .setDefaultRoyalty(royaltyRecipient.address, 10001)
    ).to.be.revertedWith(LR721Message.INVALID_FEE);
  });

  it("should revert royalty when reciver is zero address", async function () {
    await expect(
      landRockerERC721Instance
        .connect(admin)
        .setDefaultRoyalty(zeroAddress, 200)
    ).to.be.revertedWith(LR721Message.NOT_VALID_ADDRESS);
  });

  it("should not revert if reciver is a valid address", async function () {
    await expect(
      landRockerERC721Instance
        .connect(admin)
        .setDefaultRoyalty(royaltyRecipient.address, 200)
    ).to.not.be.revertedWith(LR721Message.NOT_VALID_ADDRESS);
  });

  it("should delete the default royalty if it is set ", async function () {
    const intialReciver = royaltyRecipient.address;
    const intialFee = 200;
    await landRockerERC721Instance
      .connect(admin)
      .setDefaultRoyalty(intialReciver, intialFee);

    const deleteRoyalty = await landRockerERC721Instance
      .connect(admin)
      .deleteDefaultRoyalty();

    const defaultRoyalty = await landRockerERC721Instance.royaltyInfo(0, 0);
    expect(defaultRoyalty[0]).to.equal(zeroAddress);
    expect(defaultRoyalty[1]).to.equal(0);

    await expect(deleteRoyalty).to.emit(
      landRockerERC721Instance,
      "RoyaltyDeleted"
    );
  });

  it("should set the correct base URI", async function () {
    expect(await landRockerERC721Instance.tokenBaseURI()).to.equal(baseURI);
  });

  it("should set the new base URI", async function () {
    const tx = await landRockerERC721Instance
      .connect(admin)
      .setBaseURI(baseURI2);
    expect(await landRockerERC721Instance.tokenBaseURI()).to.equal(baseURI2);
    await expect(tx)
      .to.emit(landRockerERC721Instance, "BaseUriSet")
      .withArgs(baseURI2);
  });

  it("should revert set baseUri when caller is not admin", async function () {
    await expect(
      landRockerERC721Instance.connect(owner).setBaseURI(baseURI2)
    ).to.be.revertedWith(AccessErrorMsg.CALLER_NOT_ADMIN);
  });

  it("should revert set Floor price when caller is not approved contract", async function () {
    const tokenId = await landRockerERC721Instance
      .connect(approvedContract)
      .callStatic.safeMint(owner.address,category);

    const tx = await landRockerERC721Instance
      .connect(approvedContract)
      .safeMint(owner.address,category);

    await expect(
      landRockerERC721Instance
        .connect(owner)
        .setFloorPrice(tokenId, ethers.utils.parseUnits("10", 18))
    ).to.be.revertedWith(AccessErrorMsg.CALLER_NOT_ADMIN_OR_APPROVED_CONTRACT);
  });

  it("should revert set baseUri when uri is not be valid", async function () {
    await expect(
      landRockerERC721Instance.connect(admin).setBaseURI("")
    ).to.be.revertedWith(LR721Message.INVALID_URI);
  });

  it("should mint a new token", async function () {
    const tokenId = await landRockerERC721Instance
      .connect(approvedContract)
      .callStatic.safeMint(owner.address,category);

    const tx = await landRockerERC721Instance
      .connect(approvedContract)
      .safeMint(owner.address,category);

    await expect(tx)
      .to.emit(landRockerERC721Instance, "Transfer")
      .withArgs(zeroAddress, owner.address, tokenId);

    expect(await landRockerERC721Instance.exists(tokenId)).to.be.true;
  });

  it("should revert safe mint when caller is not approvedContract", async function () {
    await expect(
      landRockerERC721Instance.connect(treasury).safeMint(owner.address,category)
    ).to.be.revertedWith(AccessErrorMsg.CALLER_NOT_APPROVED_CONTRACT);
  });

  it("should revert safe mint when dest address is zero address", async function () {
    await expect(
      landRockerERC721Instance.connect(approvedContract).safeMint(zeroAddress,category)
    ).to.be.revertedWith(LR721Message.NOT_VALID_ADDRESS);
  });

  it("should burn a token", async function () {
    const tokenId = await landRockerERC721Instance
      .connect(approvedContract)
      .callStatic.safeMint(owner.address,category);

    await landRockerERC721Instance
      .connect(approvedContract)
      .safeMint(owner.address,category);
    expect(await landRockerERC721Instance.exists(tokenId)).to.be.true;

    const tx = await landRockerERC721Instance
      .connect(approvedContract)
      .burn(tokenId);
    await expect(
      landRockerERC721Instance.connect(addr2).burn(tokenId)
    ).to.be.revertedWith(AccessErrorMsg.CALLER_NOT_APPROVED_CONTRACT);
    await expect(tx)
      .to.emit(landRockerERC721Instance, "Transfer")
      .withArgs(owner.address, zeroAddress, tokenId);
    // await expect(
    expect(await landRockerERC721Instance.exists(tokenId)).to.be.false;
  });

  it("should return the correct URI", async function () {
    const tokenId = await landRockerERC721Instance
      .connect(approvedContract)
      .callStatic.safeMint(owner.address,category);
    await landRockerERC721Instance
      .connect(approvedContract)
      .safeMint(owner.address,category);

    expect(owner.address).to.equal(
      await landRockerERC721Instance.ownerOf(tokenId)
    );

    const tokenURI = await landRockerERC721Instance.uri(tokenId);
    expect(tokenURI).to.equal(`${baseURI}${tokenId}`);
  });
});
