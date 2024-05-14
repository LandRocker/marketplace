const { ethers } = require("hardhat");

const deploy_access_restriction = require("./deploy_scripts/deploy_access_restriction");
const deploy_lrt = require("./deploy_scripts/deploy_lrt");
const deploy_landRocker = require("./deploy_scripts/deploy_landRocker");
const deploy_lrt_distributor = require("./deploy_scripts/deploy_lrt_distributor");
const deploy_lrt_vesting = require("./deploy_scripts/deploy_lrt_vesting");
const deploy_landRockerERC1155 = require("./deploy_scripts/deploy_landRockerERC1155");
const deploy_minted1155Marketplace = require("./deploy_scripts/deploy_minted1155Marketplace");
const deploy_landRockerERC1155Factory = require("./deploy_scripts/deploy_landRockerERC1155Factory");

let ADMIN_ROLE = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("ADMIN_ROLE"));

let APPROVED_CONTRACT_ROLE = ethers.utils.keccak256(
  ethers.utils.toUtf8Bytes("APPROVED_CONTRACT_ROLE")
);
let SCRIPT_ROLE = ethers.utils.keccak256(
  ethers.utils.toUtf8Bytes("SCRIPT_ROLE")
);

let DISTRIBUTOR_ROLE = ethers.utils.keccak256(
  ethers.utils.toUtf8Bytes("DISTRIBUTOR_ROLE")
);

let WERT_ROLE = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("WERT_ROLE"));

async function minted1155MarketplaceFixture() {
  const [
    owner,
    admin,
    minter,
    distributor,
    wert,
    vesting_manager,
    approvedContract,
    script,
    addr1,
    addr2,
    treasury,
    royaltyRecipient,
    factory,
  ] = await ethers.getSigners();

  const arInstance = await deploy_access_restriction(owner);

  await arInstance.grantRole(ADMIN_ROLE, admin.address);
  await arInstance.grantRole(APPROVED_CONTRACT_ROLE, approvedContract.address);
  await arInstance.grantRole(WERT_ROLE, wert.address);
  await arInstance.grantRole(SCRIPT_ROLE, script.address);
  await arInstance.grantRole(DISTRIBUTOR_ROLE, distributor.address);

  const lrtInstance = await deploy_lrt(arInstance);
  const landRockerERC1155Instance = await deploy_landRockerERC1155();
  const landRockerInstance = await deploy_landRocker(arInstance);
  const lrtDistributorInstance = await deploy_lrt_distributor(
    arInstance,
    lrtInstance
  );
  const lrtVestingInstance = await deploy_lrt_vesting(
    lrtDistributorInstance,
    arInstance
  );

  await landRockerInstance.connect(admin).setSystemFee(1300);
  await landRockerInstance.connect(admin).setTreasuryAddress(treasury.address);
  await landRockerInstance
    .connect(admin)
    .setTreasuryAddress1155(treasury.address);

  // await landRockerERC1155Instance
  //   .connect(admin)
  //   .setDefaultRoyalty(royaltyRecipient.address, 200);

  const landRockerERC1155FactoryInstance =
    await deploy_landRockerERC1155Factory(arInstance);

  await landRockerERC1155FactoryInstance
    .connect(admin)
    .setImplementationAddress(landRockerERC1155Instance.address);

  await landRockerERC1155FactoryInstance
    .connect(admin)
    .createLandRockerERC1155(
      "landRocker-nonMinted-1",
      "LR1155-nonMinted-1",
      royaltyRecipient.address,
      200,
      "https://srvs20.landrocker.io/game_service/bc/get/uniq/token/data?token_id="
    );

  await landRockerERC1155FactoryInstance
    .connect(admin)
    .createLandRockerERC1155(
      "landRocker-nonMinted-2",
      "LR1155-nonMinted-2",
      royaltyRecipient.address,
      200,
      "https://srvs20.landrocker.io/game_service/bc/get/uniq/token/data?token_id="
    );

  const collection_one =
    await landRockerERC1155FactoryInstance.landRockerERC1155Clones(0);

  const collection_two =
    await landRockerERC1155FactoryInstance.landRockerERC1155Clones(1);

  const minted1155MarketplaceInstance = await deploy_minted1155Marketplace(
    arInstance,
    lrtInstance,
    landRockerInstance
  );

  const cloneContract = await ethers.getContractFactory("LandRockerERC1155");
  const clone1 = cloneContract.attach(collection_one);
  const clone2 = cloneContract.attach(collection_two);

  await minted1155MarketplaceInstance
    .connect(admin)
    .setLandRockerCollection(clone1.address, true);

  await minted1155MarketplaceInstance
    .connect(admin)
    .setLandRockerCollection(clone2.address, true);

  await arInstance.grantRole(
    APPROVED_CONTRACT_ROLE,
    minted1155MarketplaceInstance.address
  );

  return {
    minted1155MarketplaceInstance,
    landRockerInstance,
    landRockerERC1155Instance,
    lrtInstance,
    arInstance,
    owner,
    admin,
    minter,
    distributor,
    approvedContract,
    script,
    addr1,
    addr2,
    treasury,
    royaltyRecipient,
    factory,
    lrtVestingInstance,
    collection_one,
    collection_two,
  };
}

module.exports = {
  minted1155MarketplaceFixture,
};
