const { ethers } = require("hardhat");

const deploy_access_restriction = require("./deploy_scripts/deploy_access_restriction");
const deploy_landRockerERC721 = require("./deploy_scripts/deploy_landRockerERC721");
//const deploy_landRockerERC721Factory = require("./deploy_scripts/deploy_landRockerERC721Factory");

let ADMIN_ROLE = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("ADMIN_ROLE"));
let FACTORY_ROLE = ethers.utils.keccak256(
  ethers.utils.toUtf8Bytes("FACTORY_ROLE")
);
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

async function landRockerERC721Fixture() {
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
  await arInstance.grantRole(VESTING_MANAGER_ROLE, vesting_manager.address);

  const landRockerERC721Instance = await deploy_landRockerERC721();
  await landRockerERC721Instance
    .connect(owner)
    .erc721Init(
      "landRocker",
      "LR721",
      arInstance.address,
      royaltyRecipient.address,
      1000,
      "https://srvs20.landrocker.io/game_service/bc/get/uniq/token/data?token_id="
    );
  return {
    landRockerERC721Instance,
    //landRockerERC721FactoryInstance,
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
  landRockerERC721Fixture,
};
