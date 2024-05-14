const hre = require("hardhat");
const { ethers } = require("hardhat");

async function deploy_landRockerERC721() {
  //deploy LandRockerERC721
  const LandRockerERC721 = await ethers.getContractFactory("LandRockerERC721");
  const landRockerERC721Instance = await LandRockerERC721.deploy();

  await landRockerERC721Instance.deployed();

  return landRockerERC721Instance;
}

module.exports = deploy_landRockerERC721;
