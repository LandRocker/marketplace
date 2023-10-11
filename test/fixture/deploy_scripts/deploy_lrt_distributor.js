const hre = require("hardhat");
const { ethers } = require("hardhat");

async function deploy_lrt_distributor(arInstance,lrtInstance) {

  const LRTDistributor = await ethers.getContractFactory("LRTDistributor");
    const lrtDistributorInstance = await LRTDistributor.deploy(
      arInstance.address,
      lrtInstance.address
    );
    await lrtDistributorInstance.deployed();


  return lrtDistributorInstance;
}
module.exports = deploy_lrt_distributor;
