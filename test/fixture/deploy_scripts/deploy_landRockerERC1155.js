const hre = require("hardhat");
const { ethers } = require("hardhat");

async function deploy_landRockerERC1155() {
  //deploy LandRockerERC1155
  const LandRockerERC1155 = await ethers.getContractFactory(
    "LandRockerERC1155"
  );
  //console.log(royaltyRecipient,"royaltyRecipient");
  const landRockerERC1155Instance = await LandRockerERC1155.deploy();

  await landRockerERC1155Instance.deployed();

  //console.log(landRockerERC1155Instance.address,".....");

  return landRockerERC1155Instance;
}

module.exports = deploy_landRockerERC1155;
