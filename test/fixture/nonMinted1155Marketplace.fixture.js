const { ethers } = require("hardhat");

const deploy_access_restriction = require("./deploy_scripts/deploy_access_restriction");
const deploy_lrt = require("./deploy_scripts/deploy_lrt");
const deploy_landRocker = require("./deploy_scripts/deploy_landRocker");
const deploy_lrt_distributor = require("./deploy_scripts/deploy_lrt_distributor");
const deploy_lrt_vesting = require("./deploy_scripts/deploy_lrt_vesting");
const deploy_landRockerERC1155 = require("./deploy_scripts/deploy_landRockerERC1155");
const deploy_nonMinted1155Marketplace = require("./deploy_scripts/deploy_nonMinted1155Marketplace");

let ADMIN_ROLE = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("ADMIN_ROLE"));
let FACTORY_ROLE = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("FACTORY_ROLE"));
let APPROVED_CONTRACT_ROLE = ethers.utils.keccak256(
  ethers.utils.toUtf8Bytes("APPROVED_CONTRACT_ROLE")
);
let SCRIPT_ROLE = ethers.utils.keccak256(
  ethers.utils.toUtf8Bytes("SCRIPT_ROLE")
);

let DISTRIBUTOR_ROLE = ethers.utils.keccak256(
  ethers.utils.toUtf8Bytes("DISTRIBUTOR_ROLE")
);
let VESTING_MANAGER_ROLE = ethers.utils.keccak256(
  ethers.utils.toUtf8Bytes("VESTING_MANAGER_ROLE")
);

let WERT_ROLE = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("WERT_ROLE"));
async function nonMinted1155MarketplaceFixture() {
  
  const [
    owner,
    admin,
    distributor,
    minter,
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
  await arInstance.grantRole(FACTORY_ROLE, factory.address);
  await arInstance.grantRole(APPROVED_CONTRACT_ROLE, approvedContract.address);
  await arInstance.grantRole(WERT_ROLE, wert.address);
  await arInstance.grantRole(SCRIPT_ROLE, script.address);
  await arInstance.grantRole(DISTRIBUTOR_ROLE, distributor.address);
  await arInstance.grantRole(VESTING_MANAGER_ROLE, vesting_manager.address);
 
  const landRockerERC1155Instance = await deploy_landRockerERC1155(arInstance,royaltyRecipient); 
  const lrtInstance = await deploy_lrt(arInstance);
  const landRockerInstance = await deploy_landRocker(arInstance); 
  const lrtDistributorInstance = await deploy_lrt_distributor(arInstance, lrtInstance);
  const lrtVestingInstance = await deploy_lrt_vesting(lrtDistributorInstance, arInstance);

  await landRockerInstance.connect(admin).setSystemFee(150);
  await landRockerInstance.connect(admin).setTreasuryAddress(treasury.address);
  await landRockerInstance.connect(admin).setTreasuryAddress1155(treasury.address);

  const nonMinted1155MarketplaceInstance = await deploy_nonMinted1155Marketplace(
    landRockerERC1155Instance,
    arInstance,
    lrtInstance,
    landRockerInstance,
    lrtVestingInstance
  );

  await arInstance.grantRole(
    APPROVED_CONTRACT_ROLE,
    nonMinted1155MarketplaceInstance.address
  );

  await arInstance.grantRole(
    APPROVED_CONTRACT_ROLE,
    lrtVestingInstance.address
  );

  return {
    nonMinted1155MarketplaceInstance,
    landRockerInstance,
    landRockerERC1155Instance,
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
    royaltyRecipient,
    factory,
    lrtVestingInstance,
  };
}

module.exports = {
  nonMinted1155MarketplaceFixture
};
