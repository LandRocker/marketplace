const hre = require("hardhat");
const { ethers } = require("hardhat");

async function deploy_assetMarketplace(arInstance, lrtInstance, landRockerInstance, lrtVestingInstance) {

  //deploy AssetMarketplace
  const AssetMarketplace = await ethers.getContractFactory("AssetMarketplace");
  const assetMarketplaceInstance = await upgrades.deployProxy(AssetMarketplace,
    [arInstance.address, lrtInstance.address, landRockerInstance.address, lrtVestingInstance.address]
  ,
    {
      kind: "uups",
      initializer: "initializeAssetMarketplace",
    }
  );

  await assetMarketplaceInstance.deployed();

  return assetMarketplaceInstance;
}
module.exports = deploy_assetMarketplace;
 