const hre = require("hardhat");
const { ethers } = require("hardhat");

async function deploy_planet_stake() {
  console.log("Deploying planetStake contract...");

  const PlanetStake = await ethers.getContractFactory("PlanetStake");
  const planetStakeInstance = await upgrades.deployProxy(
    PlanetStake,
    [
      "",
      "", 
      ""
    ],
    {
      kind: "uups",
      initializer: "__PlanetStake_init",
    }
  );
 
  await planetStakeInstance.deployed();

  console.log("PlanetStake Contract deployed to:", planetStakeInstance.address);
    console.log("---------------------------------------------------------");

  // await hre.run("laika-sync", {
  //   contract: "LRTPreSale",
  //   address: lrtPreSaleInstance.address,
  // });

  return planetStakeInstance.address;
}
module.exports = deploy_planet_stake;
