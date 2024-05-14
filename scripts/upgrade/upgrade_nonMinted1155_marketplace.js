const hre = require("hardhat");
const { ethers, upgrades } = require("hardhat");

async function upgrade_NonMinted1155_Marketplace() {
  console.log("Upgrading NonMinted1155 contract...");

  const NonMinted1155Marketplace = await ethers.getContractFactory(
    "NonMinted1155Marketplace"
  );

  const upgradedContract = await upgrades.upgradeProxy(
    "0x2B6253F3cb9978B4047f93E59949a0075318B8F5", //proxy address
    NonMinted1155Marketplace //new implementation
  );

  // await upgrades.forceImport(
  //   "0x2B6253F3cb9978B4047f93E59949a0075318B8F5",
  //   NonMinted1155Marketplace,
  //   {
  //     kind: "uups",
  //   }
  // );

  console.log(
    "upgraded NonMinted1155 Contract deployed to:",
    upgradedContract.address
  );
  console.log("---------------------------------------------------------");

  // await hre.run("laika-sync", {
  //   contract: "LRTPreSale",
  //   address: lrtPreSaleInstance.address,
  // });

  return upgradedContract.address;
}
module.exports = upgrade_NonMinted1155_Marketplace;
