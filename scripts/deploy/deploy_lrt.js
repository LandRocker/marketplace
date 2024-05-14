const hre = require("hardhat");
const { ethers } = require("hardhat");

async function deploy_lrt() {
  console.log("Deploying the LRT contract...");

  //deploy LRT token
  const LRT = await ethers.getContractFactory("LRT");
  const lrtInstance = await LRT.deploy(
    "0xf81787851069F394dFC744496BBaE29388502f17" //accessRestriction
  );
  await lrtInstance.deployed();

  console.log("LRT Token Contract deployed to:", lrtInstance.address);
  console.log("---------------------------------------------------------");
  // Let's add laika-sync task here!
  // await hre.run("laika-sync", {
  //   contract: "LRT",
  //   address: lrtInstance.address,
  // });

  return lrtInstance.address;
}
module.exports = deploy_lrt;
