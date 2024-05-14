const { ethers } = require("hardhat");
const {
  time,
  loadFixture,
} = require("@nomicfoundation/hardhat-network-helpers");
const Helper = require("./../helper");

const deploy_access_restriction = require("./deploy_scripts/deploy_access_restriction");
const deploy_lrt = require("./deploy_scripts/deploy_lrt");
const deploy_landRocker = require("./deploy_scripts/deploy_landRocker");
const { lrtDistributorFixture } = require("./lrtDistributor.fixture");
const deploy_lrtVesting = require("./deploy_scripts/deploy_lrt_vesting");
const deploy_assetMarketplace = require("./deploy_scripts/deploy_assetMarketplace");
const deploy_lrtStaking = require("./deploy_scripts/deploy_lrtStaking");
const deploy_lrt_distributor = require("./deploy_scripts/deploy_lrt_distributor");

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

async function lrtStakingFixture() {
  const [
    owner,
    admin,
    distributor,
    approvedContract,
    script,
    addr1,
    addr2,
    treasury,
  ] = await ethers.getSigners();

  const arInstance = await deploy_access_restriction(owner);

  await arInstance.grantRole(ADMIN_ROLE, admin.address);
  await arInstance.grantRole(APPROVED_CONTRACT_ROLE, approvedContract.address);
  await arInstance.grantRole(SCRIPT_ROLE, script.address);
  await arInstance.grantRole(DISTRIBUTOR_ROLE, distributor.address);

  const lrtInstance = await deploy_lrt(arInstance);
  const lrtDistributorInstance = await deploy_lrt_distributor(
    arInstance,
    lrtInstance
  );
  const lrtStakingInstance = await deploy_lrtStaking(arInstance, lrtInstance);

  // await lrtStakingInstance.connect(admin).setAPR(1, 500);
  // await lrtStakingInstance.connect(admin).setAPR(3, 675);
  // await lrtStakingInstance.connect(admin).setAPR(6, 750);
  // await lrtStakingInstance.connect(admin).setAPR(9, 875);
  // await lrtStakingInstance.connect(admin).setAPR(12, 1000);

  await lrtStakingInstance
    .connect(admin)
    .setStakeCapacity(ethers.utils.parseUnits("100"));
  await lrtStakingInstance
    .connect(admin)
    .setThreshold(ethers.utils.parseUnits("10"));
  await lrtStakingInstance
    .connect(admin)
    .setDurationLimit(
      (await time.latest()) + (await Helper.convertToSeconds("months", 15))
    );

  await arInstance.grantRole(DISTRIBUTOR_ROLE, lrtDistributorInstance.address);
  return {
    lrtStakingInstance,
    lrtInstance,
    arInstance,
    owner,
    admin,
    distributor,
    approvedContract,
    script,
    addr1,
    addr2,
    treasury,
  };
}

module.exports = {
  lrtStakingFixture,
};
