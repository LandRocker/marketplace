const { ethers } = require("hardhat");
const { accessRestrictionFixture } = require("./accessRestriction.fixture");
const deploy_lrt = require("./deploy_scripts/deploy_lrt");
const deploy_access_restriction = require("./deploy_scripts/deploy_access_restriction");


let DISTRIBUTOR_ROLE = ethers.utils.keccak256(
  ethers.utils.toUtf8Bytes("DISTRIBUTOR_ROLE")
);


async function lrtFixture() {
  const [
    owner,
    distributor,
    addr1
  
  ] = await ethers.getSigners();

  const arInstance = await deploy_access_restriction(owner);
  await arInstance.grantRole(DISTRIBUTOR_ROLE, distributor.address);

  const lrtInstance = await deploy_lrt(arInstance)
  
  return {
    lrtInstance,
    arInstance,
    owner,
    distributor,
    addr1,
  };

}

module.exports = {
  lrtFixture,
};
