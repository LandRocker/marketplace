const hre = require("hardhat");
const { ethers } = require("hardhat");

const deploy_access_restriction = require("./deploy/deploy_access_restriction");
const deploy_lrt = require("./deploy/deploy_lrt");
const deploy_lrt_distributor = require("./deploy/deploy_lrt_distributor");
const deploy_lrt_vesting = require("./deploy/deploy_lrt_vesting");
const deploy_pre_sale = require("./deploy/deploy_pre_sale");
// const setup_roles = require("./setup/setup_roles");
// const deploy_marketplace = require("./deploy/deploy_marketplace");
const deploy_planet_stake = require("./deploy/deploy_planet_stake");

const deploy_landRocker = require("./deploy/deploy_landrocker");
const deploy_Asset_Marketplace = require("./deploy/deploy_assetMarketplace");
const deploy_lr1155 = require("./deploy/deploy_lr1155");
const deploy_nonMinted1155_Marketplace = require("./deploy/deploy_nonMinted1155Marketplace");
const deploy_minted1155_Marketplace = require("./deploy/deploy_minted1155Marketplace");
const deploy_lr721_Factory = require("./deploy/deploy_landRockerERC721Factory");
const deploy_lr721 = require("./deploy/deploy_landRockerERC721");
const deploy_nonMinted721_Marketplace = require("./deploy/deploy_nonMinted721Marketplace");
const deploy_minted721_Marketplace = require("./deploy/deploy_minted721Marketplace");
const deploy_game = require("./deploy/deploy_game");
const deploy_planetCraft = require("./deploy/deploy_planetCraft");
const deploy_Blueprint_Marketplace = require("./deploy/deploy_blueprintMarketplace");
const upgrade_asset_Marketplace = require("./upgrade/upgrade_asset_marketplace");
const deploy_lrt_vesting_team = require("./deploy/deploy_lrt_vesting_team");
const upgrade_NonMinted1155_Marketplace = require("./upgrade/upgrade_nonMinted1155_marketplace");
const upgrade_landrocker = require("./upgrade/upgrade_landrocker");
const deploy_lrtStaking = require("./deploy/deploy_lrtStaking");

async function main() {
  // deploy contracts
  // await deploy_access_restriction();
  // await deploy_lrt();
  // await deploy_lrt_distributor();
  // await deploy_lrt_vesting();
  // await deploy_pre_sale();
  // await deploy_landRocker();
  // await deploy_Asset_Marketplace();
  await deploy_lr1155();
  await deploy_landRockerERC1155Factory();
  // await deploy_nft1155Pool();
  await deploy_nonMinted1155_Marketplace();
  await deploy_minted1155_Marketplace();
  await deploy_lr721();
  await deploy_lr721_Factory();
  // await deploy_nft721Pool();
  await deploy_nonMinted721_Marketplace();
  // await deploy_minted721_Marketplace();
  // await deploy_planetCraft();
  //  await deploy_planet_stake();
  // await deploy_game();
  // await deploy_Blueprint_Marketplace();
  // await deploy_lrt_vesting_team()
  // await upgrade_asset_Marketplace();
  // await upgrade_NonMinted1155_Marketplace();
  // await upgrade_landrocker();
  await deploy_lrtStaking();
}
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
