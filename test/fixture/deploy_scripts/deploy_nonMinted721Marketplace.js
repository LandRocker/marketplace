const hre = require("hardhat");
const { ethers, upgrades } = require("hardhat");

async function deploy_nonMinted721Marketplace(
  arInstance,
  lrtInstance,
  landRockerInstance,
  lrtVestingInstance
  
) {
  const NonMinted721Marketplace = await ethers.getContractFactory(
    "NonMinted721Marketplace"
  );
  const nonMinted721MarketplaceInstance = await upgrades.deployProxy(
    NonMinted721Marketplace,
    [
      arInstance.address,
      lrtInstance.address,
      landRockerInstance.address,
      lrtVestingInstance.address
    ],
    {
      kind: "uups",
      initializer: "initializeNonMinted721Marketplace",
    }
  );

  await nonMinted721MarketplaceInstance.deployed();

  return nonMinted721MarketplaceInstance;
}
module.exports = deploy_nonMinted721Marketplace;
