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
      "",
      "",
      "",
      "",
      "",
    ],
    {
      kind: "uups",
      initializer: "__NonMinted721Marketplace_init",
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
