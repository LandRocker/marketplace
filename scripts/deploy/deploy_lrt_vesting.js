const hre = require("hardhat");
const { ethers } = require("hardhat");

async function deploy_lrt_vesting() {
  console.log("Deploying the LRT Vesting contract...");

  //deploy LRTVesting
  const LRTVesting = await ethers.getContractFactory("LRTVesting");
  const lrtVestingInstance = await LRTVesting.deploy(
    "",
    ""
  );

  await lrtVestingInstance.deployed();

  console.log("LRT Vesting Contract deployed to:", lrtVestingInstance.address);
  console.log(
    "---------------------------------------------------------",
  );

  return lrtVestingInstance.address;
}
module.exports = deploy_lrt_vesting;

