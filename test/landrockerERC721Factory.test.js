const { expect } = require("chai");
const { ethers } = require("hardhat");
// const {
//   landRockerERC721Fixture,
// } = require("./fixture/landRockerERC721.fixture");
const {
  landRockerERC721FactoryFixture,
} = require("./fixture/landRockerERC721Factory.fixture");
const {
  loadFixture,
  time,
} = require("@nomicfoundation/hardhat-network-helpers");
const { AccessErrorMsg, LR721Message } = require("./messages");

describe("LandRockerERC721Factory", function () {
  let landRockerERC721Instance,
    landRockerERC721FactoryInstance,
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
    "https://srvs20.landrocker.io/game_service/bc/get/uniq/token/data?token_id=";
  let baseURI2 =
    "https://srvs20.landrocker.io/game_service/bc/get/uniq/token/data?token_id=";

  let zeroAddress = "0x0000000000000000000000000000000000000000";

  let category = ethers.utils.keccak256(
    ethers.utils.toUtf8Bytes("MARKETPLACE_721")
  );


  // test to clone the smart contract
  before(async function () {
    ({
      nonMinted721MarketplaceInstance,
      landRockerERC721Instance,
      landRockerERC721FactoryInstance,
      arInstance,
      owner,
      admin,
      approvedContract,
      script,
      addr1,
      addr2,
      treasury,
      royaltyRecipient,
    } = await loadFixture(landRockerERC721FactoryFixture));
  });

  it("should create new clones", async () => {
    await landRockerERC721FactoryInstance
      .connect(admin)
      .createLandRockerERC721(
        "landRocker-one",
        "LR721-one",
        royaltyRecipient.address,
        200,
        "https://srvs20.landrocker.io/game_service/bc/get/uniq/token/data?token_id="
      );
    await landRockerERC721FactoryInstance
      .connect(admin)
      .createLandRockerERC721(
        "landRocker-two",
        "LR721-two",
        royaltyRecipient.address,
        200,
        "https://srvs20.landrocker.io/game_service/bc/get/uniq/token/data?token_id="
      );
    await landRockerERC721FactoryInstance
      .connect(admin)
      .createLandRockerERC721(
        "landRocker-three",
        "LR721-three",
        royaltyRecipient.address,
        200,
        "https://srvs20.landrocker.io/game_service/bc/get/uniq/token/data?token_id="
      );

    const landRockerERC721Instance1 = await landRockerERC721FactoryInstance
      .connect(admin)
      .landRockerERC721Clones(0);
    const landRockerERC721Instance2 =
      await landRockerERC721FactoryInstance.landRockerERC721Clones(1);
    const landRockerERC721Instance3 =
      await landRockerERC721FactoryInstance.landRockerERC721Clones(2);

    const cloneContract = await ethers.getContractFactory("LandRockerERC721");
    const clone1 = cloneContract.attach(landRockerERC721Instance1);
    const clone2 = cloneContract.attach(landRockerERC721Instance2);
    const clone3 = cloneContract.attach(landRockerERC721Instance3);


    expect(await clone1.name()).to.equal("landRocker-one");
    expect(await clone2.name()).to.equal("landRocker-two");
    expect(await clone3.name()).to.equal("landRocker-three");
  });

  it("should mint a new token", async function () {
    const landRockerERC721Instance1 =
      await landRockerERC721FactoryInstance.landRockerERC721Clones(0);

    const cloneContract = await ethers.getContractFactory("LandRockerERC721");
    const clone = cloneContract.attach(landRockerERC721Instance1);

    const tokenId = await clone
      .connect(approvedContract)
      .callStatic.safeMint(owner.address,category);

    const tx = await clone.connect(approvedContract).safeMint(owner.address,category);

    await expect(tx)
      .to.emit(clone, "Transfer")
      .withArgs(zeroAddress, owner.address, tokenId);

    expect(await clone.exists(tokenId)).to.be.true;
  });

  it("should revert safe mint when caller is not approvedContract", async function () {
    const landRockerERC721Instance1 =
      await landRockerERC721FactoryInstance.landRockerERC721Clones(0);

    const cloneContract = await ethers.getContractFactory("LandRockerERC721");
    const clone = cloneContract.attach(landRockerERC721Instance1);

    await expect(
      clone.connect(treasury).safeMint(owner.address,category)
    ).to.be.revertedWith(AccessErrorMsg.CALLER_NOT_APPROVED_CONTRACT);
  });
});
