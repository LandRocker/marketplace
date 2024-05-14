const hre = require("hardhat");
const { ethers } = require("hardhat");

async function deploy_blueprintMarketplace(
  arInstance,
  lrtInstance,
  landRockerInstance
) {
  //deploy AssetMarketplace
  const BlueprintMarketplace = await ethers.getContractFactory(
    "BlueprintMarketplace"
  );
  const blueprintMarketplaceInstance = await upgrades.deployProxy(
    BlueprintMarketplace,
    [arInstance.address, lrtInstance.address, landRockerInstance.address],
    {
      kind: "uups",
      initializer: "initializeBlueprintMarketplace",
    }
  );

  await blueprintMarketplaceInstance.deployed();

  return blueprintMarketplaceInstance;
}
module.exports = deploy_blueprintMarketplace;
