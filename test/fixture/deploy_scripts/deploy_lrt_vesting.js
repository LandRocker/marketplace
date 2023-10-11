const hre = require("hardhat");
const { ethers } = require("hardhat");

async function deploy_lrt_vesting(lrtDistributorInstance,arInstance) {

  //deploy LRTVesting
  const LRTVesting = await ethers.getContractFactory("LRTVesting");
  const lrtVestingInstance = await LRTVesting.deploy(
    lrtDistributorInstance.address,
    arInstance.address
  );

  await lrtVestingInstance.deployed();

  return lrtVestingInstance;
}
module.exports = deploy_lrt_vesting;

