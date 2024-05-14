const { ethers } = require("hardhat");
const { accessRestrictionFixture } = require("./accessRestriction.fixture");
const deploy_landRocker = require("./deploy_scripts/deploy_landRocker");

async function landRockerFixture() {
  const {
    arInstance,
    owner,
    admin,
    minter,
    approvedContract,
    script,
    addr1,
    addr2,
    treasury,
    royaltyRecipient,
    factory,
  } = await accessRestrictionFixture();

 // const LandRocker = await ethers.getContractFactory("LandRocker");
  const landRockerInstance = await deploy_landRocker(arInstance);
  //await landRockerInstance.deployed();

  await landRockerInstance.connect(admin).setSystemFee(1300);
  await landRockerInstance.connect(admin).setTreasuryAddress(treasury.address);
  await landRockerInstance
    .connect(admin)
    .setTreasuryAddress721(treasury.address);
  await landRockerInstance
    .connect(admin)
    .setTreasuryAddress1155(treasury.address);

  return {
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
    royaltyRecipient,
    factory,
  };
}

module.exports = {
  landRockerFixture
};
