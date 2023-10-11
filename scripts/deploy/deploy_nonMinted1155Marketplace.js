const hre = require("hardhat");
const { ethers } = require("hardhat");

async function deploy_nonMinted1155_Marketplace() {
  console.log("Deploying NonMinted1155Marketplace contract...");

  const NonMinted1155Marketplace = await ethers.getContractFactory("NonMinted1155Marketplace");
  const nonMinted1155MarketplaceInstance = await upgrades.deployProxy(
    NonMinted1155Marketplace,
    [
      "",
      "",
      "",
      "",
      ""
    ],
    {
      kind: "uups",
      initializer: "__NonMinted1155Marketplace_init",
    }
  );  
 
  await nonMinted1155MarketplaceInstance.deployed();
  console.log("NonMinted1155Marketplace Contract deployed to:", nonMinted1155MarketplaceInstance.address);
    console.log("---------------------------------------------------------");

  // await hre.run("laika-sync", {
  //   contract: "LRTPreSale",
  //   address: lrtPreSaleInstance.address,
  // });

  return nonMinted1155MarketplaceInstance.address;
}
module.exports = deploy_nonMinted1155_Marketplace;
