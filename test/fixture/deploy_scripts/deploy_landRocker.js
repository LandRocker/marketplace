const hre = require("hardhat");
const { ethers } = require("hardhat");

async function deploy_landRocker(arInstance) {

  //deploy LandRocker
  const LandRocker = await ethers.getContractFactory("LandRocker");
  const landRockerInstance = await upgrades.deployProxy(
    LandRocker,
    [
      arInstance.address
    ],
    {
      kind: "uups",
      initializer: "initializeLandRocker",
    }
  );
 
  await landRockerInstance.deployed();

  return landRockerInstance;
}

module.exports = deploy_landRocker;
 