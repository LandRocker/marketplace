const hre = require("hardhat");
const { ethers, upgrades } = require("hardhat");

async function deploy_minted1155Marketplace(landRockerERC1155Instance,arInstance, lrtInstance, landRockerInstance, lrtVestingInstance) {

  //deploy Minted1155Marketplace
  const Minted1155Marketplace = await ethers.getContractFactory("Minted1155Marketplace");
  const minted1155MarketplaceInstance = await upgrades.deployProxy(
    Minted1155Marketplace,
    [
      landRockerERC1155Instance.address,
      arInstance.address,
      lrtInstance.address,
      landRockerInstance.address,
      lrtVestingInstance.address
    ],
    {
      kind: "uups",
      initializer: "__Minted1155Marketplace_init",
    }
 );

  // const minted1155MarketplaceInstance = await Minted1155Marketplace.deploy(
  //   landRockerERC1155Instance.address,
  //   arInstance.address,
  //   lrtInstance.address,
  //   landRockerInstance.address,
  //   lrtVestingInstance.address
  // );

  await minted1155MarketplaceInstance.deployed();

  return minted1155MarketplaceInstance;
}
module.exports = deploy_minted1155Marketplace;
 