const { ethers } = require("hardhat"); 

const deploy_access_restriction = require("./deploy_scripts/deploy_access_restriction");
const deploy_lrt = require("./deploy_scripts/deploy_lrt");
const deploy_landRocker = require("./deploy_scripts/deploy_landRocker");
const deploy_lrt_distributor = require("./deploy_scripts/deploy_lrt_distributor");
const deploy_lrtVesting = require("./deploy_scripts/deploy_lrt_vesting");
const deploy_assetMarketplace = require("./deploy_scripts/deploy_assetMarketplace");


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

async function assetMarketplaceFixture() {

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
  const lrtDistributorInstance = await deploy_lrt_distributor(arInstance, lrtInstance);
  const landRockerInstance = await deploy_landRocker(arInstance); 
  const lrtVestingInstance = await deploy_lrtVesting(lrtDistributorInstance, arInstance); 

  await landRockerInstance.connect(admin).setSystemFee(1300);
  await landRockerInstance.connect(admin).setTreasuryAddress(treasury.address);
  await landRockerInstance.connect(admin).setTreasuryAddress1155(treasury.address);
  await landRockerInstance.connect(admin).setTreasuryAddress721(treasury.address);
  
  const assetMarketplaceInstance = await deploy_assetMarketplace(
    arInstance,
    lrtInstance,
    landRockerInstance,
    lrtVestingInstance
    );
    
  await arInstance.grantRole(
    APPROVED_CONTRACT_ROLE,
    assetMarketplaceInstance.address
  );

  await arInstance.grantRole(
    APPROVED_CONTRACT_ROLE,
    lrtVestingInstance.address
  );

  return {
    assetMarketplaceInstance,
    landRockerInstance,
    lrtVestingInstance,
    lrtInstance,
    arInstance,
    owner,
    admin,
    distributor,
    minter,
    approvedContract,
    script,
    addr1,
    addr2,
    treasury,  
  };
}

module.exports = {
  assetMarketplaceFixture
};
