const hre = require("hardhat");
const { ethers } = require("hardhat");

async function deploy_nonMinted1155_Marketplace() {
  console.log("Deploying NonMinted1155Marketplace contract...");

  const NonMinted1155Marketplace = await ethers.getContractFactory(
    "NonMinted1155Marketplace"
  );
  const nonMinted1155MarketplaceInstance = await upgrades.deployProxy(
    NonMinted1155Marketplace,
    [
      "0xf81787851069F394dFC744496BBaE29388502f17", //arInstance
      "0x0577a2d7242Ee55008fF20d75BeD4dbAebC2664A", //lrtInstance
      "0x6299Ccfb88CB7146259582Cd60d2B8d94DfA4E0f", //landRockerInstance
      "0x51Cf5aEbB04d04e2ee6F92B513FCB0c2f1Dff0cd" //lrtVestingInstance
    ],
    {
      kind: "uups",
      initializer: "initializeNonMinted1155Marketplace",
    }
  );

  await nonMinted1155MarketplaceInstance.deployed();
  console.log(
    "NonMinted1155Marketplace Contract deployed to:",
    nonMinted1155MarketplaceInstance.address
  );
  console.log("---------------------------------------------------------");

  // await hre.run("laika-sync", {
  //   contract: "LRTPreSale",
  //   address: lrtPreSaleInstance.address,
  // });

  return nonMinted1155MarketplaceInstance.address;
}
module.exports = deploy_nonMinted1155_Marketplace;
