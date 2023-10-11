const hre = require("hardhat");
const { ethers } = require("hardhat");

async function deploy_minted1155_Marketplace() {
  console.log("Deploying Minted1155Marketplace contract...");

  const Minted1155Marketplace = await ethers.getContractFactory("Minted1155Marketplace");
  const minted1155MarketplaceInstance = await upgrades.deployProxy(
    Minted1155Marketplace,
    [
      "",
      "",
      "",
      "",
      ""
    ],
    {
      kind: "uups",
      initializer: "__Minted1155Marketplace_init",
    }
  );
 
  await minted1155MarketplaceInstance.deployed();
  console.log("Minted1155Marketplace Contract deployed to:", minted1155MarketplaceInstance.address);
    console.log("---------------------------------------------------------");

  // await hre.run("laika-sync", {
  //   contract: "LRTPreSale",
  //   address: lrtPreSaleInstance.address,
  // });

  return minted1155MarketplaceInstance.address;
}
module.exports = deploy_minted1155_Marketplace;
