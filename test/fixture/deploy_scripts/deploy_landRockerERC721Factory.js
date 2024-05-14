const hre = require("hardhat");
const { ethers } = require("hardhat");

async function deploy_landRockerERC721Factory(arInstance) {
  //deploy LandRockerERC721Factory
  const LandRockerERC721Factory = await ethers.getContractFactory("LandRockerERC721Factory");
  const landRockerERC721FactoryInstance = await LandRockerERC721Factory.deploy(arInstance.address);
  await landRockerERC721FactoryInstance.deployed();
  return landRockerERC721FactoryInstance;
}

module.exports = deploy_landRockerERC721Factory;
 