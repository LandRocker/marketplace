const { ethers } = require("hardhat");
const { lrtFixture } = require("./lrt.fixture");
const { accessRestrictionFixture } = require("./accessRestriction.fixture");
const deploy_access_restriction = require("./deploy_scripts/deploy_access_restriction");
const deploy_lrt = require("./deploy_scripts/deploy_lrt");
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

let lrtDistributorFixtureData;
async function lrtDistributorFixture() {
  const [owner, admin, distributor, approvedContract, script, addr1, addr2,factory] =
    await ethers.getSigners();

  const arInstance = await deploy_access_restriction(owner);

  await arInstance.grantRole(ADMIN_ROLE, admin.address);
  await arInstance.grantRole(SCRIPT_ROLE, script.address);
  await arInstance.grantRole(APPROVED_CONTRACT_ROLE, approvedContract.address);
  await arInstance.grantRole(DISTRIBUTOR_ROLE, distributor.address);

  const lrtInstance = await deploy_lrt(arInstance);
  const lrtDistributorInstance = await deploy_lrt_distributor(
    arInstance,
    lrtInstance
  );

  await arInstance.grantRole(DISTRIBUTOR_ROLE, lrtDistributorInstance.address);

  lrtDistributorFixtureData = {
    lrtDistributorInstance,
    lrtInstance,
    arInstance,
    owner,
    admin,
    distributor,
    approvedContract,
    script,
    addr1,
    addr2,
  };

  return lrtDistributorFixtureData;
}

module.exports = {
  lrtDistributorFixture,
};
