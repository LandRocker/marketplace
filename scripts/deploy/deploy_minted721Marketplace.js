const hre = require("hardhat");
const { ethers } = require("hardhat");

async function deploy_minted721_Marketplace() {
  console.log("Deploying Minted721Marketplace contract...");

  const Minted721Marketplace = await ethers.getContractFactory(
    "Minted721Marketplace"
  );
  const minted721MarketplaceInstance = await upgrades.deployProxy(
    Minted721Marketplace,
    [
      "0xf81787851069F394dFC744496BBaE29388502f17", //arInstance
      "0x0577a2d7242Ee55008fF20d75BeD4dbAebC2664A", //lrtInstance
      "0x712ad1a067d79048d3d7F965B9faD97B14EF6654", //landRockerInstance
    ],
    {
      kind: "uups",
      initializer: "initilizeMinted721Marketplace",
    }
  );

  await minted721MarketplaceInstance.deployed();
  console.log(
    "Minted721Marketplace Contract deployed to:",
    minted721MarketplaceInstance.address
  );
  console.log("---------------------------------------------------------");

  return minted721MarketplaceInstance.address;
}
module.exports = deploy_minted721_Marketplace;
