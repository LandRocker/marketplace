const hre = require("hardhat");
const { ethers, upgrades } = require("hardhat");

async function deploy_minted721Marketplace(landRockerERC721Instance,arInstance, lrtInstance, landRockerInstance, lrtVestingInstance) {

  //deploy Minted721Marketplace
  const Minted721Marketplace = await ethers.getContractFactory("Minted721Marketplace");
  const minted721MarketplaceInstance = await upgrades.deployProxy(
    Minted721Marketplace,
    [
      landRockerERC721Instance.address,
      arInstance.address,
      lrtInstance.address,
      landRockerInstance.address,
      lrtVestingInstance.address
    ],
    {
      kind: "uups",
      initializer: "__Minted721Marketplace_init",
    }
 );

  await minted721MarketplaceInstance.deployed();

  return minted721MarketplaceInstance;
}
module.exports = deploy_minted721Marketplace;
 