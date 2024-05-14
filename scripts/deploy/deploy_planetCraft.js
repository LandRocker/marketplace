const hre = require("hardhat");
const { ethers } = require("hardhat");

async function deploy_planetCraft() {
  console.log("Deploying PlanetCraft contract...");

  const PlanetCraft = await ethers.getContractFactory("PlanetCraft");
  const planetCraftInstance = await upgrades.deployProxy(
    PlanetCraft,
    [
      "0xf81787851069F394dFC744496BBaE29388502f17", //arInstance
      "0x0577a2d7242Ee55008fF20d75BeD4dbAebC2664A", //lrtInstance
      "0x712ad1a067d79048d3d7F965B9faD97B14EF6654", //landRockerInstance
      "0x51Cf5aEbB04d04e2ee6F92B513FCB0c2f1Dff0cd", //lrtVestingInstance
    ],
    {
      kind: "uups",
      initializer: "initializePlanetCraft",
    }
  );

  await planetCraftInstance.deployed();
  console.log("PlanetCraft Contract deployed to:", planetCraftInstance.address);
  console.log("---------------------------------------------------------");

  return planetCraftInstance.address;
}
module.exports = deploy_planetCraft;
