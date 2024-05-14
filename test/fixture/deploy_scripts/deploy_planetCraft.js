// const hre = require("hardhat");
// const { ethers, upgrades } = require("hardhat");

// async function deploy_planetCraftInstance(
//   arInstance,
//   lrtInstance,
//   landRockerInstance,
//   lrtVestingInstance
// ) {
//   //deploy PlanetCraft
//   const PlanetCraft = await ethers.getContractFactory("PlanetCraft");
//   const planetCraftInstance = await upgrades.deployProxy(
//     PlanetCraft,
//     [
//       arInstance.address,
//       lrtInstance.address,
//       landRockerInstance.address,
//       lrtVestingInstance.address,
//     ],
//     {
//       kind: "uups",
//       initializer: "initializePlanetCraft",
//     }
//   );

//   await planetCraftInstance.deployed();

//   return planetCraftInstance;
// }
// module.exports = deploy_planetCraftInstance;
