const hre = require("hardhat");
const { ethers } = require("hardhat");

async function deploy_landRockerERC721Factory() {
  console.log("Deploying LandRockerERC721Factory contract...");

  const LandRockerERC721Factory = await ethers.getContractFactory("LandRockerERC721Factory");
  const landRockerERC721FactoryInstance = await LandRockerERC721Factory.deploy("");

  await landRockerERC721FactoryInstance.deployed();

  console.log(
    "LandRockerERC721Factory Contract deployed to:",
    landRockerERC721FactoryInstance.address
  );

  console.log(
    "---------------------------------------------------------",
  );
 
  return landRockerERC721FactoryInstance;
}
module.exports = deploy_landRockerERC721Factory;
