const hre = require("hardhat");
const { ethers, upgrades } = require("hardhat");

//landRockerERC721FactoryInstance,
async function deploy_minted721Marketplace(
  arInstance,
  lrtInstance,
  landRockerInstance,
  lrtVestingInstance
) {
  //deploy Minted721Marketplace
  const Minted721Marketplace = await ethers.getContractFactory(
    "Minted721Marketplace"
  );
  const minted721MarketplaceInstance = await upgrades.deployProxy(
    Minted721Marketplace,
    [arInstance.address, lrtInstance.address, landRockerInstance.address],
    {
      kind: "uups",
      initializer: "initilizeMinted721Marketplace",
    }
  );

  await minted721MarketplaceInstance.deployed();

  return minted721MarketplaceInstance;
}
module.exports = deploy_minted721Marketplace;
