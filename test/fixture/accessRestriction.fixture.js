const { ethers } = require("hardhat");
const deploy_access_restriction = require("./deploy_scripts/deploy_access_restriction");

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

let VESTING_MANAGER_ROLE = ethers.utils.keccak256(
  ethers.utils.toUtf8Bytes("VESTING_MANAGER_ROLE")
);

let WERT_ROLE = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("WERT_ROLE"));
let AR_fixtureData; // Promise to store the fixture instance

async function accessRestrictionFixture() {
  if (!AR_fixtureData) {
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

    
    const arInstance = await deploy_access_restriction(owner)

    await arInstance.grantRole(ADMIN_ROLE, admin.address);
    await arInstance.grantRole(
      APPROVED_CONTRACT_ROLE,
      approvedContract.address
    );
    await arInstance.grantRole(WERT_ROLE, wert.address);

    await arInstance.grantRole(SCRIPT_ROLE, script.address);

    await arInstance.grantRole(DISTRIBUTOR_ROLE, distributor.address); 
    
    await arInstance.grantRole(VESTING_MANAGER_ROLE, vesting_manager.address);

    AR_fixtureData = {
      arInstance,
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
    };
  }

  return AR_fixtureData;

  // return await arInstancePromise; // Await the promise to get the resolved value
}

module.exports = {
  accessRestrictionFixture,
};
