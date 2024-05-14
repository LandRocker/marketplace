const { expect } = require("chai");
const { ethers } = require("hardhat");
// const {
//   landRockerERC1155Fixture,
// } = require("./fixture/landRockerERC1155.fixture");
const {
  landRockerERC1155FactoryFixture,
} = require("./fixture/landRockerERC1155Factory.fixture");
const {
  loadFixture,
  time,
} = require("@nomicfoundation/hardhat-network-helpers");
const { AccessErrorMsg, LR1155Message } = require("./messages");

describe("LandRockerERC1155Factory", function () {
  let landRockerERC1155Instance,
    landRockerERC1155FactoryInstance,
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
      nonMinted1155MarketplaceInstance,
      landRockerERC1155Instance,
      landRockerERC1155FactoryInstance,
      arInstance,
      owner,
      admin,
      approvedContract,
      script,
      addr1,
      addr2,
      treasury,
      royaltyRecipient,
    } = await loadFixture(landRockerERC1155FactoryFixture));
  });

  it("should create new clones", async () => {
    await landRockerERC1155FactoryInstance
      .connect(admin)
      .createLandRockerERC1155(
        "landRocker-one",
        "LR1155-one",
        royaltyRecipient.address,
        200,
        "https://srvs20.landrocker.io/game_service/bc/get/uniq/token/data?token_id="
      );
    await landRockerERC1155FactoryInstance
      .connect(admin)
      .createLandRockerERC1155(
        "landRocker-two",
        "LR1155-two",
        royaltyRecipient.address,
        200,
        "https://srvs20.landrocker.io/game_service/bc/get/uniq/token/data?token_id="
      );
    await landRockerERC1155FactoryInstance
      .connect(admin)
      .createLandRockerERC1155(
        "landRocker-three",
        "LR1155-three",
        royaltyRecipient.address,
        200,
        "https://srvs20.landrocker.io/game_service/bc/get/uniq/token/data?token_id="
      );

    const landRockerERC1155Instance1 = await landRockerERC1155FactoryInstance
      .connect(admin)
      .landRockerERC1155Clones(0);
    const landRockerERC1155Instance2 =
      await landRockerERC1155FactoryInstance.landRockerERC1155Clones(1);
    const landRockerERC1155Instance3 =
      await landRockerERC1155FactoryInstance.landRockerERC1155Clones(2);

    const cloneContract = await ethers.getContractFactory("LandRockerERC1155");
    const clone1 = cloneContract.attach(landRockerERC1155Instance1);
    const clone2 = cloneContract.attach(landRockerERC1155Instance2);
    const clone3 = cloneContract.attach(landRockerERC1155Instance3);


    expect(await clone1.name()).to.equal("landRocker-one");
    expect(await clone2.name()).to.equal("landRocker-two");
    expect(await clone3.name()).to.equal("landRocker-three");
  });

  it("should mint a new token", async function () {
    const landRockerERC1155Instance1 =
      await landRockerERC1155FactoryInstance.landRockerERC1155Clones(0);

    const cloneContract = await ethers.getContractFactory("LandRockerERC1155");
    const clone = cloneContract.attach(landRockerERC1155Instance1);

    const tokenId = await clone
      .connect(approvedContract)
      .callStatic.safeMint(owner.address, 10,category);

    const tx = await clone
      .connect(approvedContract)
      .safeMint(owner.address, 10,category);

    await expect(tx)
      .to.emit(clone, "TransferSingle")
      .withArgs(
        approvedContract.address,
        zeroAddress,
        owner.address,
        tokenId,
        10
      );

    expect(await clone.exists(tokenId)).to.be.true;
  });

  it("should revert safe mint when caller is not approvedContract", async function () {
    const landRockerERC1155Instance1 =
      await landRockerERC1155FactoryInstance.landRockerERC1155Clones(0);

    const cloneContract = await ethers.getContractFactory("LandRockerERC1155");
    const clone = cloneContract.attach(landRockerERC1155Instance1);

    await expect(
      clone.connect(treasury).safeMint(owner.address, 10,category)
    ).to.be.revertedWith(AccessErrorMsg.CALLER_NOT_APPROVED_CONTRACT);
  });
});
