const hre = require("hardhat");
const { ethers } = require("hardhat");

async function deploy_landRocker() {
  console.log("Deploying LandRocker contract...");

  //deploy private sale contract
  const LandRocker = await ethers.getContractFactory("LandRocker");
  const landRockerInstance = await upgrades.deployProxy(
    LandRocker,
    [
      ""
    ],
    {
      kind: "uups",
      initializer: "__LandRocker_init",
    }
  );
  
  await landRockerInstance.deployed();

  console.log(
    "LandRocker Contract deployed to:",
    landRockerInstance.address
  );

  console.log(
    "---------------------------------------------------------",
  );

  // await hre.run("laika-sync", {
  //   contract: "LandRocker",
  //   address: landRockerInstance.address,
  // });

  return landRockerInstance.address;
}
module.exports = deploy_landRocker;
