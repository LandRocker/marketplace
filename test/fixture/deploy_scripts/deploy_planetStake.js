const hre = require("hardhat");
const { ethers, upgrades } = require("hardhat");

async function deploy_planetStakeInstance(
  landRockerERC1155Instance,
  arInstance,
  lrtInstance
) {
  //deploy PlanetStake
  const PlanetStake = await ethers.getContractFactory("PlanetStake");
  const planetStakeInstance = await upgrades.deployProxy(
    PlanetStake,
    [
      landRockerERC1155Instance.address,
      arInstance.address,
      lrtInstance.address,
    ],
    {
      kind: "uups",
      initializer: "initializePlanetStake",
    }
  );

  await planetStakeInstance.deployed();

  return planetStakeInstance;
}
module.exports = deploy_planetStakeInstance;
