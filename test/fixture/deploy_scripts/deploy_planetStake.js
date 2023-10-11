const hre = require("hardhat");
const { ethers, upgrades } = require("hardhat");

async function deploy_planetStake(landRockerERC1155Instance,arInstance, lrtDistributorInstance) {

  //deploy PlanetStake
  const PlanetStake = await ethers.getContractFactory("PlanetStake");
  const planetStakeInstance = await upgrades.deployProxy(
    PlanetStake,
    [
      landRockerERC1155Instance.address,
      arInstance.address, 
      lrtDistributorInstance.address
    ],
    {
      kind: "uups",
      initializer: "__PlanetStake_init",
    }
  );
 
  await planetStakeInstance.deployed();

  return planetStakeInstance;
}
module.exports = deploy_planetStake;
 