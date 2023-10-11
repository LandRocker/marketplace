const hre = require("hardhat");
const { ethers, upgrades } = require("hardhat");

async function deploy_nonMinted721Marketplace(landRockerERC721Instance,arInstance, lrtInstance, 
    landRockerInstance, lrtVestingInstance) {

      
  //deploy Minted721Marketplace
  const NonMinted721Marketplace = await ethers.getContractFactory("NonMinted721Marketplace");
  const nonMinted721MarketplaceInstance = await upgrades.deployProxy(
    NonMinted721Marketplace,
    [
      landRockerERC721Instance.address,
      arInstance.address,
      lrtInstance.address,
      landRockerInstance.address,
      lrtVestingInstance.address
    ],
    {
      kind: "uups",
      initializer: "__NonMinted721Marketplace_init",
    }
 );  

  
  await nonMinted721MarketplaceInstance.deployed();

  return nonMinted721MarketplaceInstance;
}
module.exports = deploy_nonMinted721Marketplace;
 