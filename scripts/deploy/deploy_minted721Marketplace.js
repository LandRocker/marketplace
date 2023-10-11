const hre = require("hardhat");
const { ethers } = require("hardhat");

async function deploy_minted721_Marketplace() {
  console.log("Deploying Minted1155Marketplace contract...");

  const Minted721Marketplace = await ethers.getContractFactory(
    "Minted721Marketplace"
  );
  const minted721MarketplaceInstance = await upgrades.deployProxy(
    Minted721Marketplace,
    [
      "0x7A3c66F2F3C16AEbB69373e244846F12eaD9ADe4",
      "0xB21bb1Ab0012236E3CF889FCcE00a4F3d9aF55c4",
      "0xcA498643614310935da320b0C1104305084DB4C7",
      "0x5FEE19700a720008B5f7Df7E09A9cABa2BD0b95e",
      "0x6f4592838fcE61ed1eFCf54E3545530a7b0a822C",
    ],
    {
      kind: "uups",
      initializer: "__Minted721Marketplace_init",
    }
  );

  await minted721MarketplaceInstance.deployed();
  console.log(
    "Minted721Marketplace Contract deployed to:",
    minted721MarketplaceInstance.address
  );
  console.log("---------------------------------------------------------");

  return minted721MarketplaceInstance.address;
}
module.exports = deploy_minted721_Marketplace;
