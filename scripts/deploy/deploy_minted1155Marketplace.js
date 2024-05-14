const hre = require("hardhat");
const { ethers } = require("hardhat");

async function deploy_minted1155_Marketplace() {
  console.log("Deploying Minted1155Marketplace contract...");

  const Minted1155Marketplace = await ethers.getContractFactory(
    "Minted1155Marketplace"
  );
  const minted1155MarketplaceInstance = await upgrades.deployProxy(
    Minted1155Marketplace,
    [
      "0xf81787851069F394dFC744496BBaE29388502f17", //arInstance
      "0x0577a2d7242Ee55008fF20d75BeD4dbAebC2664A", //lrtInstance
      "0x712ad1a067d79048d3d7F965B9faD97B14EF6654", //landRockerInstance
    ],
    {
      kind: "uups",
      initializer: "initializeMinted1155Marketplace",
    }
  );

  await minted1155MarketplaceInstance.deployed();
  console.log(
    "Minted1155Marketplace Contract deployed to:",
    minted1155MarketplaceInstance.address
  );
  console.log("---------------------------------------------------------");

  // await hre.run("laika-sync", {
  //   contract: "LRTPreSale",
  //   address: lrtPreSaleInstance.address,
  // });

  return minted1155MarketplaceInstance.address;
}
module.exports = deploy_minted1155_Marketplace;
