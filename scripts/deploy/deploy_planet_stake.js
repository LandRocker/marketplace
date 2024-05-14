const hre = require("hardhat");
const { ethers } = require("hardhat");

async function deploy_planet_stake() {
  console.log("Deploying planet stake contract...");

  const PlanetStake = await ethers.getContractFactory("PlanetStake");
  const planetStakeInstance = await upgrades.deployProxy(
    PlanetStake,
    [
      "0x87BB4b82842d008280521d79fC2889bc5D277853", //landRockerERC1155Instance
      "0xf81787851069F394dFC744496BBaE29388502f17", //arInstance
      "0x0577a2d7242Ee55008fF20d75BeD4dbAebC2664A", //lrtInstance
    ],
    {
      kind: "uups",
      initializer: "initializePlanetStake",
    }
  );

  await planetStakeInstance.deployed();
  console.log("planetStake Contract deployed to:", planetStakeInstance.address);
  console.log("---------------------------------------------------------");

  // await hre.run("laika-sync", {
  //   contract: "LRTPreSale",
  //   address: lrtPreSaleInstance.address,
  // });

  return planetStakeInstance.address;
}
module.exports = deploy_planet_stake;
