const hre = require("hardhat");
const { ethers } = require("hardhat");

async function deploy_nonMinted721_Marketplace() {
  console.log("Deploying NonMinted721Marketplace contract...");

  const NonMinted721Marketplace = await ethers.getContractFactory(
    "NonMinted721Marketplace"
  );
  const nonMinted721MarketplaceInstance = await upgrades.deployProxy(
    NonMinted721Marketplace,
    [
      "0xf81787851069F394dFC744496BBaE29388502f17", //arInstance
      "0x0577a2d7242Ee55008fF20d75BeD4dbAebC2664A", //lrtInstance
      "0x6299Ccfb88CB7146259582Cd60d2B8d94DfA4E0f", //landRockerInstance
      "0x51Cf5aEbB04d04e2ee6F92B513FCB0c2f1Dff0cd"//lrtVestingInstance
    ],
    {
      kind: "uups",
      initializer: "initializeNonMinted721Marketplace",
    }
  );

  await nonMinted721MarketplaceInstance.deployed();
  console.log(
    "NonMinted721Marketplace Contract deployed to:",
    nonMinted721MarketplaceInstance.address
  );
  console.log("---------------------------------------------------------");

  return nonMinted721MarketplaceInstance.address;
}
module.exports = deploy_nonMinted721_Marketplace;
