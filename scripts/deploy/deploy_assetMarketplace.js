const hre = require("hardhat");
const { ethers } = require("hardhat");

async function deploy_Asset_Marketplace() {
  console.log("Deploying AssetMarketplace contract...");

  const AssetMarketplace = await ethers.getContractFactory("AssetMarketplace");
  const assetMarketplaceInstance = await upgrades.deployProxy(
    AssetMarketplace,
    [
      "0xf81787851069F394dFC744496BBaE29388502f17", //arInstance
      "0x0577a2d7242Ee55008fF20d75BeD4dbAebC2664A", //lrtInstance
      "0x712ad1a067d79048d3d7F965B9faD97B14EF6654", //landRockerInstance
      "0x51Cf5aEbB04d04e2ee6F92B513FCB0c2f1Dff0cd", //lrtVestingInstance
    ],
    {
      kind: "uups",
      initializer: "initializeAssetMarketplace",
    }
  );

  await assetMarketplaceInstance.deployed();
  console.log(
    "AssetMarketplace Contract deployed to:",
    assetMarketplaceInstance.address
  );
  console.log("---------------------------------------------------------");

  // await hre.run("laika-sync", {
  //   contract: "LRTPreSale",
  //   address: lrtPreSaleInstance.address,
  // });

  return assetMarketplaceInstance.address;
}
module.exports = deploy_Asset_Marketplace;
