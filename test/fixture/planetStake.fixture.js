const { ethers } = require("hardhat");

const deploy_planetStake = require("./deploy_scripts/deploy_planetStake");
const deploy_access_restriction = require("./deploy_scripts/deploy_access_restriction");
const deploy_landRockerERC1155 = require("./deploy_scripts/deploy_landRockerERC1155");
const deploy_lrt = require("./deploy_scripts/deploy_lrt");
const deploy_lrt_distributor = require("./deploy_scripts/deploy_lrt_distributor");

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

async function stakeFixture() {
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
  await arInstance.grantRole(FACTORY_ROLE, factory.address);
  await arInstance.grantRole(APPROVED_CONTRACT_ROLE, approvedContract.address);
  await arInstance.grantRole(WERT_ROLE, wert.address);
  await arInstance.grantRole(SCRIPT_ROLE, script.address);
  await arInstance.grantRole(DISTRIBUTOR_ROLE, distributor.address);
  await arInstance.grantRole(VESTING_MANAGER_ROLE, vesting_manager.address);

  const lrtInstance = await deploy_lrt(arInstance);
  const lrtDistributorInstance = await deploy_lrt_distributor(
    arInstance,
    lrtInstance
  );

  const landRockerERC1155Instance = await deploy_landRockerERC1155(
    arInstance,
    royaltyRecipient
  );
  const planetStakeInstance = await deploy_planetStake(
    landRockerERC1155Instance,
    arInstance,
    lrtDistributorInstance
  );

  await arInstance.grantRole(
    APPROVED_CONTRACT_ROLE,
    planetStakeInstance.address
  );

    await arInstance.grantRole(DISTRIBUTOR_ROLE, lrtDistributorInstance.address);




  const tokenId = await landRockerERC1155Instance
    .connect(approvedContract)
    .callStatic.safeMint(addr2.address, 10);

  await landRockerERC1155Instance
    .connect(approvedContract)
    .safeMint(addr2.address, 10);

  await landRockerERC1155Instance
    .connect(approvedContract)
    .safeMint(addr1.address, 10);

  await planetStakeInstance.connect(admin).setPlanetMiningCapacity(0, 20);
  await planetStakeInstance.connect(admin).setPlanetMiningCapacity(1, 20);

  await planetStakeInstance.connect(admin).setPlanetWhiteList(0);
  await planetStakeInstance.connect(admin).setPlanetWhiteList(1);

  return {
    planetStakeInstance,
    landRockerERC1155Instance,
    lrtDistributorInstance,
    lrtInstance,
    arInstance,
    admin,
    script,
    addr1,
    addr2,
  };
}

module.exports = {
  stakeFixture
};
