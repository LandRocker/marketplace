const hre = require("hardhat");
const { ethers, upgrades } = require("hardhat");

async function deploy_nonMinted1155Marketplace(
  arInstance,
  lrtInstance,
  landRockerInstance,
  lrtVestingInstance
) {
  //deploy Minted1155Marketplace
  const NonMinted1155Marketplace = await ethers.getContractFactory(
    "NonMinted1155Marketplace"
  );
  const nonMinted1155MarketplaceInstance = await upgrades.deployProxy(
    NonMinted1155Marketplace,
    [
      arInstance.address,
      lrtInstance.address,
      landRockerInstance.address,
      lrtVestingInstance.address
    ],
    {
      kind: "uups",
      initializer: "initializeNonMinted1155Marketplace",
    }
  );

  await nonMinted1155MarketplaceInstance.deployed();



  return nonMinted1155MarketplaceInstance;
}
module.exports = deploy_nonMinted1155Marketplace;
