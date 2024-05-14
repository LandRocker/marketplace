const hre = require("hardhat");
const { ethers } = require("hardhat");

async function deploy_lrt_distributor() {
  console.log("Deploying the LRT Distributor contract...");

  const LRTDistributor = await ethers.getContractFactory("LRTDistributor");
  const lrtDistributorInstance = await LRTDistributor.deploy(
    "0xf81787851069F394dFC744496BBaE29388502f17", //accessRestrictionAddress
    "0x0577a2d7242Ee55008fF20d75BeD4dbAebC2664A" //lrt
  );
  await lrtDistributorInstance.deployed();

  console.log("LRT Distributor deployed to:", lrtDistributorInstance.address);
  console.log("---------------------------------------------------------");
  // Let's add laika-sync task here!
  // await hre.run("laika-sync", {
  //   contract: "LRT",
  //   address: lrtInstance.address,
  // });

  return lrtDistributorInstance.address;
}
module.exports = deploy_lrt_distributor;
