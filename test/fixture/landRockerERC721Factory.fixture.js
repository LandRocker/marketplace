const { ethers } = require("hardhat");

const deploy_access_restriction = require("./deploy_scripts/deploy_access_restriction");
const deploy_landRockerERC721 = require("./deploy_scripts/deploy_landRockerERC721");
const deploy_lrt = require("./deploy_scripts/deploy_lrt");
const deploy_landRocker = require("./deploy_scripts/deploy_landRocker");
const deploy_lrt_distributor = require("./deploy_scripts/deploy_lrt_distributor");
const deploy_lrt_vesting = require("./deploy_scripts/deploy_lrt_vesting");
const deploy_nonMinted721Marketplace = require("./deploy_scripts/deploy_nonMinted721Marketplace");
const deploy_landRockerERC721Factory = require("./deploy_scripts/deploy_landRockerERC721Factory");

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

async function landRockerERC721FactoryFixture() {
  const [
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
    factory,
  ] = await ethers.getSigners();

  const arInstance = await deploy_access_restriction(owner);

  await arInstance.grantRole(ADMIN_ROLE, admin.address);
  await arInstance.grantRole(APPROVED_CONTRACT_ROLE, approvedContract.address);
  await arInstance.grantRole(WERT_ROLE, wert.address);
  await arInstance.grantRole(SCRIPT_ROLE, script.address);
  await arInstance.grantRole(DISTRIBUTOR_ROLE, distributor.address); 

  const landRockerERC721Instance = await deploy_landRockerERC721();

  const lrtInstance = await deploy_lrt(arInstance);
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
    .setTreasuryAddress721(treasury.address);
  
  const landRockerERC721FactoryInstance = await deploy_landRockerERC721Factory(
    arInstance
  );
  
  const nonMinted721MarketplaceInstance = await deploy_nonMinted721Marketplace(
    landRockerERC721FactoryInstance,
    landRockerERC721Instance,
    arInstance,
    lrtInstance,
    landRockerInstance,
    lrtVestingInstance
  );  
  
 
  await landRockerERC721FactoryInstance
    .connect(admin)
    .setImplementationAddress(landRockerERC721Instance.address); 

  return {
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
    factory,
  };
}

module.exports = {
  landRockerERC721FactoryFixture,
};
