const hre = require("hardhat");
const { ethers } = require("hardhat");

async function deploy_Asset_Marketplace() {
  console.log("Deploying AssetMarketplace contract...");

  const AssetMarketplace = await ethers.getContractFactory("AssetMarketplace");
  const assetMarketplaceInstance = await upgrades.deployProxy(AssetMarketplace,
    ["", 
    "", 
    "", 
    ""]
  ,
    {
      kind: "uups",
      initializer: "__AssetMarketplace_init",
    }
  );  

  await assetMarketplaceInstance.deployed();
  console.log("AssetMarketplace Contract deployed to:", assetMarketplaceInstance.address);
    console.log("---------------------------------------------------------");

  // await hre.run("laika-sync", {
  //   contract: "LRTPreSale",
  //   address: lrtPreSaleInstance.address,
  // });

  return assetMarketplaceInstance.address;
}
module.exports = deploy_Asset_Marketplace;
