// const { ethers } = require("hardhat");

// const deploy_access_restriction = require("./deploy_scripts/deploy_access_restriction");
// const deploy_lrt = require("./deploy_scripts/deploy_lrt");
// const deploy_landRocker = require("./deploy_scripts/deploy_landRocker");
// const deploy_lrt_distributor = require("./deploy_scripts/deploy_lrt_distributor");
// const deploy_lrt_vesting = require("./deploy_scripts/deploy_lrt_vesting");
// const deploy_landRockerERC1155 = require("./deploy_scripts/deploy_landRockerERC1155");
// const deploy_landRockerERC721 = require("./deploy_scripts/deploy_landRockerERC721");
// const deploy_landRockerERC721Factory = require("./deploy_scripts/deploy_landRockerERC721Factory");
// const deploy_landRockerERC1155Factory = require("./deploy_scripts/deploy_landRockerERC1155Factory");
// const deploy_planetCraft = require("./deploy_scripts/deploy_planetCraft");

// let ADMIN_ROLE = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("ADMIN_ROLE"));
// let APPROVED_CONTRACT_ROLE = ethers.utils.keccak256(
//   ethers.utils.toUtf8Bytes("APPROVED_CONTRACT_ROLE")
// );
// let SCRIPT_ROLE = ethers.utils.keccak256(
//   ethers.utils.toUtf8Bytes("SCRIPT_ROLE")
// );

// let DISTRIBUTOR_ROLE = ethers.utils.keccak256(
//   ethers.utils.toUtf8Bytes("DISTRIBUTOR_ROLE")
// );

// let WERT_ROLE = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("WERT_ROLE"));
// async function planetCraftFixture() {
//   const [
//     owner,
//     admin,
//     distributor,
//     minter,
//     wert,
//     vesting_manager,
//     approvedContract,
//     script,
//     addr1,
//     addr2,
//     treasury,
//     royaltyRecipient,
//     factory,
//   ] = await ethers.getSigners();

//   const arInstance = await deploy_access_restriction(owner);

//   await arInstance.grantRole(ADMIN_ROLE, admin.address);
//   await arInstance.grantRole(APPROVED_CONTRACT_ROLE, approvedContract.address);
//   await arInstance.grantRole(WERT_ROLE, wert.address);
//   await arInstance.grantRole(SCRIPT_ROLE, script.address);
//   await arInstance.grantRole(DISTRIBUTOR_ROLE, distributor.address);

//   const landRockerERC1155Instance = await deploy_landRockerERC1155();

//   const landRockerERC721Instance = await deploy_landRockerERC721();
//   const lrtInstance = await deploy_lrt(arInstance);
//   const landRockerInstance = await deploy_landRocker(arInstance);
//   const lrtDistributorInstance = await deploy_lrt_distributor(
//     arInstance,
//     lrtInstance
//   );
//   const lrtVestingInstance = await deploy_lrt_vesting(
//     lrtDistributorInstance,
//     arInstance
//   );

//   await landRockerInstance.connect(admin).setSystemFee(1300);
//   await landRockerInstance.connect(admin).setTreasuryAddress(treasury.address);
//   await landRockerInstance
//     .connect(admin)
//     .setTreasuryAddress1155(treasury.address);

//   const landRockerERC721FactoryInstance = await deploy_landRockerERC721Factory(
//     arInstance
//   );

//   await landRockerERC721FactoryInstance
//     .connect(admin)
//     .setImplementationAddress(landRockerERC721Instance.address);

//   await landRockerERC721FactoryInstance
//     .connect(admin)
//     .createLandRockerERC721(
//       "landRocker-nonMinted-1",
//       "LR721-nonMinted-1",
//       royaltyRecipient.address,
//       200,
//       "https://srvs20.landrocker.io/game_service/bc/get/uniq/token/data?token_id="
//     );

//   await landRockerERC721FactoryInstance
//     .connect(admin)
//     .createLandRockerERC721(
//       "landRocker-nonMinted-2",
//       "LR721-nonMinted-2",
//       royaltyRecipient.address,
//       200,
//       "https://srvs20.landrocker.io/game_service/bc/get/uniq/token/data?token_id="
//     );

//   const collection721_one =
//     await landRockerERC721FactoryInstance.landRockerERC721Clones(0);

//   const collection721_two =
//     await landRockerERC721FactoryInstance.landRockerERC721Clones(1);
//   //////////////////////1155//////////////////////////////////
//   const landRockerERC1155FactoryInstance =
//     await deploy_landRockerERC1155Factory(arInstance);

//   await landRockerERC1155FactoryInstance
//     .connect(admin)
//     .setImplementationAddress(landRockerERC1155Instance.address);

//   await landRockerERC1155FactoryInstance
//     .connect(admin)
//     .createLandRockerERC1155(
//       "landRocker-nonMinted-1",
//       "LR1155-nonMinted-1",
//       royaltyRecipient.address,
//       200,
//       "https://srvs20.landrocker.io/game_service/bc/get/uniq/token/data?token_id="
//     );

//   await landRockerERC1155FactoryInstance
//     .connect(admin)
//     .createLandRockerERC1155(
//       "landRocker-nonMinted-2",
//       "LR721-nonMinted-2",
//       royaltyRecipient.address,
//       200,
//       "https://srvs20.landrocker.io/game_service/bc/get/uniq/token/data?token_id="
//     );

//   const collection1155_one =
//     await landRockerERC1155FactoryInstance.landRockerERC1155Clones(0);

//   const collection1155_two =
//     await landRockerERC1155FactoryInstance.landRockerERC1155Clones(1);
//   ///////////////////////////////////////////////////////////
//   const planetCraftInstance = await deploy_planetCraft(
//     arInstance,
//     lrtInstance,
//     landRockerInstance,
//     lrtVestingInstance
//   );

//   await arInstance.grantRole(
//     APPROVED_CONTRACT_ROLE,
//     planetCraftInstance.address
//   );

//   await arInstance.grantRole(DISTRIBUTOR_ROLE, planetCraftInstance.address);

//   await arInstance.grantRole(DISTRIBUTOR_ROLE, lrtDistributorInstance.address);

//   await arInstance.grantRole(
//     APPROVED_CONTRACT_ROLE,
//     lrtVestingInstance.address
//   );

//   return {
//     planetCraftInstance,
//     landRockerInstance,
//     landRockerERC1155Instance,
//     landRockerERC721Instance,
//     lrtInstance,
//     lrtDistributorInstance,
//     arInstance,
//     owner,
//     admin,
//     distributor,
//     minter,
//     approvedContract,
//     script,
//     addr1,
//     addr2,
//     treasury,
//     royaltyRecipient,
//     factory,
//     lrtVestingInstance,
//     collection721_one,
//     collection721_two,
//     collection1155_one,
//     collection1155_two,
//   };
// }

// module.exports = {
//   planetCraftFixture,
// };
