const hre = require("hardhat");
const { ethers, upgrades } = require("hardhat");

async function upgrade_asset_Marketplace() {
  console.log("Upgrading AssetMarketplace contract...");

  const AssetMarketplace = await ethers.getContractFactory("AssetMarketplace");

    // const upgradedContract = await upgrades.upgradeProxy(
    //   "0xED4367A86832605Aed934F06Dd8c3E8A48E3Fd73", //proxy address
    //   AssetMarketplace //new implementation
    // );

    await upgrades.forceImport(
    "0x113c86b9B2e43002c4Cc2942E427Ee7E3dee7B08",
    AssetMarketplace,
    {
      kind: "uups",
    }
  );

  // await upgradedContract.initializeAssetMarketplace(
  //   "0x843840d993f5B6c65350a20990F2e304046454Bb", //arInstance
  //   "0xab4486f450E79011D6540D1fE9c4130d864966aa", //lrtInstance
  //   "0xC0819a5F95e958e27E15C5578fd011494fC5Ef16", //landRockerInstance
  //   "0x51D39dEaD7975b06788F55DC63574FC384b12907" //lrtVestingInstance
  // );

  // console.log(
  //   "upgraded AssetMarketplace Contract deployed to:",
  //   upgradedContract.address
  // );
  // console.log("---------------------------------------------------------");

  // await hre.run("laika-sync", {
  //   contract: "LRTPreSale",
  //   address: lrtPreSaleInstance.address,
  // });

  // return upgradedContract.address;
}
module.exports = upgrade_asset_Marketplace;
