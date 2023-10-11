const hre = require("hardhat");
const { ethers } = require("hardhat");

async function deploy_lrt_distributor() {
  console.log("Deploying the LRT Distributor contract...");

  const LRTDistributor = await ethers.getContractFactory("LRTDistributor");
    const lrtDistributorInstance = await LRTDistributor.deploy(
      "0xB21bb1Ab0012236E3CF889FCcE00a4F3d9aF55c4",
      "0xcA498643614310935da320b0C1104305084DB4C7"
    );
    await lrtDistributorInstance.deployed();


  console.log("LRT Distributor deployed to:", lrtDistributorInstance.address);
  console.log(
    "---------------------------------------------------------",
  );
  // Let's add laika-sync task here!
  // await hre.run("laika-sync", {
  //   contract: "LRT",
  //   address: lrtInstance.address,
  // });

  return lrtDistributorInstance.address;
}
module.exports = deploy_lrt_distributor;
