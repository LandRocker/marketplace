const hre = require("hardhat");
const { ethers } = require("hardhat");

async function deploy_Blueprint_Marketplace() {
  console.log("Deploying BlueprintMarketplace contract...");

  const BlueprintMarketplace = await ethers.getContractFactory(
    "BlueprintMarketplace"
  );
  const blueprintMarketplaceInstance = await upgrades.deployProxy(
    BlueprintMarketplace,
    [
      "0xf81787851069F394dFC744496BBaE29388502f17", //arInstance
      "0x0577a2d7242Ee55008fF20d75BeD4dbAebC2664A", //lrtInstance
      "0x712ad1a067d79048d3d7F965B9faD97B14EF6654", //landRockerInstance
    ],
    {
      kind: "uups",
      initializer: "initializeBlueprintMarketplace",
    }
  );

  await blueprintMarketplaceInstance.deployed();
  console.log(
    "BlueprintMarketplace Contract deployed to:",
    blueprintMarketplaceInstance.address
  );
  console.log("---------------------------------------------------------");

  return blueprintMarketplaceInstance.address;
}
module.exports = deploy_Blueprint_Marketplace;
