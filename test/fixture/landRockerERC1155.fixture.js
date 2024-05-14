const { ethers } = require("hardhat");

const deploy_access_restriction = require("./deploy_scripts/deploy_access_restriction");
const deploy_landRockerERC1155 = require("./deploy_scripts/deploy_landRockerERC1155");

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

async function landRockerERC1155Fixture() {
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

  const landRockerERC1155Instance = await deploy_landRockerERC1155();

  await landRockerERC1155Instance
    .connect(owner)
    .erc1155Init(
      "landRocker",
      "LR1155",
      royaltyRecipient.address,
      200,
      "https://srvs20.landrocker.io/game_service/bc/get/token/data?token_id=",
      arInstance.address
    );

  await landRockerERC1155Instance
    .connect(admin)
    .setDefaultRoyalty(royaltyRecipient.address, 200);

  return {
    landRockerERC1155Instance,
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
  landRockerERC1155Fixture,
};
