const { ethers } = require("hardhat");
const { lrtFixture } = require("./lrt.fixture");
const { accessRestrictionFixture } = require("./accessRestriction.fixture");
const { lrtDistributorFixture } = require("./lrtDistributor.fixture");
const deploy_lrt_team_vesting = require("./deploy_scripts/deploy_lrt_team_vesting");
const deploy_access_restriction = require("./deploy_scripts/deploy_access_restriction");
const deploy_lrt = require("./deploy_scripts/deploy_lrt");
const deploy_lrt_distributor = require("./deploy_scripts/deploy_lrt_distributor");

let lrtVestingTeamFixtureData;
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
let AR_fixtureData; // Promise to store the fixture instance

async function lrtVestingTeamFixture() {
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

  const lrtInstance = await deploy_lrt(arInstance);
  const lrtDistributorInstance = await deploy_lrt_distributor(arInstance,lrtInstance);
  const lrtVestingTeamInstance = await deploy_lrt_team_vesting(lrtDistributorInstance,arInstance);

  await arInstance.grantRole(
    APPROVED_CONTRACT_ROLE,
    lrtVestingTeamInstance.address
  );

  await arInstance.grantRole(DISTRIBUTOR_ROLE, lrtDistributorInstance.address);

  lrtVestingTeamFixtureData = {
    lrtVestingTeamInstance,
    lrtDistributorInstance,
    lrtInstance,
    arInstance,
    owner,
    admin,
    approvedContract,
    script,
    addr1,
    addr2,
  };

  return lrtVestingTeamFixtureData;
}

module.exports = {
  lrtVestingTeamFixture,
};
